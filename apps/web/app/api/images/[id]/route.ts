import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = createAdminClient();

    const { data: image, error } = await db
      .from("portal_images")
      .select("storage_path, mime_type")
      .eq("id", id)
      .single();

    if (error || !image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    const { data: blob } = await db.storage
      .from("portal-images")
      .download(image.storage_path);

    if (!blob) {
      return NextResponse.json({ error: "File not found in storage" }, { status: 404 });
    }

    return new NextResponse(blob, {
      headers: {
        "Content-Type": image.mime_type,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
