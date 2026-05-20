// URL safety (Master Spec section 7 / Law: enforce in code).
// Pure, dependency-free, unit-tested. No network calls here — Safe Browsing
// is a separate async hook applied at set-time + periodic re-check.

const BLOCKED_SCHEMES = ["javascript:", "data:", "file:", "vbscript:"];
const PRIVATE_HOST_PATTERNS: RegExp[] = [
  /^localhost$/i,
  /^127\./,
  /^0\.0\.0\.0$/,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./, // 172.16.0.0 – 172.31.255.255
  /^169\.254\./, // link-local
  /^::1$/,
  /^fe80:/i, // ipv6 link-local
  /^f[cd][0-9a-f]{2}:/i, // ipv6 unique-local
];

// A small, extensible set of known open-redirect path signatures. Flagged, not
// silently allowed — laundering a malicious final URL through one of these
// should not get a clean pass.
const OPEN_REDIRECT_HINTS = [
  /[?&](url|next|redirect|return|dest|target|continue)=/i,
];

export type UrlVerdict =
  | { ok: true; normalized: string; domain: string; flags: string[] }
  | { ok: false; reason: string };

function isMixedScriptOrPunycode(host: string): boolean {
  if (host.includes("xn--")) return true; // punycode — flag for review
  // crude mixed-script: ASCII letters mixed with non-ASCII letters
  const hasAscii = /[a-z]/i.test(host);
  const hasNonAscii = /[^\x00-\x7F]/.test(host);
  return hasAscii && hasNonAscii;
}

export function validateDestination(
  raw: string,
  opts: { allowHttp?: boolean } = {}
): UrlVerdict {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return { ok: false, reason: "empty url" };

  const lower = trimmed.toLowerCase();
  for (const s of BLOCKED_SCHEMES) {
    if (lower.startsWith(s)) return { ok: false, reason: `blocked scheme ${s}` };
  }

  let u: URL;
  try {
    u = new URL(trimmed);
  } catch {
    return { ok: false, reason: "malformed url" };
  }

  if (u.protocol !== "https:" && !(opts.allowHttp && u.protocol === "http:")) {
    return { ok: false, reason: "https required" };
  }

  const host = u.hostname.toLowerCase();
  for (const p of PRIVATE_HOST_PATTERNS) {
    if (p.test(host)) return { ok: false, reason: "private/loopback host" };
  }

  const flags: string[] = [];
  if (isMixedScriptOrPunycode(host)) flags.push("homograph_review");
  if (OPEN_REDIRECT_HINTS.some((r) => r.test(u.search)))
    flags.push("open_redirect_review");

  // Normalize: lowercase host, strip default ports, drop fragment.
  u.hostname = host;
  u.hash = "";
  const normalized = u.toString();

  return { ok: true, normalized, domain: host, flags };
}
