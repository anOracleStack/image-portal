import { EMBED_DIM, EMBED_MODEL, EMBED_VERSION } from "@ip/shared";

// STAGE A (Master Spec 2.2 / Law 1): recall-oriented candidate retrieval.
// Production = pgvector HNSW cosine inside apps/web. This in-memory cosine
// index is the dev/test implementation behind the same interface.

export interface FingerprintRow {
  portalId: string;
  portalImageId: string;
  title: string;
  slug: string;
  destinationDomain: string;
  embedding: Float32Array;
  phash: string;
  embeddingModel: string;
  embeddingVersion: number;
  status: "active" | "inactive" | "suspended";
  visibility: "public" | "private";
}

export interface Candidate {
  row: FingerprintRow;
  embeddingSim: number; // cosine similarity 0..1
}

export interface VectorIndex {
  topK(query: Float32Array, k: number): Candidate[];
}

function cosine(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-9);
}

export class InMemoryVectorIndex implements VectorIndex {
  constructor(private rows: FingerprintRow[]) {}

  topK(query: Float32Array, k: number): Candidate[] {
    if (query.length !== EMBED_DIM)
      throw new Error(`query dim ${query.length} != ${EMBED_DIM}`);

    return this.rows
      // Law 4: hard-refuse wrong model/version rows. Silent mismatch = total
      // failure, so it must fail loudly at the retrieve boundary.
      .filter(
        (r) =>
          r.embeddingModel === EMBED_MODEL &&
          r.embeddingVersion === EMBED_VERSION &&
          r.status === "active" &&
          r.visibility === "public"
      )
      .map((row) => ({ row, embeddingSim: (cosine(query, row.embedding) + 1) / 2 }))
      .sort((a, b) => b.embeddingSim - a.embeddingSim)
      .slice(0, k);
  }
}
