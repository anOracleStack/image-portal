/** Client-side frame gate — one good capture is enough; reject bad frames before API. */

export type FrameQualityIssue =
  | "too_dark"
  | "too_bright"
  | "too_blurry"
  | "too_small";

export interface FrameQualityMetrics {
  width: number;
  height: number;
  brightness: number;
  sharpness: number;
}

export interface FrameQualityResult {
  ok: boolean;
  issue?: FrameQualityIssue;
  message?: string;
  metrics: FrameQualityMetrics;
}

const MIN_EDGE = 480;
const MIN_BRIGHTNESS = 0.12;
const MAX_BRIGHTNESS = 0.92;
const MIN_SHARPNESS = 35;

export function qualityIssueMessage(issue: FrameQualityIssue): string {
  switch (issue) {
    case "too_dark":
      return "Too dark — move to better light, then capture again.";
    case "too_bright":
      return "Too bright — reduce glare, then capture again.";
    case "too_blurry":
      return "Photo is blurry — hold steady, then capture again.";
    case "too_small":
      return "Move closer so the image fills the frame, then capture again.";
  }
}

/** Laplacian variance on a downsampled grayscale patch (higher = sharper). */
function sharpnessScore(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): number {
  const size = 64;
  const gray = new Float64Array(size * size);
  const stepX = (width - 1) / (size - 1);
  const stepY = (height - 1) / (size - 1);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const px = Math.round(x * stepX);
      const py = Math.round(y * stepY);
      const i = (py * width + px) * 4;
      gray[y * size + x] =
        0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!;
    }
  }
  let sum = 0;
  let sumSq = 0;
  let n = 0;
  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      const c = gray[y * size + x]!;
      const lap =
        -gray[(y - 1) * size + x]! -
        gray[y * size + (x - 1)]! +
        4 * c -
        gray[y * size + (x + 1)]! -
        gray[(y + 1) * size + x]!;
      sum += lap;
      sumSq += lap * lap;
      n++;
    }
  }
  const mean = sum / n;
  return sumSq / n - mean * mean;
}

export function assessFrameQuality(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): FrameQualityResult {
  const metrics: FrameQualityMetrics = {
    width,
    height,
    brightness: 0,
    sharpness: 0,
  };

  if (width < MIN_EDGE || height < MIN_EDGE) {
    return {
      ok: false,
      issue: "too_small",
      message: qualityIssueMessage("too_small"),
      metrics,
    };
  }

  let lumSum = 0;
  const step = 4;
  let samples = 0;
  for (let i = 0; i < data.length; i += 4 * step) {
    lumSum +=
      (0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!) / 255;
    samples++;
  }
  metrics.brightness = lumSum / samples;

  if (metrics.brightness < MIN_BRIGHTNESS) {
    return {
      ok: false,
      issue: "too_dark",
      message: qualityIssueMessage("too_dark"),
      metrics,
    };
  }
  if (metrics.brightness > MAX_BRIGHTNESS) {
    return {
      ok: false,
      issue: "too_bright",
      message: qualityIssueMessage("too_bright"),
      metrics,
    };
  }

  metrics.sharpness = sharpnessScore(data, width, height);
  if (metrics.sharpness < MIN_SHARPNESS) {
    return {
      ok: false,
      issue: "too_blurry",
      message: qualityIssueMessage("too_blurry"),
      metrics,
    };
  }

  return { ok: true, metrics };
}

export function matchRetryMessage(
  band: "high" | "medium" | "low",
  matched: boolean,
): string | undefined {
  if (matched) return undefined;
  if (band === "medium") {
    return "Almost matched — center the image, hold steady, & capture again.";
  }
  return "No portal found — center the image, reduce glare, & capture again.";
}
