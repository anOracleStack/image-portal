import sharp from "sharp";
import { EMBED_DIM } from "@ip/shared";

/** Fallback query embedding when no warm catalog endpoint (matches PWA scanner grid). */
export async function computeWebQueryEmbedding(
  imageBuffer: Buffer
): Promise<number[]> {
  const { data, info } = await sharp(imageBuffer)
    .resize(256, 256, { fit: "inside" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const grid = 16;
  const emb: number[] = [];
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid; x++) {
      const px = Math.min(
        info.width - 1,
        Math.round((x * (info.width - 1)) / (grid - 1))
      );
      const py = Math.min(
        info.height - 1,
        Math.round((y * (info.height - 1)) / (grid - 1))
      );
      const i = (py * info.width + px) * info.channels;
      emb.push(
        (data[i] ?? 0) / 255,
        (data[i + 1] ?? data[i] ?? 0) / 255,
        (data[i + 2] ?? data[i] ?? 0) / 255
      );
    }
  }
  while (emb.length < EMBED_DIM) emb.push(0);
  return emb.slice(0, EMBED_DIM);
}
