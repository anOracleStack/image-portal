"use client";

import { BalancedText } from "@/components/ui/BalancedText";

const steps = [
  { n: 1, title: "Create a portal", href: "/dashboard/create", desc: "Title + HTTPS destination" },
  { n: 2, title: "Upload your visual", href: "/dashboard/create", desc: "Poster, sticker, or photo" },
  { n: 3, title: "Export QR or scan", href: "/scan", desc: "Camera scanner or print-ready QR" },
  { n: 4, title: "Track analytics", href: "/dashboard", desc: "Scans, sources, match rate" },
];

export function OnboardingStrip() {
  return (
    <div
      className="ip-card ip-card-glow ip-card-copy"
      style={{
        marginBottom: "1.5rem",
        background: `linear-gradient(135deg, var(--accent-dim) 0%, var(--bg-card) 100%)`,
      }}
    >
      <h2 className="ip-display" style={{ margin: "0 0 0.5rem", fontSize: "1.1rem", color: "var(--accent)" }}>
        Launch in 4 steps
      </h2>
      <BalancedText
        className="ip-muted ip-text-block"
        style={{ margin: "0 0 1rem", fontSize: "0.85rem", maxWidth: 520 }}
        lines={[
          "Turn any visual into a scannable doorway —",
          "safety checks",
          "& analytics built in.",
        ]}
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 12,
        }}
      >
        {steps.map((s) => (
          <a
            key={s.n}
            href={s.href}
            className="ip-card ip-card-interactive"
            style={{ padding: 12, textDecoration: "none", color: "inherit" }}
          >
            <div className="ip-mono" style={{ color: "var(--accent)", fontWeight: 700, fontSize: "0.7rem" }}>
              Step {s.n}
            </div>
            <div style={{ fontWeight: 600, fontSize: "0.9rem", marginTop: 4 }}>{s.title}</div>
            <div className="ip-faint" style={{ fontSize: "0.75rem", marginTop: 4 }}>
              {s.desc}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
