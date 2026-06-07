"use client";

import { useEffect, useState } from "react";
import { UseCaseDemo } from "@/components/landing/UseCaseDemo";

const HERO_FLOW = ["Scan", "Match", "Open"] as const;

/** Hero interactive demo — animates Scan → Match → Open for landing visitors. */
export function ScanDemo() {
  const [flowIndex, setFlowIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setFlowIndex((i) => (i + 1) % HERO_FLOW.length);
    }, 2500);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="ip-scan-demo-wrap">
      <div className="ip-scan-demo-flow" aria-label="Viewer journey">
        {HERO_FLOW.map((label, i) => (
          <span
            key={label}
            className={`ip-scan-demo-flow-item${flowIndex === i ? " ip-scan-demo-flow-active" : ""}`}
          >
            <span className="ip-scan-demo-flow-label">{label}</span>
            {i < HERO_FLOW.length - 1 ? (
              <span className="ip-scan-demo-flow-sep" aria-hidden>
                →
              </span>
            ) : null}
          </span>
        ))}
      </div>
      <UseCaseDemo
        slug="posters-flyers"
        autoAdvance="immediate"
        priorityFrames
        initialStep={5}
        className="ip-demo ip-animate-in ip-animate-in-delay-2"
      />
    </div>
  );
}
