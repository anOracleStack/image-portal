import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createAdminClient();

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "20", 10) || 20, 1), 100);
  const offset = Math.max(parseInt(searchParams.get("offset") ?? "0", 10) || 0, 0);

  // Restrict to the caller's own portals — scan_events is cross-tenant otherwise.
  const { data: portals } = await db
    .from("portals")
    .select("id")
    .eq("owner_id", user.id);
  const portalIds = portals?.map((p) => p.id) ?? [];

  if (portalIds.length === 0) {
    return NextResponse.json({ events: [], total: 0 });
  }

  const { data, error, count } = await db
    .from("scan_events")
    .select(
      "id, portal_id, matched, confidence, inlier_count, created_at, device_platform, source, source_type, portals!inner(title)",
      { count: "exact" }
    )
    .in("portal_id", portalIds)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: "failed to fetch scan history" }, { status: 500 });
  }

  return NextResponse.json({ events: data ?? [], total: count ?? 0 });
}
