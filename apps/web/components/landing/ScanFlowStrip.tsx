"use client";

import { useEffect, useRef, useState } from "react";

export type ScanFlowPhase = "scan" | "match" | "open";

const PHASES: { id: ScanFlowPhase; label: string }[] = [
  { id: "scan", label: "SCAN" },
  { id: "match", label: "MATCH" },
  { id: "open", label: "OPEN" },
];

type ScanFlowStripProps = {
  activePhase: ScanFlowPhase;
};

export function ScanFlowStrip({ activePhase }: ScanFlowStripProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const activeLabel = PHASES.find((p) => p.id === activePhase)?.label ?? "SCAN";

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setVisible(true);
      },
      { threshold: 0.3 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`ip-scan-demo-flow${visible ? " ip-scan-demo-flow-visible" : ""}`}
      role="status"
      aria-live="polite"
      aria-label={`Scan flow: ${activeLabel}`}
    >
      {PHASES.map((phase, index) => (
        <span key={phase.id} className="ip-scan-demo-flow-group">
          <span
            className={`ip-scan-demo-flow-item${activePhase === phase.id ? " ip-scan-demo-flow-active" : ""}`}
            data-active={activePhase === phase.id ? "true" : "false"}
          >
            <span className="ip-scan-demo-flow-bracket" aria-hidden>
              [
            </span>
            <span className="ip-scan-demo-flow-label">{phase.label}</span>
            <span className="ip-scan-demo-flow-bracket" aria-hidden>
              ]
            </span>
          </span>
          {index < PHASES.length - 1 ? (
            <span className="ip-scan-demo-flow-sep" aria-hidden>
              →
            </span>
          ) : null}
        </span>
      ))}
    </div>
  );
}
