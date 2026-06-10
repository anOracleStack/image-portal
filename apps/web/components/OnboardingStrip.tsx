"use client";

import { useEffect, useState } from "react";
import { BalancedText } from "@/components/ui/BalancedText";

const STORAGE_KEY = "ip_onboarding_done";

const steps = [
  {
    n: 1,
    title: "Create a portal",
    href: "/dashboard/create",
    desc: "Title & destination URL — we add https:// for you.",
  },
  {
    n: 2,
    title: "Upload your visual",
    href: "/dashboard",
    desc: "Open your portal → Workshop → upload poster, sticker, or photo.",
  },
  {
    n: 3,
    title: "Test scan on phone",
    href: "/scan",
    desc: "Visit rub.pub/scan on your phone & capture your live visual.",
  },
] as const;

export function OnboardingStrip() {
  const [visible, setVisible] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    try {
      setVisible(localStorage.getItem(STORAGE_KEY) !== "1");
    } catch {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!visible) return null;

  const step = steps[activeStep]!;

  return (
    <section className="ip-dash-section ip-card ip-card-glow ip-card-copy ip-onboarding ip-onboarding-wizard">
      <div className="ip-onboarding-wizard-head">
        <h2 className="ip-dash-section-title">First-run checklist</h2>
        <BalancedText
          className="ip-muted ip-text-block ip-dash-lead"
          lines={[
            "Three steps to your first scannable doorway.",
            "Safety checks & analytics built in.",
          ]}
        />
        <button type="button" className="ip-btn ip-btn-ghost ip-btn-sm ip-onboarding-dismiss" onClick={dismiss}>
          Got it
        </button>
      </div>

      <div className="ip-onboarding-wizard-steps" role="tablist" aria-label="Onboarding steps">
        {steps.map((s, i) => (
          <button
            key={s.n}
            type="button"
            role="tab"
            className="ip-onboarding-wizard-pill"
            data-active={activeStep === i ? "true" : "false"}
            aria-selected={activeStep === i}
            onClick={() => setActiveStep(i)}
          >
            Step {s.n}
          </button>
        ))}
      </div>

      <a href={step.href} className="ip-card ip-card-interactive ip-onboarding-step ip-onboarding-wizard-card">
        <div className="ip-onboarding-step-num">Step {step.n} of {steps.length}</div>
        <div className="ip-onboarding-step-title">{step.title}</div>
        <BalancedText
          className="ip-faint ip-text-block ip-onboarding-step-desc"
          lines={[step.desc]}
        />
        <span className="ip-onboarding-wizard-cta">Continue →</span>
      </a>

      <div className="ip-onboarding-wizard-nav">
        <button
          type="button"
          className="ip-btn ip-btn-ghost ip-btn-sm"
          disabled={activeStep === 0}
          onClick={() => setActiveStep((s) => Math.max(0, s - 1))}
        >
          Back
        </button>
        {activeStep < steps.length - 1 ? (
          <button
            type="button"
            className="ip-btn ip-btn-secondary ip-btn-sm"
            onClick={() => setActiveStep((s) => Math.min(steps.length - 1, s + 1))}
          >
            Next
          </button>
        ) : (
          <button type="button" className="ip-btn ip-btn-primary ip-btn-sm" onClick={dismiss}>
            Finish
          </button>
        )}
      </div>
    </section>
  );
}
