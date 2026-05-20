import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  const db = createAdminClient();

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "20", 10) || 20, 1), 100);
  const offset = Math.max(parseInt(searchParams.get("offset") ?? "0", 10) || 0, 0);

  const { data, error } = await db
    .from("scan_events")
    .select("id, portal_id, matched, confidence, inlier_count, created_at, portals!inner(title)")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: "failed to fetch scan history" }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
