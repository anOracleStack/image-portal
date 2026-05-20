import { NORM_SIZE } from "./preprocess";

// STAGE B (Master Spec 2.2 / Law 1): the verification gate. Embedding ANN is
// recall; THIS decides "same image vs merely similar". Interface is stable so
// ORB+RANSAC (MVP) -> SuperPoint+LightGlue (V2) swap behind it without touching
// the pipeline. The default below is a real, dependency-free structural
// verifier strong enough for the honest V1 scope (screen + clean print).

export interface VerifyResult {
  structuralScore: number; // 0..1 mean local agreement
  inliers: number; // geometrically-consistent blocks (RANSAC-inlier analog)
}

export interface GeometricVerifier {
  readonly name: string;
  verify(query: Uint8Array, candidate: Uint8Array): VerifyResult;
}

const GRID = 16; // 16x16 = 256 local blocks
const BLOCK = NORM_SIZE / GRID;

interface BlockSig {
  mean: number;
  gx: number; // mean horizontal gradient
  gy: number; // mean vertical gradient
  energy: number; // local contrast
}

function signatures(px: Uint8Array): BlockSig[] {
  const sigs: BlockSig[] = [];
  for (let by = 0; by < GRID; by++) {
    for (let bx = 0; bx < GRID; bx++) {
      let sum = 0;
      let gx = 0;
      let gy = 0;
      let sq = 0;
      let n = 0;
      for (let y = 1; y < BLOCK; y++) {
        for (let x = 1; x < BLOCK; x++) {
          const px0 = bx * BLOCK + x;
          const py0 = by * BLOCK + y;
          const v = px[py0 * NORM_SIZE + px0]!;
          const vl = px[py0 * NORM_SIZE + (px0 - 1)]!;
          const vu = px[(py0 - 1) * NORM_SIZE + px0]!;
          sum += v;
          sq += v * v;
          gx += v - vl;
          gy += v - vu;
          n++;
        }
      }
      const mean = sum / n;
      const variance = Math.max(0, sq / n - mean * mean);
      sigs.push({
        mean,
        gx: gx / n,
        gy: gy / n,
        energy: Math.sqrt(variance),
      });
    }
  }
  return sigs;
}

/** MVP default. Real, runnable, no native deps. Discriminates same-image
 *  (under brightness/blur/mild crop, already neutralized by preprocess) from a
 *  different composition even when a global embedding is deceptively close. */
export class StructuralVerifier implements GeometricVerifier {
  readonly name = "structural-v1";

  verify(query: Uint8Array, candidate: Uint8Array): VerifyResult {
    const a = signatures(query);
    const b = signatures(candidate);

    let corrSum = 0;
    let weight = 0;
    let inliers = 0;

    // Feature-based verification keys on TEXTURE, not smooth regions. A flat
    // gradient agreeing with another flat gradient is not evidence of "same
    // image". Blocks below the texture floor never count as geometric inliers
    // and barely contribute to the structural score.
    const ENERGY_FLOOR = 14;

    for (let i = 0; i < a.length; i++) {
      const sa = a[i]!;
      const sb = b[i]!;

      // local gradient-orientation agreement (cosine of gradient vectors)
      const dot = sa.gx * sb.gx + sa.gy * sb.gy;
      const na = Math.hypot(sa.gx, sa.gy) + 1e-6;
      const nb = Math.hypot(sb.gx, sb.gy) + 1e-6;
      const orient = dot / (na * nb); // -1..1

      // local energy agreement (structure presence, brightness-invariant)
      const eMax = Math.max(sa.energy, sb.energy) + 1e-6;
      const eAgree = 1 - Math.abs(sa.energy - sb.energy) / eMax;

      const textured = sa.energy > ENERGY_FLOOR && sb.energy > ENERGY_FLOOR;
      const w = Math.min(sa.energy, sb.energy); // weight by structural content
      corrSum += w * (0.6 * Math.max(0, orient) + 0.4 * Math.max(0, eAgree));
      weight += w;

      // a block is a geometric inlier only if it is TEXTURED in both images
      // AND orientation + energy agree — a different composition fails this
      // even when a global embedding is deceptively close.
      if (textured && orient > 0.62 && eAgree > 0.6) inliers++;
    }

    return { structuralScore: corrSum / (weight + 1e-6), inliers };
  }
}
