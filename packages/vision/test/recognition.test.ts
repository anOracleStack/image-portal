import { describe, it, expect, beforeAll } from "vitest";
import sharp from "sharp";
import {
  preprocess,
  dhash,
  StructuralVerifier,
  InMemoryVectorIndex,
  recognize,
  type FingerprintRow,
  type CandidatePixelLoader,
} from "../src/index";
import { decideBand, EMBED_DIM, EMBED_MODEL, EMBED_VERSION } from "@ip/shared";

const W = 320;

// --- synthetic "posters" as PNG buffers -----------------------------------
function makePoster(
  kind: "A" | "B",
  opts: { brightness?: number; shiftX?: number; blur?: number } = {}
): Promise<Buffer> {
  const { brightness = 0, shiftX = 0 } = opts;
  const px = Buffer.alloc(W * W);
  for (let y = 0; y < W; y++) {
    for (let x = 0; x < W; x++) {
      let v: number;
      if (kind === "A") {
        // diagonal gradient + a bright offset square (a distinct composition)
        v = ((x + y) / (2 * W)) * 180;
        if (x > 60 + shiftX && x < 150 + shiftX && y > 40 && y < 130) v = 245;
      } else {
        // vertical gradient + a bright circle elsewhere (different layout)
        v = (y / W) * 180;
        const dx = x - 230;
        const dy = y - 90;
        if (dx * dx + dy * dy < 45 * 45) v = 245;
      }
      px[y * W + x] = Math.max(0, Math.min(255, Math.round(v + brightness)));
    }
  }
  let img = sharp(px, { raw: { width: W, height: W, channels: 1 } }).png();
  if (opts.blur) img = sharp(px, { raw: { width: W, height: W, channels: 1 } })
    .blur(opts.blur)
    .png();
  return img.toBuffer();
}

// deterministic 768-d embedding helper
function vec(seed: number, jitter = 0): Float32Array {
  const v = new Float32Array(EMBED_DIM);
  let s = seed;
  for (let i = 0; i < EMBED_DIM; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    v[i] = (s / 0x7fffffff) * 2 - 1 + (Math.sin(i + jitter) * jitter) / 50;
  }
  return v;
}

describe("retrieve-then-verify gate (Master Spec §11 acceptance)", () => {
  let aPixels: Uint8Array;
  let aScanPixels: Uint8Array;
  let aPhash: string;
  let aScanPhash: string;

  beforeAll(async () => {
    aPixels = await preprocess(await makePoster("A"));
    // a realistic "scan" of poster A: brighter, shifted, blurred
    aScanPixels = await preprocess(
      await makePoster("A", { brightness: 55, shiftX: 6, blur: 1.2 })
    );
    aPhash = dhash(aPixels);
    aScanPhash = dhash(aScanPixels);
  });

  it("verifier: same image (under distortion) yields strong geometric support", () => {
    const v = new StructuralVerifier().verify(aScanPixels, aPixels);
    expect(v.inliers).toBeGreaterThan(6);
    expect(v.structuralScore).toBeGreaterThan(0.85);
  });

  it("verifier: a different composition yields weak geometric support", async () => {
    const bPixels = await preprocess(await makePoster("B"));
    const v = new StructuralVerifier().verify(aScanPixels, bPixels);
    expect(v.inliers).toBeLessThan(4);
  });

  it("THESIS: an embedding-close-but-different image is REJECTED by the gate", async () => {
    // Semantic-collision scenario (the CLIP failure mode): poster B is stored
    // with an embedding nearly identical to the query's embedding, so Stage A
    // surfaces it. Only Stage B can save us.
    const queryEmbedding = vec(7, 1);
    const aRow: FingerprintRow = {
      portalId: "portal-A",
      portalImageId: "img-A",
      title: "Poster A",
      slug: "poster-a",
      destinationDomain: "oraclevision.example",
      embedding: vec(7, 1), // close to query
      phash: aPhash,
      embeddingModel: EMBED_MODEL,
      embeddingVersion: EMBED_VERSION,
      status: "active",
      visibility: "public",
    };
    const bRow: FingerprintRow = {
      ...aRow,
      portalId: "portal-B",
      portalImageId: "img-B",
      title: "Poster B",
      slug: "poster-b",
      embedding: vec(7, 1), // ALSO close to query — Stage A cannot disambiguate
    };

    const bPixels = await preprocess(await makePoster("B"));
    const loader: CandidatePixelLoader = {
      async load(id) {
        return id === "img-A" ? aPixels : bPixels;
      },
    };

    const index = new InMemoryVectorIndex([bRow, aRow]); // B first on purpose
    const res = await recognize(
      {
        queryEmbedding,
        queryPixels: aScanPixels,
        queryPhash: aScanPhash,
        sourceType: "print",
      },
      index,
      new StructuralVerifier(),
      loader
    );

    // The gate must pick A (geometry), never B — even though both embeddings
    // are cosine-close to the query.
    expect(res.portal?.id).toBe("portal-A");
    expect(res.matched).toBe(true);

    // And prove the B pairing alone would NOT pass the band gate:
    const vB = new StructuralVerifier().verify(aScanPixels, bPixels);
    const bBand = decideBand(0.95 /* pretend high fused */, vB.inliers, "print");
    expect(bBand).toBe("low");
  });

  it("identical image scans as a high-confidence match", async () => {
    const row: FingerprintRow = {
      portalId: "p1",
      portalImageId: "i1",
      title: "Exact",
      slug: "exact",
      destinationDomain: "example.com",
      embedding: vec(3),
      phash: aPhash,
      embeddingModel: EMBED_MODEL,
      embeddingVersion: EMBED_VERSION,
      status: "active",
      visibility: "public",
    };
    const loader: CandidatePixelLoader = { async load() { return aPixels; } };
    const res = await recognize(
      {
        queryEmbedding: vec(3),
        queryPixels: aPixels,
        queryPhash: aPhash,
        sourceType: "screen",
      },
      new InMemoryVectorIndex([row]),
      new StructuralVerifier(),
      loader
    );
    expect(res.band).toBe("high");
    expect(res.matched).toBe(true);
  });
});
