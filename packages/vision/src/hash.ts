import { NORM_SIZE } from "./preprocess";

// Perceptual hashing on the normalized grayscale buffer. Used as a cheap
// prefilter (Stage 0) and as one input to the verification fusion.

function downscale(
  px: Uint8Array,
  size: number,
  out: number
): Float64Array {
  const block = size / out;
  const grid = new Float64Array(out * out);
  for (let by = 0; by < out; by++) {
    for (let bx = 0; bx < out; bx++) {
      let sum = 0;
      let n = 0;
      for (let y = 0; y < block; y++) {
        for (let x = 0; x < block; x++) {
          const sx = Math.floor(bx * block + x);
          const sy = Math.floor(by * block + y);
          sum += px[sy * size + sx]!;
          n++;
        }
      }
      grid[by * out + bx] = sum / n;
    }
  }
  return grid;
}

/** 64-bit dHash as a 16-char hex string. */
export function dhash(px: Uint8Array): string {
  const g = downscale(px, NORM_SIZE, 9); // 9x8 comparisons -> 64 bits
  let bits = "";
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      bits += g[y * 9 + x]! < g[y * 9 + x + 1]! ? "1" : "0";
    }
  }
  return bitsToHex(bits);
}

/** 64-bit aHash as a 16-char hex string. */
export function ahash(px: Uint8Array): string {
  const g = downscale(px, NORM_SIZE, 8);
  let mean = 0;
  for (const v of g) mean += v;
  mean /= g.length;
  let bits = "";
  for (const v of g) bits += v >= mean ? "1" : "0";
  return bitsToHex(bits);
}

function bitsToHex(bits: string): string {
  let hex = "";
  for (let i = 0; i < bits.length; i += 4) {
    hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
  }
  return hex;
}

export function hammingHex(a: string, b: string): number {
  if (a.length !== b.length) return Number.MAX_SAFE_INTEGER;
  let d = 0;
  for (let i = 0; i < a.length; i++) {
    let x = parseInt(a[i]!, 16) ^ parseInt(b[i]!, 16);
    while (x) {
      d += x & 1;
      x >>= 1;
    }
  }
  return d;
}

/** Hamming distance -> [0,1] similarity (64-bit hashes). */
export function hashSimilarity(a: string, b: string): number {
  const d = hammingHex(a, b);
  if (d === Number.MAX_SAFE_INTEGER) return 0;
  return 1 - d / 64;
}
