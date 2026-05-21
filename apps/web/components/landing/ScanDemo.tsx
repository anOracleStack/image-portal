"use client";

import { useEffect, useState } from "react";

const steps = [
  {
    id: 0,
    label: "Scan",
    stage: "SCAN",
    sub: "Point your camera at the printed visual",
    hint: ["Point camera at your poster", "or printed visual"],
    showReticle: true,
  },
  {
    id: 1,
    label: "Match",
    stage: "MATCH",
    sub: "We recognize your portal in milliseconds",
    hint: ["Portal fingerprint matched", "confidence 0.94"],
    showReticle: false,
  },
  {
    id: 2,
    label: "Open",
    stage: "OPEN",
    sub: "Visitor lands on your linked destination",
    hint: ["rub.pub/your-portal", "view tracked in dashboard"],
    showReticle: false,
    previewUrl: "rub.pub/your-portal",
  },
] as const;

export function ScanDemo() {
  const [active, setActive] = useState(0);
  const step = steps[active] ?? steps[0];

  useEffect(() => {
    const id = setInterval(() => {
      setActive((a) => (a + 1) % steps.length);
    }, 3200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="ip-demo ip-animate-in ip-animate-in-delay-2">
      <div className="ip-demo-screen">
        <div className="ip-scan-grid" style={{ opacity: 0.45 }} aria-hidden />
        {step.showReticle ? <div className="ip-demo-reticle" aria-hidden /> : null}
        <div className="ip-demo-stage">
          <span className="ip-demo-stage-label">{step.stage}</span>
          <span className="ip-demo-stage-sub">{step.sub}</span>
          {"previewUrl" in step && step.previewUrl ? (
            <div className="ip-demo-open-preview">{step.previewUrl}</div>
          ) : null}
        </div>
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
            zIndex: 3,
          }}
        >
          {step.hint.map((line, i) => (
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
              aria-pressed={active === s.id}
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
