"use client";

import { UseCaseDemo } from "@/components/landing/UseCaseDemo";

/** Hero interactive demo — always auto-advances; shares logic with use-case modals. */
export function ScanDemo() {
  return (
    <UseCaseDemo
      slug="posters-flyers"
      autoAdvance="immediate"
      priorityFrames
      className="ip-demo ip-animate-in ip-animate-in-delay-2"
    />
  );
}
