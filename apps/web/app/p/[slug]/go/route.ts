import { NextRequest, NextResponse } from "next/server";
import { validateDestination } from "@ip/shared";
import { createAdminClient } from "@/lib/supabase-admin";
import { checkSafeBrowsing } from "@/lib/safe-browsing";

// Direct slug link (typed or shared URL). Never auto-trusts the destination:
// re-validates at redirect time and shows an interstitial for flagged URLs.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const db = createAdminClient();

  const { data: portal } = await db
    .from("portals")
    .select("id,destination_url,status,visibility")
    .eq("slug", slug)
    .maybeSingle();

  if (!portal || portal.status !== "active" || portal.visibility !== "public")
    return new NextResponse("Portal not available", { status: 404 });

  const verdict = validateDestination(portal.destination_url);
  if (!verdict.ok)
    return new NextResponse(`Destination blocked: ${verdict.reason}`, {
      status: 422,
    });

  const sb = await checkSafeBrowsing(verdict.normalized);
  if (!sb.safe) {
    return new NextResponse(
      `Destination blocked by Safe Browsing: ${sb.threats.join(", ")}`,
      { status: 422 }
    );
  }

  await db.from("scan_events").insert({
    portal_id: portal.id,
    matched: true,
    match_method: "qr",
    source: "qr",
    source_type: "unknown",
    opened_url: verdict.flags.length === 0,
  });
  await db.rpc("increment_scans", { p_id: portal.id });

  // Flagged (homograph / open-redirect): interstitial, not silent redirect.
  if (verdict.flags.length > 0) {
    return new NextResponse(
      `<!doctype html><meta name="viewport" content="width=device-width">
       <body style="font-family:system-ui;padding:2rem;max-width:32rem;margin:auto">
       <h2>Confirm destination</h2>
       <p>This portal points to <b>${verdict.domain}</b>.</p>
       <p style="color:#a00">Review flags: ${verdict.flags.join(", ")}</p>
       <p><a href="${verdict.normalized}" rel="noopener noreferrer">Continue to ${verdict.domain}</a></p>
       </body>`,
      { status: 200, headers: { "content-type": "text/html" } }
    );
  }

  return NextResponse.redirect(verdict.normalized, 302);
}
