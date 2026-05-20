import { EMBED_DIM } from "@ip/shared";

// CATALOG embedding only (upload-time, latency-tolerant — Master Spec 2.3).
// The SCAN-time query embedding is computed ON-DEVICE in apps/mobile and is
// never produced here. Same pinned model both sides (Law 4).
//
// Provider-swappable. The default is a clearly-marked PLUG point: wire your
// chosen warm endpoint / Together / Replicate call returning an EMBED_DIM
// vector from the SAME model the mobile app runs on-device.

export interface EmbeddingProvider {
  readonly model: string;
  embed(imagePngOrJpeg: Uint8Array): Promise<Float32Array>;
}

class WarmEndpointProvider implements EmbeddingProvider {
  readonly model = process.env.EMBED_MODEL_ID ?? "dinov2_vitb14";
  constructor(private endpoint: string, private apiKey: string) {}

  async embed(buf: Uint8Array): Promise<Float32Array> {
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

export function getEmbeddingProvider(): EmbeddingProvider {
  const endpoint = process.env.CATALOG_EMBED_ENDPOINT;
  const apiKey = process.env.CATALOG_EMBED_API_KEY;
  if (!endpoint || !apiKey) {
    // Fail loudly — never silently fake recognition (Law / .cursorrules).
    throw new Error(
      "Catalog embedding provider not configured. Set CATALOG_EMBED_ENDPOINT " +
        "+ CATALOG_EMBED_API_KEY to a warm endpoint serving the pinned model."
    );
  }
  return new WarmEndpointProvider(endpoint, apiKey);
}
