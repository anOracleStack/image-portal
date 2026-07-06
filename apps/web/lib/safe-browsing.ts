import "server-only";

/**
 * Optional Google Safe Browsing lookup. Accepts either env var name:
 * `SAFE_BROWSING_API_KEY` (documented in ENV_KEYS.md / .env.example) or the
 * legacy `GOOGLE_SAFE_BROWSING_API_KEY`. Previously only the latter was read,
 * so following the docs left the check silently disabled.
 */
export async function checkSafeBrowsing(url: string): Promise<{
  safe: boolean;
  threats: string[];
}> {
  const key =
    process.env.SAFE_BROWSING_API_KEY ??
    process.env.GOOGLE_SAFE_BROWSING_API_KEY;
  if (!key) return { safe: true, threats: [] };

  try {
    const res = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client: {
            clientId: "image-portal",
            clientVersion: "1.0.0",
          },
          threatInfo: {
            threatTypes: [
              "MALWARE",
              "SOCIAL_ENGINEERING",
              "UNWANTED_SOFTWARE",
              "POTENTIALLY_HARMFUL_APPLICATION",
            ],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: [{ url }],
          },
        }),
      }
    );

    if (!res.ok) return { safe: true, threats: [] };

    const data = (await res.json()) as { matches?: { threatType: string }[] };
    const threats = (data.matches ?? []).map((m) => m.threatType);
    return { safe: threats.length === 0, threats };
  } catch {
    return { safe: true, threats: [] };
  }
}
