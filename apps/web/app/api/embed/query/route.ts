import { NextRequest, NextResponse } from "next/server";
import { EMBED_MODEL, EMBED_VERSION } from "@ip/shared";
import { getEmbeddingProvider } from "@/lib/embedding";
import { preprocess, dhash } from "@ip/vision";

const RATE = new Map<string, { n: number; t: number }>();
function rateLimited(key: string, max = 60, windowMs = 60_000): boolean {
  const now = Date.now();
  const e = RATE.get(key);
  if (!e || now - e.t > windowMs) {
    RATE.set(key, { n: 1, t: now });
    return false;
  }
  e.n++;
  return e.n > max;
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }

  let buf: Buffer | null = null;
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");
    if (file instanceof Blob) {
      buf = Buffer.from(await file.arrayBuffer());
    }
  } else {
    let body: { frameBase64?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "invalid json" }, { status: 400 });
    }
    if (body.frameBase64 && typeof body.frameBase64 === "string") {
      buf = Buffer.from(body.frameBase64, "base64");
    }
  }

  if (!buf) {
    return NextResponse.json({ error: "frameBase64 or file required" }, { status: 400 });
  }

  try {
    const px = await preprocess(buf);
    const phash = dhash(px);
    const provider = getEmbeddingProvider();
    const embedding = await provider.embed(buf);

    return NextResponse.json({
      embedding: Array.from(embedding),
      phash,
      embeddingModel: EMBED_MODEL,
      embeddingVersion: EMBED_VERSION,
      provider: provider.model,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "embed failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
