import { decideBand, type SourceType, type Band } from "@ip/shared";
import type { VectorIndex } from "./retrieve";
import type { GeometricVerifier } from "./verify";
import { dhash, hashSimilarity } from "./hash";

// Orchestration of the two-stage gate (Master Spec section 6 / Law 1).
// Stage A recalls top-K by embedding. Stage B verifies geometry on the
// preprocessed pixels. A close embedding with weak geometry => LOW band.

export interface RecognizeInput {
  queryEmbedding: Float32Array;
  queryPixels: Uint8Array; // output of preprocess()
  queryPhash: string;
  sourceType: SourceType;
  topK?: number;
}

export interface RecognizeResult {
  band: Band;
  matched: boolean;
  confidence: number;
  embeddingDistance: number | null;
  inlierCount: number | null;
  matchMethod: string;
  portal: {
    id: string;
    title: string;
    slug: string;
    destinationDomain: string;
  } | null;
}

export interface CandidatePixelLoader {
  // production: fetch + preprocess the candidate's stored image (cached)
  load(portalImageId: string): Promise<Uint8Array>;
}

export async function recognize(
  input: RecognizeInput,
  index: VectorIndex,
  verifier: GeometricVerifier,
  loader: CandidatePixelLoader
): Promise<RecognizeResult> {
  const k = input.topK ?? 20;
  const candidates = index.topK(input.queryEmbedding, k);

  let best:
    | {
        cand: (typeof candidates)[number];
        fused: number;
        inliers: number;
      }
    | null = null;

  for (const cand of candidates) {
    const candPx = await loader.load(cand.row.portalImageId);
    const v = verifier.verify(input.queryPixels, candPx);
    const hashSim = hashSimilarity(input.queryPhash, dhash(candPx));

    // Fusion: structural agreement dominates (it is the instance signal),
    // embedding + hash are corroborating. The hard geometric floor lives in
    // decideBand via inliers — fusion alone never promotes a no-geometry hit.
    const fused =
      0.55 * v.structuralScore +
      0.3 * cand.embeddingSim +
      0.15 * hashSim;

    if (!best || fused > best.fused || (fused === best.fused && v.inliers > best.inliers)) {
      best = { cand, fused, inliers: v.inliers };
    }
  }

  if (!best) {
    return {
      band: "low",
      matched: false,
      confidence: 0,
      embeddingDistance: null,
      inlierCount: null,
      matchMethod: "none",
      portal: null,
    };
  }

  const band = decideBand(best.fused, best.inliers, input.sourceType);
  const matched = band === "high";

  return {
    band,
    matched,
    confidence: Number(best.fused.toFixed(4)),
    embeddingDistance: Number((1 - best.cand.embeddingSim).toFixed(4)),
    inlierCount: best.inliers,
    matchMethod: `embedding+${verifier.name}`,
    portal: matched
      ? {
          id: best.cand.row.portalId,
          title: best.cand.row.title,
          slug: best.cand.row.slug,
          destinationDomain: best.cand.row.destinationDomain,
        }
      : null,
  };
}
