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

/**
 * Upper bound so the design doesn't grow absurdly large on ultra-wide / 4K
 * displays. 1.6 * 1440 = 2304px of visual design width, which fills essentially
 * every real monitor (including 2560px) edge-to-edge.
 */
export const MAX_SCALE = 1.6;

export function computeScale(viewportWidth: number): number {
  // Fully proportional in BOTH directions: the 1440px design scales down to fit
  // narrow viewports (never scrolls horizontally) AND scales up on wide
  // viewports so it fills the frame instead of sitting in a centered column
  // with dead space. Layout/design is preserved — only the size changes.
  const scale = viewportWidth / REF_WIDTH;
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}
