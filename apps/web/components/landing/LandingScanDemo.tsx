"use client";

import dynamic from "next/dynamic";

const ScanDemo = dynamic(
  () => import("@/components/landing/ScanDemo").then((m) => m.ScanDemo),
  {
    ssr: false,
    loading: () => (
      <div className="ip-demo ip-demo-hero-stage ip-demo-skeleton" aria-hidden>
        <div className="ip-demo-skeleton-pulse" />
        <p className="ip-demo-skeleton-label">INITIALIZING LIVE SCAN…</p>
      </div>
    ),
  },
);

type LandingScanDemoProps = {
  variant?: "landing" | "hero";
};

export function LandingScanDemo({ variant = "landing" }: LandingScanDemoProps) {
  return <ScanDemo variant={variant} />;
}
