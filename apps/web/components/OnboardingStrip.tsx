"use client";

const steps = [
  { n: 1, title: "Create a portal", href: "/dashboard/create", desc: "Title + HTTPS destination" },
  { n: 2, title: "Upload your visual", href: "/dashboard/create", desc: "Poster, sticker, or photo" },
  { n: 3, title: "Export QR or scan", href: "/scan", desc: "Camera scanner or print-ready QR" },
  { n: 4, title: "Track analytics", href: "/dashboard", desc: "Scans, sources, match rate" },
];

export function OnboardingStrip() {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, #0f1f1f 0%, #141414 100%)",
        border: "1px solid #2a3a3a",
        borderRadius: 14,
        padding: "1.25rem 1.5rem",
        marginBottom: "1.5rem",
      }}
    >
      <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.1rem", color: "#7df" }}>
        Launch in 4 steps
      </h2>
      <p style={{ margin: "0 0 1rem", color: "#888", fontSize: "0.85rem" }}>
        Image Portal turns any visual into a scannable doorway — with safety checks and analytics built in.
      </p>
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
            style={{
              background: "#0a0a0a",
              border: "1px solid #222",
              borderRadius: 10,
              padding: "12px",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <div style={{ color: "#7df", fontWeight: 700, fontSize: "0.75rem" }}>
              STEP {s.n}
            </div>
            <div style={{ fontWeight: 600, fontSize: "0.9rem", marginTop: 4 }}>{s.title}</div>
            <div style={{ color: "#666", fontSize: "0.75rem", marginTop: 4 }}>{s.desc}</div>
          </a>
        ))}
      </div>
    </div>
  );
}
