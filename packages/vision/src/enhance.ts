import sharp from "sharp";

/** Catalog export enhancement — normalize, sharpen, upscale for print/screen. */
export async function enhanceImage(input: Buffer): Promise<Buffer> {
  return sharp(input, { failOn: "none" })
    .rotate()
    .normalize()
    .sharpen({ sigma: 1.2 })
    .resize(2048, 2048, { fit: "inside", withoutEnlargement: false })
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();
}
