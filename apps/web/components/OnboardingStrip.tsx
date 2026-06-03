"use client";

import { BalancedText } from "@/components/ui/BalancedText";

const steps = [
  { n: 1, title: "Create a portal", href: "/dashboard/create", desc: "Title & HTTPS destination" },
  { n: 2, title: "Upload your visual", href: "/dashboard/create", desc: "Poster, sticker, or photo" },
  { n: 3, title: "Export QR or scan", href: "/scan", desc: "Camera or print-ready QR" },
  { n: 4, title: "Track analytics", href: "/dashboard", desc: "Scans, sources, match rate" },
] as const;

export function OnboardingStrip() {
  return (
    <section className="ip-dash-section ip-card ip-card-glow ip-card-copy ip-onboarding">
      <h2 className="ip-dash-section-title">Launch in 4 steps</h2>
      <BalancedText
        className="ip-muted ip-text-block ip-dash-lead"
        lines={[
          "Turn any visual into a scannable doorway.",
          "Safety checks & analytics built in.",
        ]}
      />
      <div className="ip-onboarding-grid">
        {steps.map((s) => (
          <a key={s.n} href={s.href} className="ip-card ip-card-interactive ip-onboarding-step">
            <div className="ip-onboarding-step-num">Step {s.n}</div>
            <div className="ip-onboarding-step-title">{s.title}</div>
            <BalancedText
              className="ip-faint ip-text-block ip-onboarding-step-desc"
              lines={[s.desc]}
            />
          </a>
        ))}
      </div>
    </section>
  );
}
