/** Vercel serverless body limit is ~4.5 MB; target 4 MB with headroom. */
export const UPLOAD_TARGET_BYTES = 4 * 1024 * 1024;

const MAX_DIMENSION = 2048;
const MIN_QUALITY = 0.5;
const QUALITY_STEP = 0.08;

function scaledSize(
  width: number,
  height: number,
  maxDim: number,
): { width: number; height: number } {
  if (width <= maxDim && height <= maxDim) return { width, height };
  const scale = maxDim / Math.max(width, height);
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

/**
 * Shrinks large photos client-side so multipart uploads stay under Vercel limits.
 * Returns the original file when already small enough.
 */
export async function compressImageForUpload(file: File): Promise<File> {
  if (file.size <= UPLOAD_TARGET_BYTES) return file;

  const bitmap = await createImageBitmap(file);
  const { width, height } = scaledSize(bitmap.width, bitmap.height, MAX_DIMENSION);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Could not prepare image for upload.");
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const outputType = "image/jpeg";
  let quality = 0.88;
  let blob: Blob | null = null;

  while (quality >= MIN_QUALITY) {
    blob = await canvasToBlob(canvas, outputType, quality);
    if (blob && blob.size <= UPLOAD_TARGET_BYTES) break;
    quality -= QUALITY_STEP;
  }

  if (!blob || blob.size > UPLOAD_TARGET_BYTES) {
    throw new Error("Could not compress image — try a smaller photo.");
  }

  const ext = "jpg";
  const base = file.name.replace(/\.[^.]+$/, "") || "upload";
  return new File([blob], `${base}.${ext}`, { type: outputType });
}
