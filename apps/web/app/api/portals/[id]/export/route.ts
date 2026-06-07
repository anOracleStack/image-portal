import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body: { type?: string } = await req.json().catch(() => ({}));
  const exportType = body.type ?? "image_only";

  if (exportType !== "image_only") {
    return NextResponse.json(
      { error: "Only image export is supported — visual scan, no QR codes." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  const { data: portal, error: portalErr } = await admin
    .from("portals")
    .select("*")
    .eq("id", id)
    .single();

  if (portalErr || !portal) {
    return NextResponse.json({ error: "Portal not found" }, { status: 404 });
  }

  try {
    const { data: img } = await admin
      .from("portal_images")
      .select("storage_path, mime_type")
      .eq("portal_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!img) {
      return NextResponse.json({ error: "No images to export" }, { status: 404 });
    }

    const { data: blob } = await admin.storage
      .from("portal-images")
      .download(img.storage_path);

    if (!blob) {
      return NextResponse.json({ error: "Image not found in storage" }, { status: 404 });
    }

    const buffer = Buffer.from(await blob.arrayBuffer());
    const mimeType = img.mime_type;
    const storagePath = `${portal.owner_id}/${id}/export-image.${mimeType === "image/png" ? "png" : "jpg"}`;

    await admin.storage.from("portal-exports").upload(storagePath, buffer, {
      contentType: mimeType,
      upsert: true,
    });

    const { data: urlData } = admin.storage
      .from("portal-exports")
      .getPublicUrl(storagePath);
    const fileUrl = urlData?.publicUrl ?? "";

    await admin.from("portal_exports").insert({
      portal_id: id,
      export_type: "image_only",
      file_url: fileUrl,
    });

    return NextResponse.json({ ok: true, url: fileUrl, type: exportType });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Export failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
