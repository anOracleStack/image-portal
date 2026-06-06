import sharp from "sharp";
import { EMBED_DIM } from "@ip/shared";

/** Deterministic 16×16 RGB grid — 768-dim. Same algorithm for catalog & query when no ML API. */
export async function computeGridEmbedding(buf: Buffer): Promise<Float32Array> {
  const { data, info } = await sharp(buf)
    .resize(256, 256, { fit: "inside" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const grid = 16;
  const emb: number[] = [];
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid; x++) {
      const px = Math.min(
        info.width - 1,
        Math.round((x * (info.width - 1)) / (grid - 1)),
      );
      const py = Math.min(
        info.height - 1,
        Math.round((y * (info.height - 1)) / (grid - 1)),
      );
      const i = (py * info.width + px) * info.channels;
      emb.push(
        (data[i] ?? 0) / 255,
        (data[i + 1] ?? data[i] ?? 0) / 255,
        (data[i + 2] ?? data[i] ?? 0) / 255,
      );
    }
  }
  if (emb.length !== EMBED_DIM) {
    throw new Error(`grid embedding dim ${emb.length} != ${EMBED_DIM}`);
  }
  return Float32Array.from(emb);
}
