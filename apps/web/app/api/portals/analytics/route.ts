import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = createAdminClient();

    // Get all portal IDs belonging to this user
    const { data: portals } = await db
      .from("portals")
      .select("id, title")
      .eq("owner_id", user.id);

    const portalIds = portals?.map((p) => p.id) ?? [];
    const portalMap = new Map(portals?.map((p) => [p.id, p.title]) ?? []);

    if (portalIds.length === 0) {
      return NextResponse.json({
        dailyScans: [],
        matchRate: { matched: 0, unmatched: 0 },
        devicePlatforms: [],
        sources: [],
        topPortals: [],
      });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: scans, error } = await db
      .from("scan_events")
      .select("created_at, matched, device_platform, source, portal_id")
      .in("portal_id", portalIds)
      .gte("created_at", thirtyDaysAgo.toISOString());

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Pre-fill all 30 days with 0
    const dailyMap = new Map<string, number>();
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dailyMap.set(d.toISOString().slice(0, 10), 0);
    }

    let matched = 0;
    let unmatched = 0;
    const platformMap = new Map<string, number>();
    const sourceMap = new Map<string, number>();
    const portalScanMap = new Map<string, number>();

    for (const scan of scans ?? []) {
      const day = scan.created_at.slice(0, 10);
      dailyMap.set(day, (dailyMap.get(day) ?? 0) + 1);

      if (scan.matched) matched++;
      else unmatched++;

      const plat = scan.device_platform || "unknown";
      platformMap.set(plat, (platformMap.get(plat) ?? 0) + 1);

      const src = scan.source || "unknown";
      sourceMap.set(src, (sourceMap.get(src) ?? 0) + 1);

      if (scan.portal_id) {
        portalScanMap.set(scan.portal_id, (portalScanMap.get(scan.portal_id) ?? 0) + 1);
      }
    }

    const topPortals = [...portalScanMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id, count]) => ({
        portal_id: id,
        title: portalMap.get(id) ?? "Unknown",
        count,
      }));

    return NextResponse.json({
      dailyScans: [...dailyMap.entries()].map(([date, count]) => ({ date, count })),
      matchRate: { matched, unmatched },
      devicePlatforms: [...platformMap.entries()].map(([platform, count]) => ({ platform, count })),
      sources: [...sourceMap.entries()].map(([source, count]) => ({ source, count })),
      topPortals,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
