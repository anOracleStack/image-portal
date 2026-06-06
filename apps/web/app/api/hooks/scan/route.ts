import { NextRequest, NextResponse } from "next/server";
import { ScanRequest, decideBand, EMBED_MODEL, EMBED_VERSION, matchRetryMessage } from "@ip/shared";
import { preprocess, StructuralVerifier, dhash, hashSimilarity } from "@ip/vision";
import { createAdminClient } from "@/lib/supabase-admin";
import { checkScanLimit } from "@/lib/subscription";
import crypto from "node:crypto";

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) {
    return NextResponse.json({ error: "x-api-key header required" }, { status: 401 });
  }

  let body: { imageUrl: string; portalSlug?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  if (!body.imageUrl || typeof body.imageUrl !== "string") {
    return NextResponse.json({ error: "imageUrl required" }, { status: 400 });
  }

  // Resolve API key to user
  const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");

  const db = createAdminClient();

  const { data: keyRow, error: keyErr } = await db
    .from("user_api_keys")
    .select("id, user_id")
    .eq("key_hash", keyHash)
    .single();

  if (keyErr || !keyRow) {
    return NextResponse.json({ error: "invalid api key" }, { status: 401 });
  }

  // Touch last_used_at
  await db
    .from("user_api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", keyRow.id);

  // Download the image from the given URL
  let imageResp: Response;
  try {
    imageResp = await fetch(body.imageUrl, { signal: AbortSignal.timeout(15_000) });
  } catch {
    return NextResponse.json({ error: "failed to fetch imageUrl" }, { status: 502 });
  }
  if (!imageResp.ok) {
    return NextResponse.json(
      { error: `imageUrl returned ${imageResp.status}` },
      { status: 502 }
    );
  }

  const imageBuffer = Buffer.from(await imageResp.arrayBuffer());
  const base64 = imageBuffer.toString("base64");

  // Preprocess for hashing / structural verification
  const queryPx = await preprocess(imageBuffer);
  const phash = dhash(queryPx);

  const { getEmbeddingProvider } = await import("@/lib/embedding");
  const embedding = await getEmbeddingProvider().embed(imageBuffer);

  // Scan the same way as the main scan endpoint
  const { data: candidates, error: candErr } = await db.rpc("match_fingerprints", {
    query_embedding: Array.from(embedding),
    match_count: 20,
    want_model: EMBED_MODEL,
    want_version: EMBED_VERSION,
  });
  if (candErr) {
    return NextResponse.json({ error: "retrieve failed" }, { status: 500 });
  }

  const verifier = new StructuralVerifier();

  let best: { c: any; fused: number; inliers: number; embSim: number } | null = null;

  for (const c of candidates ?? []) {
    const { data: blob } = await db.storage
      .from("portal-cache")
      .download(`${c.portal_image_id}.raw`);
    if (!blob) continue;
    const candPx = new Uint8Array(await blob.arrayBuffer());

    const v = verifier.verify(queryPx, candPx);
    const hSim = hashSimilarity(phash, dhash(candPx));
    const embSim = (c.similarity + 1) / 2;
    const fused = 0.55 * v.structuralScore + 0.3 * embSim + 0.15 * hSim;

    if (!best || fused > best.fused) best = { c, fused, inliers: v.inliers, embSim };
  }

  const sourceType = "unknown" as const;
  const band = best ? decideBand(best.fused, best.inliers, sourceType) : "low";
  const matched = band === "high";

  // Log scan event
  await db.from("scan_events").insert({
    portal_id: best?.c.portal_id ?? null,
    matched,
    confidence: best ? Number(best.fused.toFixed(4)) : 0,
    embedding_distance: best ? Number((1 - best.embSim).toFixed(4)) : null,
    inlier_count: best?.inliers ?? null,
    match_method: `embedding+${verifier.name}`,
    device_platform: "webhook",
    source: "webhook",
    source_type: sourceType,
    ip_hash: "webhook",
    opened_url: false,
  });

  if (matched && best) {
    await db
      .from("portals")
      .update({ last_scanned_at: new Date().toISOString() })
      .eq("id", best.c.portal_id);
  }

  // Track usage for billing
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const ownerId = best?.c.owner_id;
  let usageBlocked = false;
  if (ownerId && matched) {
    const limit = await checkScanLimit(ownerId, month);
    if (limit.allowed) {
      await db.rpc("increment_scan_usage", { p_user_id: ownerId, p_month: month });
    } else {
      usageBlocked = true;
    }
  }

  return NextResponse.json({
    band,
    matched,
    confidence: best ? Number(best.fused.toFixed(4)) : 0,
    embeddingDistance: best ? Number((1 - best.embSim).toFixed(4)) : null,
    inlierCount: best?.inliers ?? null,
    matchMethod: `embedding+${verifier.name}`,
    portal:
      matched && best
        ? {
            id: best.c.portal_id,
            title: best.c.title,
            slug: best.c.slug,
            destinationDomain: best.c.destination_domain,
          }
        : null,
    usageBlocked: usageBlocked || undefined,
    message: matchRetryMessage(band, matched),
  });
}

export async function GET() {
  return NextResponse.json({ error: "method not allowed" }, { status: 405 });
}
