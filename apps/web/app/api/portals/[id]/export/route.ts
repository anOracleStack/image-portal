import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { getAppUrl } from "@/lib/app-url";
import QRCode from "qrcode";
import sharp from "sharp";

const SITE_ORIGIN = getAppUrl();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body: { type?: string } = await req.json().catch(() => ({}));
  const exportType = body.type ?? "qrcode";

  if (!["qrcode", "image_only", "image_qr"].includes(exportType)) {
    return NextResponse.json({ error: "Invalid export type" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Fetch portal
  const { data: portal, error: portalErr } = await admin
    .from("portals")
    .select("*")
    .eq("id", id)
    .single();

  if (portalErr || !portal) {
    return NextResponse.json({ error: "Portal not found" }, { status: 404 });
  }

  const publicUrl = `${SITE_ORIGIN}/p/${portal.slug}/go`;

  try {
    let buffer: Buffer;
    let mimeType: string;
    let storagePath: string;

    if (exportType === "qrcode") {
      // Generate standalone QR code PNG
      buffer = await QRCode.toBuffer(publicUrl, {
        type: "png",
        width: 1024,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      });
      mimeType = "image/png";
      storagePath = `${portal.owner_id}/${id}/qrcode.png`;

      await admin.storage.from("portal-exports").upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: true,
      });
    } else if (exportType === "image_only") {
      // Fetch the primary image
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

      buffer = Buffer.from(await blob.arrayBuffer());
      mimeType = img.mime_type;
      storagePath = `${portal.owner_id}/${id}/export-image.${mimeType === "image/png" ? "png" : "jpg"}`;

      await admin.storage.from("portal-exports").upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: true,
      });
    } else {
      // image_qr — composite: primary image + QR overlay
      const qrBuffer = await QRCode.toBuffer(publicUrl, {
        type: "png",
        width: 512,
        margin: 1,
        color: { dark: "#000000", light: "#ffffff" },
      });

      const { data: img } = await admin
        .from("portal_images")
        .select("storage_path")
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
        return NextResponse.json({ error: "Image not found" }, { status: 404 });
      }

      const imageBuffer = Buffer.from(await blob.arrayBuffer());
      const meta = await sharp(imageBuffer).metadata();
      const w = meta.width ?? 800;
      const h = meta.height ?? 600;

      // Resize QR to ~25% of image width, with white background padding
      const qrSize = Math.round(w * 0.25);
      const qrResized = await sharp(qrBuffer)
        .resize(qrSize, qrSize)
        .flatten({ background: { r: 255, g: 255, b: 255 } })
        .png()
        .toBuffer();

      // Composite QR onto bottom-right corner with 12px margin
      const margin = 12;
      buffer = await sharp(imageBuffer)
        .composite([
          {
            input: qrResized,
            top: h - qrSize - margin,
            left: w - qrSize - margin,
          },
        ])
        .png()
        .toBuffer();

      mimeType = "image/png";
      storagePath = `${portal.owner_id}/${id}/export-image-qr.png`;

      await admin.storage.from("portal-exports").upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: true,
      });
    }

    // Get public URL
    const { data: urlData } = admin.storage
      .from("portal-exports")
      .getPublicUrl(storagePath);
    const fileUrl = urlData?.publicUrl ?? "";

    // DB enum: image_only | image_qr | poster (standalone QR)
    const dbExportType =
      exportType === "qrcode" ? "poster" : exportType;

    await admin.from("portal_exports").insert({
      portal_id: id,
      export_type: dbExportType,
      file_url: fileUrl,
    });

    return NextResponse.json({ ok: true, url: fileUrl, type: exportType });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Export failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
