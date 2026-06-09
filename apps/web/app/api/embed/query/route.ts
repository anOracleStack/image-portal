import { NextRequest, NextResponse } from "next/server";
import { EMBED_MODEL, EMBED_VERSION } from "@ip/shared";
import { preprocess, dhash } from "@ip/vision";
import { computeWebQueryEmbedding } from "@/lib/query-embedding";
import crypto from "node:crypto";

const RATE = new Map<string, { n: number; t: number }>();
function rateLimited(key: string, max = 60, windowMs = 60_000): boolean {
  const now = Date.now();
  if (RATE.size > 512) {
    for (const [k, v] of RATE) {
      if (now - v.t > windowMs) RATE.delete(k);
    }
  }
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

async function readImageBuffer(req: NextRequest): Promise<Buffer | null> {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");
    if (file instanceof Blob) {
      return Buffer.from(await file.arrayBuffer());
    }
    return null;
  }

  let body: { frameBase64?: string };
  try {
    body = await req.json();
  } catch {
    return null;
  }
  if (!body.frameBase64 || typeof body.frameBase64 !== "string") {
    return null;
  }
  return Buffer.from(body.frameBase64, "base64");
}

export async function POST(req: NextRequest) {
  if (rateLimited(ipHash(req))) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }

  const buf = await readImageBuffer(req);
  if (!buf || buf.length === 0) {
    return NextResponse.json(
      { error: "frameBase64 or multipart file required" },
      { status: 400 },
    );
  }

  try {
    const px = await preprocess(buf);
    const phash = dhash(px);
    const embedding = await computeWebQueryEmbedding(buf);

    return NextResponse.json({
      embedding,
      phash,
      embeddingModel: EMBED_MODEL,
      embeddingVersion: EMBED_VERSION,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "embed failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "method not allowed" }, { status: 405 });
}
