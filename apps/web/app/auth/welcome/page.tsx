"use client";

import Link from "next/link";

const s = {
  page: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    background: "#0a0a0a",
    color: "#ededed",
    fontFamily: "system-ui, sans-serif",
    padding: "1.5rem",
  } as const,
  card: {
    width: "100%",
    maxWidth: 440,
    padding: "2rem",
    borderRadius: 12,
    border: "1px solid #222",
    background: "#111",
    textAlign: "center" as const,
  } as const,
  title: { margin: "0 0 0.75rem", fontSize: "1.6rem", fontWeight: 600 } as const,
  subtitle: {
    margin: "0 0 1.5rem",
    fontSize: "0.95rem",
    color: "#aaa",
    lineHeight: 1.5,
  } as const,
  button: {
    display: "inline-block",
    padding: "0.75rem 1.5rem",
    borderRadius: 8,
    background: "#7df",
    color: "#0a0a0a",
    fontWeight: 600,
    textDecoration: "none",
    fontSize: "0.95rem",
  } as const,
};

export default function AuthWelcomePage() {
  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.title}>Email confirmed</h1>
        <p style={s.subtitle}>
          You are signed in. Create your first visual portal and start linking scans to
          destinations.
        </p>
        <Link href="/dashboard" style={s.button}>
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
