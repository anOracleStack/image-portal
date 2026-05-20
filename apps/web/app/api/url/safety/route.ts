import { NextRequest, NextResponse } from "next/server";
import { validateDestination } from "@ip/shared";
import { checkSafeBrowsing } from "@/lib/safe-browsing";

export async function POST(req: NextRequest) {
  const { url } = (await req.json()) as { url?: string };
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "url required" }, { status: 400 });
  }

  const verdict = validateDestination(url);
  if (!verdict.ok) {
    return NextResponse.json({
      ok: false,
      reason: verdict.reason,
      flags: [],
      safeBrowsing: { safe: true, threats: [] },
    });
  }

  const sb = await checkSafeBrowsing(verdict.normalized);
  if (!sb.safe) {
    return NextResponse.json({
      ok: false,
      reason: `Google Safe Browsing: ${sb.threats.join(", ")}`,
      flags: verdict.flags,
      safeBrowsing: sb,
    });
  }

  return NextResponse.json({
    ok: true,
    normalized: verdict.normalized,
    domain: verdict.domain,
    flags: verdict.flags,
    safeBrowsing: sb,
  });
}
