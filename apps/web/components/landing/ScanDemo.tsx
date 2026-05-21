"use client";

import { useEffect, useState } from "react";

const steps = [
  { id: 0, label: "Scan", hint: ["Point camera at your poster", "or printed visual"] },
  { id: 1, label: "Match", hint: ["We recognize your portal", "in milliseconds"] },
  { id: 2, label: "Open", hint: ["Visitor lands on your destination —", "tracked"] },
] as const;

export function ScanDemo() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((a) => (a + 1) % steps.length);
    }, 3200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="ip-demo ip-animate-in ip-animate-in-delay-2">
      <div className="ip-demo-screen">
        <div className="ip-scan-grid" style={{ opacity: 0.5 }} />
        <div className="ip-demo-reticle" />
        <p
          className="ip-mono ip-text-block"
          style={{
            position: "absolute",
            bottom: 16,
            left: 16,
            right: 16,
            margin: 0,
            color: "var(--text-muted)",
            fontSize: "0.7rem",
            lineHeight: 1.5,
          }}
        >
          {(steps[active] ?? steps[0]).hint.map((line, i) => (
            <span key={i} className="ip-text-block-line">
              {line}
            </span>
          ))}
        </p>
      </div>
      <div className="ip-demo-bar">
        <div className="ip-demo-steps">
          {steps.map((s) => (
            <button
              key={s.id}
              type="button"
              className="ip-demo-step"
              data-active={active === s.id ? "true" : "false"}
              onClick={() => setActive(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <span className="ip-mono ip-muted">Live preview</span>
      </div>
    </div>
  );
}
