import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase-admin";

const SAFE_FILE = /^draft-(ref-\d+|enhanced)\.jpg$/;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: portalId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const file = req.nextUrl.searchParams.get("file") ?? "";
  if (!SAFE_FILE.test(file)) {
    return NextResponse.json({ error: "Invalid file" }, { status: 400 });
  }

  const db = createAdminClient();
  const { data: portal } = await db
    .from("portals")
    .select("owner_id")
    .eq("id", portalId)
    .single();

  if (!portal || portal.owner_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const path = `${portal.owner_id}/${portalId}/${file}`;
  const { data: blob, error } = await db.storage.from("portal-images").download(path);

  if (error || !blob) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  return new NextResponse(blob, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "private, max-age=60",
    },
  });
}
