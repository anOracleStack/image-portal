/** Design reference width — layouts are authored at this size. */
export const REF_WIDTH = 1440;

/**
 * Absolute floor purely to avoid a zero/degenerate scale on pathological widths.
 * It is far below any real device (0.15 * 1440 = 216px), so in practice the
 * design always scales to fit the viewport exactly and never overflows
 * horizontally — the page only ever scrolls vertically.
 */
export const MIN_SCALE = 0.15;

export function getViewportWidth(): number {
  if (typeof window === "undefined") return REF_WIDTH;
  return window.visualViewport?.width ?? window.innerWidth;
}

export function computeScale(viewportWidth: number): number {
  if (viewportWidth >= REF_WIDTH) return 1;
  // Fully proportional below the reference width: the 1440px design is scaled
  // down to fit the actual viewport width, so the layout/design is preserved
  // and horizontal scrolling can never occur.
  return Math.max(MIN_SCALE, viewportWidth / REF_WIDTH);
}
