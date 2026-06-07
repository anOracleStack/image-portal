import sharp from "sharp";

export type EnhanceOptions = {
  brightness?: number;
  contrast?: number;
  sharpness?: number;
  maxEdge?: number;
};

const DEFAULT_ENHANCE: Required<EnhanceOptions> = {
  brightness: 1,
  contrast: 1,
  sharpness: 1.2,
  maxEdge: 2048,
};

/** Catalog export enhancement — normalize, sharpen, upscale for print/screen. */
export async function enhanceImage(
  input: Buffer,
  opts: EnhanceOptions = {},
): Promise<Buffer> {
  const o = { ...DEFAULT_ENHANCE, ...opts };
  let pipeline = sharp(input, { failOn: "none" }).rotate().normalize();

  if (o.brightness !== 1) {
    pipeline = pipeline.modulate({ brightness: o.brightness });
  }
  if (o.contrast !== 1) {
    const c = o.contrast;
    pipeline = pipeline.linear(c, -(128 * c) + 128);
  }

  return pipeline
    .sharpen({ sigma: o.sharpness })
    .resize(o.maxEdge, o.maxEdge, { fit: "inside", withoutEnlargement: false })
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();
}
