"use client";

import { UseCaseDemo } from "@/components/landing/UseCaseDemo";

/** Hero interactive demo — upload through scan & open for landing visitors. */
export function ScanDemo() {
  return (
    <UseCaseDemo
      slug="posters-flyers"
      autoAdvance="immediate"
      priorityFrames
      initialStep={0}
      className="ip-demo ip-animate-in ip-animate-in-delay-2"
    />
  );
}
