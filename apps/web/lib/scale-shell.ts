/** Design reference width — layouts are authored at this size. */
export const REF_WIDTH = 1440;

/** Minimum scale factor (720px visual width at ref). Narrower viewports scroll horizontally. */
export const MIN_SCALE = 0.5;

export function getViewportWidth(): number {
  if (typeof window === "undefined") return REF_WIDTH;
  return window.visualViewport?.width ?? window.innerWidth;
}

export function computeScale(viewportWidth: number): number {
  if (viewportWidth >= REF_WIDTH) return 1;
  return Math.max(MIN_SCALE, viewportWidth / REF_WIDTH);
}
