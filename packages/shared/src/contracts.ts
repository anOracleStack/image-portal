import { z } from "zod";

// ---------------------------------------------------------------------------
// Embedding-space consistency invariant (Master Spec 2.4 / Law 4)
// One pinned model + version, both sides. Wrong-version rows are refused.
// ---------------------------------------------------------------------------
export const EMBED_MODEL = "dinov2_vitb14" as const; // pinned default; swappable
export const EMBED_VERSION = 1 as const;
export const EMBED_DIM = 768 as const;

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------
export const PortalStatus = z.enum(["active", "inactive", "suspended"]);
export const ScanMode = z.enum(["image", "hybrid"]);
export const Visibility = z.enum(["public", "private"]);
export const SourceType = z.enum(["screen", "print", "unknown"]);
export const ScanSource = z.enum(["app", "pwa", "qr"]);

export type PortalStatus = z.infer<typeof PortalStatus>;
export type SourceType = z.infer<typeof SourceType>;

// ---------------------------------------------------------------------------
// Confidence bands (Master Spec 6.3 — binary matching is forbidden)
// Screen scans must be near-exact; print tolerates lighting/perspective drift.
// ---------------------------------------------------------------------------
export type Band = "high" | "medium" | "low";

export interface BandThresholds {
  highScore: number; // fused score floor for "high"
  medScore: number; // fused score floor for "medium"
  highInliers: number; // geometric inliers floor for "high"
  medInliers: number; // geometric inliers floor for "medium"
}

// Calibrated for StructuralVerifier (MVP default). These are VERIFIER-SPECIFIC
// config — when ORB+RANSAC / SuperPoint+LightGlue is swapped in (their env),
// re-calibrate inlier floors against that verifier's scale. The band logic and
// the dual-signal gate are what is invariant, not these numbers.
export const THRESHOLDS: Record<SourceType, BandThresholds> = {
  screen: { highScore: 0.9, medScore: 0.75, highInliers: 8, medInliers: 4 },
  print: { highScore: 0.82, medScore: 0.68, highInliers: 7, medInliers: 4 },
  unknown: { highScore: 0.86, medScore: 0.72, highInliers: 7, medInliers: 4 },
};

/** Fuse embedding similarity + geometric verification into a tiered band.
 *  Both signals must agree for "high" — this is the retrieve-then-verify gate.
 *  A close embedding with no geometric support is NOT a match. */
export function decideBand(
  fusedScore: number,
  inliers: number,
  sourceType: SourceType
): Band {
  const t = THRESHOLDS[sourceType];
  if (fusedScore >= t.highScore && inliers >= t.highInliers) return "high";
  if (fusedScore >= t.medScore && inliers >= t.medInliers) return "medium";
  return "low";
}

// ---------------------------------------------------------------------------
// API contracts (Zod — Law: validate every boundary)
// ---------------------------------------------------------------------------
export const ScanRequest = z.object({
  // Query embedding is computed ON-DEVICE (Law 3). Server trusts the vector,
  // not a raw frame, on the hot path. Frame is optional for the verify stage.
  embedding: z.array(z.number()).length(EMBED_DIM),
  embeddingModel: z.literal(EMBED_MODEL),
  embeddingVersion: z.literal(EMBED_VERSION),
  phash: z.string().min(8),
  frameBase64: z.string().optional(), // optional, for Stage B verification
  sourceType: SourceType.default("unknown"),
  source: ScanSource.default("app"),
  devicePlatform: z.enum(["ios", "android", "web"]),
});
export type ScanRequest = z.infer<typeof ScanRequest>;

export const ScanResponse = z.object({
  band: z.enum(["high", "medium", "low"]),
  matched: z.boolean(),
  confidence: z.number(),
  embeddingDistance: z.number().nullable(),
  inlierCount: z.number().nullable(),
  matchMethod: z.string(),
  portal: z
    .object({
      id: z.string(),
      title: z.string(),
      slug: z.string(),
      destinationDomain: z.string(), // domain only — never the full URL pre-tap
    })
    .nullable(),
  message: z.string().optional(),
});
export type ScanResponse = z.infer<typeof ScanResponse>;

export const CreatePortalInput = z.object({
  title: z.string().min(1).max(120),
  destinationUrl: z.string().url(),
  scanMode: ScanMode.default("image"),
  visibility: Visibility.default("public"),
});
export type CreatePortalInput = z.infer<typeof CreatePortalInput>;
