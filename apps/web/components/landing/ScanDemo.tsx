"use client";

import { UseCaseDemo } from "@/components/landing/UseCaseDemo";

const HERO_FLOW = ["Scan", "Match", "Open"] as const;

/** Hero interactive demo — highlights Scan → Match → Open for landing visitors. */
export function ScanDemo() {
  return (
    <div className="ip-scan-demo-wrap">
      <div className="ip-scan-demo-flow" aria-label="Viewer journey">
        {HERO_FLOW.map((label, i) => (
          <span key={label} className="ip-scan-demo-flow-item">
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
        className="ip-demo ip-animate-in ip-animate-in-delay-2"
      />
    </div>
  );
}
