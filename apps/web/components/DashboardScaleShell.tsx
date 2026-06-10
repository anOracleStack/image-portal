"use client";

import { useCallback, useEffect, useRef } from "react";

/** Design reference width — dashboard layout is authored at this size. */
export const DASHBOARD_REF_WIDTH = 1440;

/** Minimum scale factor (720px visual width at ref). Narrower viewports scroll horizontally. */
export const DASHBOARD_MIN_SCALE = 0.5;

function getViewportWidth(): number {
  if (typeof window === "undefined") return DASHBOARD_REF_WIDTH;
  return window.visualViewport?.width ?? window.innerWidth;
}

export function computeDashboardScale(viewportWidth: number): number {
  if (viewportWidth >= DASHBOARD_REF_WIDTH) return 1;
  return Math.max(DASHBOARD_MIN_SCALE, viewportWidth / DASHBOARD_REF_WIDTH);
}

export function DashboardScaleShell({ children }: { children: React.ReactNode }) {
  const slotRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  const syncScale = useCallback(() => {
    const inner = innerRef.current;
    const slot = slotRef.current;
    if (!inner || !slot) return;

    const scale = computeDashboardScale(getViewportWidth());

    document.documentElement.style.setProperty("--dash-scale", String(scale));
    inner.style.transform = scale === 1 ? "none" : `scale(${scale})`;

    const visualWidth = DASHBOARD_REF_WIDTH * scale;
    slot.style.width = `${visualWidth}px`;
    slot.style.height = `${inner.offsetHeight * scale}px`;
  }, []);

  useEffect(() => {
    syncScale();
    window.addEventListener("resize", syncScale);
    window.visualViewport?.addEventListener("resize", syncScale);
    window.visualViewport?.addEventListener("scroll", syncScale);

    const inner = innerRef.current;
    const ro = inner ? new ResizeObserver(syncScale) : null;
    if (inner && ro) ro.observe(inner);

    return () => {
      window.removeEventListener("resize", syncScale);
      window.visualViewport?.removeEventListener("resize", syncScale);
      window.visualViewport?.removeEventListener("scroll", syncScale);
      ro?.disconnect();
    };
  }, [syncScale]);

  return (
    <div className="ip-dash-scale-viewport">
      <div ref={slotRef} className="ip-dash-scale-slot">
        <div ref={innerRef} className="ip-dash-scale-root">
          {children}
        </div>
      </div>
    </div>
  );
}
