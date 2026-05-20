import { NextRequest, NextResponse } from "next/server";
import { ScanRequest, decideBand, EMBED_MODEL, EMBED_VERSION } from "@ip/shared";
import { preprocess, StructuralVerifier, dhash, hashSimilarity } from "@ip/vision";
import { createAdminClient } from "@/lib/supabase-admin";
import { checkScanLimit } from "@/lib/subscription";
import crypto from "node:crypto";

// Two-stage retrieve-then-verify (Master Spec §6 / Law 1).
// Stage A: pgvector HNSW cosine top-K (active + correct embedding_version).
// Stage B: structural verification on preprocessed pixels.
// Hard rate-limit + fingerprints never client-selectable (Master Spec 7).

const RATE = new Map<string, { n: number; t: number }>();
function rateLimited(key: string, max = 30, windowMs = 60_000): boolean {
  const now = Date.now();
  const e = RATE.get(key);
  if (!e || now - e.t > windowMs) {
    RATE.set(key, { n: 1, t: now });
    return false;
  }
  e.n++;
  return e.n > max;
}

function ipHash(req: NextRequest): string {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return crypto
    .createHash("sha256")
    .update(ip + (process.env.IP_HASH_SALT ?? "ip"))
    .digest("hex")
    .slice(0, 32);
}

export async function POST(req: NextRequest) {
  const parsed = ScanRequest.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  const body = parsed.data;

  const iph = ipHash(req);
  if (rateLimited(`${iph}:${body.devicePlatform}`))
    return NextResponse.json({ error: "rate limited" }, { status: 429 });

  // Law 4: refuse mismatched model/version outright.
  if (
    body.embeddingModel !== EMBED_MODEL ||
    body.embeddingVersion !== EMBED_VERSION
  )
    return NextResponse.json(
      { error: "embedding model/version mismatch" },
      { status: 409 }
    );

  const db = createAdminClient();

  // STAGE A — pgvector HNSW cosine retrieve (RPC defined in 0002_match_rpc.sql).
  // Only active + public + correct-version rows are returned by the function.
  const { data: candidates, error } = await db.rpc("match_fingerprints", {
    query_embedding: Array.from(body.embedding),
    match_count: 20,
    want_model: EMBED_MODEL,
    want_version: EMBED_VERSION,
  });
  if (error)
    return NextResponse.json({ error: "retrieve failed" }, { status: 500 });

  const queryPx = body.frameBase64
    ? await preprocess(Buffer.from(body.frameBase64, "base64"))
    : null;
  const verifier = new StructuralVerifier();

  let best:
    | { c: any; fused: number; inliers: number; embSim: number }
    | null = null;

  for (const c of candidates ?? []) {
    // candidate pixels: served from a preprocessed-cache bucket keyed by image
    const { data: blob } = await db.storage
      .from("portal-cache")
      .download(`${c.portal_image_id}.raw`);
    if (!blob) continue;
    const candPx = new Uint8Array(await blob.arrayBuffer());

    const v = queryPx
      ? verifier.verify(queryPx, candPx)
      : { structuralScore: 0, inliers: 0 };
    const hSim = hashSimilarity(body.phash, dhash(candPx));
    const embSim = (c.similarity + 1) / 2;
    const fused = 0.55 * v.structuralScore + 0.3 * embSim + 0.15 * hSim;

    if (!best || fused > best.fused)
      best = { c, fused, inliers: v.inliers, embSim };
  }

  const sourceType = body.sourceType;
  const band = best
    ? decideBand(best.fused, best.inliers, sourceType)
    : "low";
  const matched = band === "high";

  // log scan_event (ip hashed — Master Spec 7)
  await db.from("scan_events").insert({
    portal_id: best?.c.portal_id ?? null,
    matched,
    confidence: best ? Number(best.fused.toFixed(4)) : 0,
    embedding_distance: best ? Number((1 - best.embSim).toFixed(4)) : null,
    inlier_count: best?.inliers ?? null,
    match_method: `embedding+${verifier.name}`,
    device_platform: body.devicePlatform,
    source: body.source,
    source_type: sourceType,
    ip_hash: iph,
    opened_url: false,
  });

  if (matched && best) {
    await db
      .from("portals")
      .update({ last_scanned_at: new Date().toISOString() })
      .eq("id", best.c.portal_id);
  }

  // Track usage for billing month (respect owner's plan limit)
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const ownerId = best?.c.owner_id;
  let usageBlocked = false;
  if (ownerId && matched) {
    const limit = await checkScanLimit(ownerId, month);
    if (limit.allowed) {
      await db.rpc("increment_scan_usage", {
        p_user_id: ownerId,
        p_month: month,
      });
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
    message: matched
      ? undefined
      : band === "medium"
        ? "Possible match — rescan for a clearer result."
        : "No portal found. Move closer, reduce glare, hold steady.",
  });
}
