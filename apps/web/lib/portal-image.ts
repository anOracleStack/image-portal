import { createAdminClient } from "@/lib/supabase-admin";
import { getEmbeddingProvider } from "@/lib/embedding";
import { ensureStorageBuckets } from "@/lib/ensure-storage-buckets";
import {
  STORAGE_BUCKETS,
  storageBucketErrorMessage,
} from "@/lib/storage-buckets";
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

  // The `phash` column stores the dHash (see insert below), so compare the new
  // dHash against it — comparing against `dhash` (which holds an aHash) is a
  // cross-algorithm comparison that never trips the gate.
  const { data: existing } = await db
    .from("portal_images")
    .select("phash, portals!inner(status)")
    .eq("portals.status", "active");
  for (const e of existing ?? []) {
    if (e.phash && hashSimilarity(dh, e.phash) >= COLLISION_HASH_SIM) {
      throw new Error("near-duplicate of an existing active portal");
    }
  }

  const distinctNibbles = new Set(dh.split("")).size;
  const quality_score = Number((distinctNibbles / 16).toFixed(3));
  const storagePath = `${ownerId}/${portalId}/${sha256}`;

  await ensureStorageBuckets(
    STORAGE_BUCKETS.PORTAL_IMAGES,
    STORAGE_BUCKETS.PORTAL_CACHE,
  );

  const { error: imageUploadErr } = await db.storage
    .from(STORAGE_BUCKETS.PORTAL_IMAGES)
    .upload(storagePath, buf, {
      contentType: mimeType,
      upsert: true,
    });
  if (imageUploadErr) {
    throw new Error(
      storageBucketErrorMessage(
        STORAGE_BUCKETS.PORTAL_IMAGES,
        imageUploadErr.message,
      ),
    );
  }

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

  if (imgErr || !imgRow) {
    await db.storage.from(STORAGE_BUCKETS.PORTAL_IMAGES).remove([storagePath]);
    throw new Error(imgErr?.message ?? "image insert failed");
  }

  const { error: cacheUploadErr } = await db.storage
    .from(STORAGE_BUCKETS.PORTAL_CACHE)
    .upload(`${imgRow.id}.raw`, Buffer.from(px), { upsert: true });
  if (cacheUploadErr) {
    await db.storage.from(STORAGE_BUCKETS.PORTAL_IMAGES).remove([storagePath]);
    await db.from("portal_images").delete().eq("id", imgRow.id);
    throw new Error(
      storageBucketErrorMessage(
        STORAGE_BUCKETS.PORTAL_CACHE,
        cacheUploadErr.message,
      ),
    );
  }

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
