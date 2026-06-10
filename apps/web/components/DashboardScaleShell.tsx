"use client";

import { useCallback, useEffect, useRef } from "react";

/** Design reference width — dashboard layout is authored at this size. */
export const DASHBOARD_REF_WIDTH = 1440;

/** Minimum scale factor (720px visual width at ref). Narrower viewports scroll horizontally. */
export const DASHBOARD_MIN_SCALE = 0.5;

export function DashboardScaleShell({ children }: { children: React.ReactNode }) {
  const slotRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  const syncScale = useCallback(() => {
    const inner = innerRef.current;
    const slot = slotRef.current;
    if (!inner || !slot) return;

    const scale = Math.min(
      1,
      Math.max(DASHBOARD_MIN_SCALE, window.innerWidth / DASHBOARD_REF_WIDTH),
    );

    document.documentElement.style.setProperty("--dash-scale", String(scale));
    inner.style.transform = `scale(${scale})`;

    slot.style.width = `${DASHBOARD_REF_WIDTH * scale}px`;
    slot.style.height = `${inner.offsetHeight * scale}px`;
  }, []);

  useEffect(() => {
    syncScale();
    window.addEventListener("resize", syncScale);

    const inner = innerRef.current;
    const ro = inner ? new ResizeObserver(syncScale) : null;
    if (inner && ro) ro.observe(inner);

    return () => {
      window.removeEventListener("resize", syncScale);
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
