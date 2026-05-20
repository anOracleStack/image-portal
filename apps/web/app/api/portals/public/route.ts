import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET() {
  const db = createAdminClient();

  const { data, error } = await db
    .from("portals")
    .select("id, title, slug, destination_url, total_scans")
    .eq("visibility", "public")
    .eq("status", "active")
    .order("total_scans", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "failed to fetch portals" }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
