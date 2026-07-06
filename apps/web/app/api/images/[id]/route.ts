import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
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
      .select("storage_path, mime_type, owner_id, portals!inner(status, visibility)")
      .eq("id", id)
      .single();

    if (error || !image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Public+active portal images are servable to anyone (the private storage
    // bucket forces access through this route). Otherwise only the owner may
    // fetch — private/suspended portal images must not leak by UUID.
    const portal = image.portals as unknown as { status: string; visibility: string };
    const isPublic = portal.status === "active" && portal.visibility === "public";
    const isPrivate = !isPublic;

    if (isPrivate) {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || user.id !== image.owner_id) {
        return NextResponse.json({ error: "Image not found" }, { status: 404 });
      }
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
        "Cache-Control": isPublic
          ? "public, max-age=31536000, immutable"
          : "private, no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
