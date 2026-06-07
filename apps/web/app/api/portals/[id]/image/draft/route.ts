import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase-admin";
import { workshopBase } from "@/lib/portal-workshop";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: portalId } = await params;
  const file = req.nextUrl.searchParams.get("file");
  if (!file || file.includes("..") || file.includes("/")) {
    return NextResponse.json({ error: "Invalid file" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdminClient();
  const { data: portal } = await db
    .from("portals")
    .select("owner_id")
    .eq("id", portalId)
    .single();

  if (!portal || portal.owner_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const path = `${workshopBase(portal.owner_id, portalId)}/${file}`;
  const { data: blob, error } = await db.storage.from("portal-images").download(path);
  if (error || !blob) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const buf = Buffer.from(await blob.arrayBuffer());
  const contentType = file.endsWith(".json")
    ? "application/json"
    : file.endsWith(".png")
      ? "image/png"
      : "image/jpeg";

  return new NextResponse(buf, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, no-cache",
    },
  });
}
