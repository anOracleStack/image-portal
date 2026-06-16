"use client";

import { UseCaseDemo } from "@/components/landing/UseCaseDemo";

type ScanDemoProps = {
  variant?: "landing" | "hero";
};

/** Interactive upload → scan → open demo for landing visitors. */
export function ScanDemo({ variant = "landing" }: ScanDemoProps) {
  const layout = variant === "hero" ? "hero" : "landing";

  return (
    <UseCaseDemo
      slug="posters-flyers"
      autoAdvance="immediate"
      priorityFrames
      initialStep={0}
      layout={layout}
      className={`ip-demo ip-animate-in ip-animate-in-delay-2${variant === "hero" ? " ip-demo-hero-stage" : ""}`}
    />
  );
}
