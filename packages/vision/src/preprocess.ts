import sharp from "sharp";

// Preprocessing must be IDENTICAL on both sides (Law 4). This module is the
// single definition of "normalize a frame/image" used at upload and at scan.

export const NORM_SIZE = 256; // grayscale working resolution for hashing/verify

/** Brightness-normalize -> center-crop to square -> grayscale -> resize.
 *  Returns raw single-channel pixel buffer of NORM_SIZE x NORM_SIZE. */
export async function preprocess(input: Buffer): Promise<Uint8Array> {
  const img = sharp(input, { failOn: "none" }).rotate(); // honor EXIF
  const meta = await img.metadata();
  const w = meta.width ?? NORM_SIZE;
  const h = meta.height ?? NORM_SIZE;
  const side = Math.min(w, h);
  const left = Math.floor((w - side) / 2);
  const top = Math.floor((h - side) / 2);

  const buf = await sharp(input, { failOn: "none" })
    .rotate()
    .extract({ left, top, width: side, height: side })
    .resize(NORM_SIZE, NORM_SIZE, { fit: "fill" })
    .grayscale()
    .normalize() // brightness/contrast normalization (Master Spec 6.2)
    .blur(0.4) // mild deblur-equivalent: stabilize sensor noise before hashing
    .raw()
    .toBuffer();

  return new Uint8Array(buf);
}
