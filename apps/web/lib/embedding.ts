import { EMBED_DIM, EMBED_MODEL } from "@ip/shared";
import { computeGridEmbedding } from "@ip/vision";

export interface EmbeddingProvider {
  readonly model: string;
  embed(imagePngOrJpeg: Uint8Array | Buffer): Promise<Float32Array>;
}

class WarmEndpointProvider implements EmbeddingProvider {
  readonly model = process.env.EMBED_MODEL_ID ?? EMBED_MODEL;
  constructor(
    private endpoint: string,
    private apiKey: string,
  ) {}

  async embed(buf: Uint8Array | Buffer): Promise<Float32Array> {
    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/octet-stream",
        authorization: `Bearer ${this.apiKey}`,
      },
      body: new Blob([new Uint8Array(buf)]),
    });
    if (!res.ok) throw new Error(`embed provider ${res.status}`);
    const json = (await res.json()) as { embedding: number[] };
    if (json.embedding?.length !== EMBED_DIM)
      throw new Error(`embed dim ${json.embedding?.length} != ${EMBED_DIM}`);
    return Float32Array.from(json.embedding);
  }
}

class GridEmbeddingProvider implements EmbeddingProvider {
  readonly model = EMBED_MODEL;
  async embed(buf: Uint8Array | Buffer): Promise<Float32Array> {
    return computeGridEmbedding(Buffer.from(buf));
  }
}

export function getEmbeddingProvider(): EmbeddingProvider {
  const endpoint = process.env.CATALOG_EMBED_ENDPOINT;
  const apiKey = process.env.CATALOG_EMBED_API_KEY;
  if (endpoint && apiKey) {
    return new WarmEndpointProvider(endpoint, apiKey);
  }

  const provider = process.env.CATALOG_EMBED_PROVIDER ?? "grid";
  if (provider === "grid") {
    return new GridEmbeddingProvider();
  }

  throw new Error(
    "Catalog embedding not configured. Set CATALOG_EMBED_PROVIDER=grid for MVP, " +
      "or CATALOG_EMBED_ENDPOINT + CATALOG_EMBED_API_KEY for production ML.",
  );
}

export function embeddingProviderLabel(): string {
  if (process.env.CATALOG_EMBED_ENDPOINT && process.env.CATALOG_EMBED_API_KEY) {
    return "warm-endpoint";
  }
  return process.env.CATALOG_EMBED_PROVIDER ?? "grid";
}
