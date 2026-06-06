import { createAdminClient } from "@/lib/supabase-admin";
import { getEmbeddingProvider } from "@/lib/embedding";
import { preprocess, dhash, ahash, hashSimilarity } from "@ip/vision";
import { EMBED_MODEL, EMBED_VERSION } from "@ip/shared";
import crypto from "node:crypto";

const COLLISION_HASH_SIM = 0.93;

export async function persistPortalImage(opts: {
  portalId: string;
  ownerId: string;
  buf: Buffer;
  mimeType: string;
  activatePortal?: boolean;
}): Promise<{ imageId: string; quality_score: number }> {
  const { portalId, ownerId, buf, mimeType, activatePortal = false } = opts;
  const sha256 = crypto.createHash("sha256").update(buf).digest("hex");
  const px = await preprocess(buf);
  const dh = dhash(px);
  const ah = ahash(px);

  const db = createAdminClient();

  const { data: existing } = await db
    .from("portal_images")
    .select("dhash, portals!inner(status)")
    .eq("portals.status", "active");
  for (const e of existing ?? []) {
    if (e.dhash && hashSimilarity(dh, e.dhash) >= COLLISION_HASH_SIM) {
      throw new Error("near-duplicate of an existing active portal");
    }
  }

  const distinctNibbles = new Set(dh.split("")).size;
  const quality_score = Number((distinctNibbles / 16).toFixed(3));
  const storagePath = `${ownerId}/${portalId}/${sha256}`;

  await db.storage.from("portal-images").upload(storagePath, buf, {
    contentType: mimeType,
    upsert: true,
  });

  const { data: imgRow, error: imgErr } = await db
    .from("portal_images")
    .insert({
      portal_id: portalId,
      owner_id: ownerId,
      storage_path: storagePath,
      mime_type: mimeType,
      file_size: buf.length,
      sha256,
      phash: dh,
      dhash: ah,
      quality_score,
    })
    .select("id")
    .single();

  if (imgErr || !imgRow) throw new Error(imgErr?.message ?? "image insert failed");

  await db.storage
    .from("portal-cache")
    .upload(`${imgRow.id}.raw`, Buffer.from(px), { upsert: true });

  const provider = getEmbeddingProvider();
  const embedding = await provider.embed(buf);

  await db.from("portal_fingerprints").insert({
    portal_id: portalId,
    portal_image_id: imgRow.id,
    phash: dh,
    dhash: ah,
    embedding: Array.from(embedding),
    embedding_model: EMBED_MODEL,
    embedding_version: EMBED_VERSION,
  });

  if (activatePortal) {
    await db
      .from("portals")
      .update({ status: "active", updated_at: new Date().toISOString() })
      .eq("id", portalId);
  }

  return { imageId: imgRow.id, quality_score };
}
