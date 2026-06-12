"use client";

import { useCallback, useEffect, useRef } from "react";
import { REF_WIDTH, computeScale, getViewportWidth } from "@/lib/scale-shell";

export function LandingScaleShell({ children }: { children: React.ReactNode }) {
  const slotRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  const syncScale = useCallback(() => {
    const inner = innerRef.current;
    const slot = slotRef.current;
    if (!inner || !slot) return;

    const scale = computeScale(getViewportWidth());

    document.documentElement.style.setProperty("--landing-scale", String(scale));
    inner.style.transform = scale === 1 ? "none" : `scale(${scale})`;
    inner.dataset.scaleBelow = scale < 0.65 ? "true" : "false";

    const visualWidth = REF_WIDTH * scale;
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
      document.documentElement.style.removeProperty("--landing-scale");
    };
  }, [syncScale]);

  return (
    <div className="ip-landing-scale-viewport">
      <div ref={slotRef} className="ip-landing-scale-slot">
        <div ref={innerRef} className="ip-landing-scale-root">
          {children}
        </div>
      </div>
    </div>
  );
}
