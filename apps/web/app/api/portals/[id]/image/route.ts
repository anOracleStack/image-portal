import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { getEmbeddingProvider } from "@/lib/embedding";
import { preprocess, dhash, ahash, hashSimilarity } from "@ip/vision";
import { EMBED_MODEL, EMBED_VERSION } from "@ip/shared";
import crypto from "node:crypto";

const MAX_MB = Number(process.env.MAX_IMAGE_UPLOAD_MB ?? 10);
const COLLISION_HASH_SIM = 0.93; // near-dup of an active portal => block

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: portalId } = await params;
  const form = await req.formData();
  const file = form.get("file");
  const ownerId = String(form.get("ownerId") ?? "");
  if (!(file instanceof Blob) || !ownerId)
    return NextResponse.json({ error: "file + ownerId required" }, { status: 400 });
  if (file.size > MAX_MB * 1024 * 1024)
    return NextResponse.json({ error: "file too large" }, { status: 413 });

  const buf = Buffer.from(await file.arrayBuffer());
  const sha256 = crypto.createHash("sha256").update(buf).digest("hex");

  const px = await preprocess(buf);
  const dh = dhash(px);
  const ah = ahash(px);

  const db = createAdminClient();

  // Near-duplicate collision block (Master Spec 6.1 — scan-hijack defense).
  const { data: existing } = await db
    .from("portal_images")
    .select("dhash, portals!inner(status)")
    .eq("portals.status", "active");
  for (const e of existing ?? []) {
    if (e.dhash && hashSimilarity(dh, e.dhash) >= COLLISION_HASH_SIM)
      return NextResponse.json(
        { error: "near-duplicate of an existing active portal" },
        { status: 409 }
      );
  }

  // crude quality score: hash entropy proxy (warns only — never gates, Law 5)
  const distinctNibbles = new Set(dh.split("")).size;
  const quality_score = Number((distinctNibbles / 16).toFixed(3));

  const storagePath = `${ownerId}/${portalId}/${sha256}`;
  await db.storage.from("portal-images").upload(storagePath, buf, {
    contentType: file.type || "image/png",
    upsert: true,
  });
  // preprocessed cache for the scan verify stage
  await db.storage
    .from("portal-cache")
    .upload(`${portalId}.raw`, Buffer.from(px), { upsert: true });

  const { data: imgRow } = await db
    .from("portal_images")
    .insert({
      portal_id: portalId,
      owner_id: ownerId,
      storage_path: storagePath,
      mime_type: file.type,
      file_size: file.size,
      sha256,
      phash: dh,
      dhash: ah,
      quality_score,
    })
    .select("id")
    .single();

  // Catalog embedding (upload-time, latency-tolerant — Law 3)
  const provider = getEmbeddingProvider();
  const embedding = await provider.embed(buf);

  await db.from("portal_fingerprints").insert({
    portal_id: portalId,
    portal_image_id: imgRow!.id,
    phash: dh,
    dhash: ah,
    embedding: Array.from(embedding),
    embedding_model: EMBED_MODEL,
    embedding_version: EMBED_VERSION,
  });

  return NextResponse.json({ ok: true, quality_score });
}
