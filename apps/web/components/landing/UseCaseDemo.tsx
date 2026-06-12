"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { BalancedText } from "@/components/ui/BalancedText";
import { ScanFlowStrip, type ScanFlowPhase } from "@/components/landing/ScanFlowStrip";
import {
  demoAssetPath,
  getUseCase,
  type UseCaseSlug,
} from "@/lib/use-cases";

const QUICK_GUIDE = [
  {
    label: "Upload",
    summary: "Drop .JPEG, .PNG, or .WEBP — we access, view, & analyze it.",
  },
  {
    label: "Capture",
    summary: "No file? Snap a photo on your smart device. Same analysis.",
  },
  {
    label: "Enhance",
    summary: "We refine your capture & send a clean reference back.",
  },
  {
    label: "Link",
    summary: "Link the website URL where viewers land after scanning.",
  },
  {
    label: "Approve",
    summary: "Preview visual + URL — nothing live until approved.",
  },
  {
    label: "Scan & Open",
    summary: "Viewers scan your image and open your linked URL instantly.",
  },
] as const;

type DemoStep = {
  id: number;
  label: string;
  stage: string;
  subtitle: string;
  description: readonly string[];
  example: string;
  image: string | null;
  imageAlt: string;
  variant: string;
  linkBadge?: string;
  previewUrl?: string;
  showReticle?: boolean;
  showEnhancedBadge?: boolean;
};

function buildSteps(slug: UseCaseSlug): DemoStep[] {
  const config = getUseCase(slug);
  const reference = demoAssetPath(slug, "reference");
  const scan = demoAssetPath(slug, "scan");
  const { destination, categoryLabel } = config;

  return [
    {
      id: 0,
      label: "Upload",
      stage: "Upload",
      subtitle: "any image file you want to portal",
      description: [
        "Drop a .JPEG, .PNG, or .WEBP file — up to 10 MB.",
        "We access, view, & analyze it to build your portal.",
        "Your image becomes the key to every scan.",
      ],
      example: config.uploadExample,
      image: reference,
      imageAlt: `Clean ${categoryLabel} ready to upload`,
      variant: "clean",
    },
    {
      id: 1,
      label: "Capture",
      stage: "Capture",
      subtitle: "a photo with your smart device",
      description: [
        "No file on hand? Take a picture instead.",
        "We analyze the shot the same way as an upload.",
        "Angles, glare, & everyday lighting are expected.",
      ],
      example: config.captureExample,
      image: scan,
      imageAlt: `Phone photo of a ${categoryLabel} at an angle`,
      variant: "scan",
      showReticle: true,
    },
    {
      id: 2,
      label: "Enhance",
      stage: "Enhance",
      subtitle: "we refine your capture for scanning",
      description: [
        "We reimagine your photo for optimized quality.",
        "You receive a clean, high-quality reference back.",
        "Nothing goes live until you approve the image.",
      ],
      example: "Example: enhanced reference sent for review",
      image: reference,
      imageAlt: `Enhanced high-quality ${categoryLabel} reference`,
      variant: "enhanced",
      showEnhancedBadge: true,
    },
    {
      id: 3,
      label: "Link",
      stage: "Link",
      subtitle: "a website URL to your portal image",
      description: [
        "Link the image to wherever viewers should land.",
        "Website, store, menu, or ticket page — any URL.",
        "Update the destination anytime without reprinting.",
      ],
      example: `Example: ${destination}`,
      image: reference,
      imageAlt: `${categoryLabel} linked to a destination URL`,
      variant: "linked",
      linkBadge: destination,
    },
    {
      id: 4,
      label: "Approve",
      stage: "Approve",
      subtitle: "your portal before it goes live",
      description: [
        "Preview the enhanced visual & linked URL together.",
        "Approve when the look & destination are correct.",
        "Your scannable portal goes live on your OK.",
      ],
      example: "Example: final preview before going live",
      image: reference,
      imageAlt: "Portal preview awaiting approval",
      variant: "approve",
      linkBadge: destination,
    },
    {
      id: 5,
      label: "Scan & Open",
      stage: "Scan & Open",
      subtitle: "viewers reach your linked website URL",
      description: [
        "Anyone scans your print or screen with a smart device.",
        "A match opens your linked website URL instantly.",
        "Every scan is logged in your dashboard.",
      ],
      example: config.scanExample,
      image: scan,
      imageAlt: `Camera scanning a printed ${categoryLabel}`,
      variant: "matched",
      showReticle: true,
      linkBadge: destination,
      previewUrl: destination,
    },
  ];
}

const AUTO_INTERVAL_MS = 6500;
const STEP5_MATCH_MS = 3250;

function deriveFlowPhase(active: number, step5Phase: "match" | "open"): ScanFlowPhase {
  if (active <= 4) return "scan";
  return step5Phase;
}

export type UseCaseDemoProps = {
  slug: UseCaseSlug;
  autoAdvance?: "immediate" | "after-interaction";
  className?: string;
  /** Hero demo prioritizes first two frames for LCP */
  priorityFrames?: boolean;
  /** Start on a specific step index */
  initialStep?: number;
  layout?: "default" | "landing";
};

export function UseCaseDemo({
  slug,
  autoAdvance = "immediate",
  className = "ip-demo",
  priorityFrames = false,
  initialStep = 0,
  layout = "default",
}: UseCaseDemoProps) {
  const steps = buildSteps(slug);
  const isLanding = layout === "landing";
  const [active, setActive] = useState(initialStep % steps.length);
  const [advanceEnabled, setAdvanceEnabled] = useState(autoAdvance === "immediate");
  const [step5Phase, setStep5Phase] = useState<"match" | "open">("match");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const index = active % steps.length;
  const step = steps[index]!;
  const flowPhase = deriveFlowPhase(index, step5Phase);

  const clearAdvanceTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startAdvanceTimer = useCallback(() => {
    clearAdvanceTimer();
    if (!advanceEnabled) return;
    intervalRef.current = setInterval(() => {
      setActive((a) => (a + 1) % steps.length);
    }, AUTO_INTERVAL_MS);
  }, [advanceEnabled, clearAdvanceTimer, steps.length]);

  const enableAdvance = useCallback(() => {
    setAdvanceEnabled(true);
  }, []);

  useEffect(() => {
    startAdvanceTimer();
    return clearAdvanceTimer;
  }, [active, startAdvanceTimer, clearAdvanceTimer]);

  useEffect(() => {
    if (index !== 5) {
      setStep5Phase("match");
      return;
    }
    setStep5Phase("match");
    const openTimer = window.setTimeout(() => setStep5Phase("open"), STEP5_MATCH_MS);
    return () => window.clearTimeout(openTimer);
  }, [index]);

  const handleInteraction = () => {
    if (autoAdvance === "after-interaction" && !advanceEnabled) {
      enableAdvance();
    }
  };

  const selectStep = (stepIndex: number) => {
    handleInteraction();
    setActive(stepIndex);
  };

  const rootClass = [
    className,
    isLanding ? "ip-demo-layout-landing ip-demo-landing" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const compactLines = [step.description[0]!, step.description[1]!] as [string, string];

  return (
    <div className="ip-scan-demo-wrap">
      {isLanding ? <ScanFlowStrip activePhase={flowPhase} /> : null}
      <div
        className={rootClass}
        onPointerDown={handleInteraction}
        onKeyDown={handleInteraction}
      >
        <div className="ip-demo-body">
          <figure className="ip-demo-figure">
            <div className={`ip-demo-frame ip-demo-frame-${step.variant}`}>
              {step.image ? (
                <>
                  <Image
                    src={step.image}
                    alt={step.imageAlt}
                    fill
                    sizes="400px"
                    className="ip-demo-frame-img"
                    priority={priorityFrames && active <= 1}
                  />
                  {step.showReticle ? <div className="ip-demo-reticle" aria-hidden /> : null}
                  {step.showEnhancedBadge ? (
                    <div className="ip-demo-frame-tag">Enhanced preview</div>
                  ) : null}
                  {step.linkBadge ? (
                    <div className="ip-demo-frame-badge">{step.linkBadge}</div>
                  ) : null}
                  {step.variant === "approve" ? (
                    <div className="ip-demo-approve-bar">
                      <span className="ip-demo-approve-bar-label">Approve & go live</span>
                    </div>
                  ) : null}
                  {step.previewUrl && step.variant === "matched" ? (
                    <div className="ip-demo-scan-open-tag" aria-hidden>
                      Opening linked URL…
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="ip-demo-open-card">
                  <span className="ip-demo-open-label">Destination live</span>
                  {step.previewUrl ? (
                    <span className="ip-demo-open-url">{step.previewUrl}</span>
                  ) : null}
                </div>
              )}
            </div>
            {!isLanding ? (
              <figcaption className="ip-demo-example">{step.example}</figcaption>
            ) : null}
          </figure>

          <div className="ip-demo-guide ip-demo-guide-compact" aria-label="Quick step guide">
            <div className="ip-demo-guide-pills" role="group" aria-label="Jump to step">
              {QUICK_GUIDE.map((row, i) => (
                <button
                  key={row.label}
                  type="button"
                  className="ip-demo-guide-pill"
                  data-active={active === i ? "true" : "false"}
                  onClick={() => selectStep(i)}
                  aria-current={active === i ? "step" : undefined}
                  aria-label={`${row.label}: ${row.summary}`}
                  title={row.summary}
                >
                  {row.label}
                </button>
              ))}
            </div>
          </div>

          {isLanding ? (
            <header className="ip-demo-header ip-demo-header-landing">
              <h3 className="ip-demo-title ip-demo-title-landing">
                <span className="ip-demo-stage-word">{step.stage}</span>
              </h3>
              <BalancedText
                className="ip-muted ip-text-block ip-demo-desc ip-demo-desc-landing"
                lines={compactLines}
              />
            </header>
          ) : (
            <div className="ip-demo-works">
              <p className="ip-demo-works-label">How it works</p>
              <header className="ip-demo-header">
                <p className="ip-demo-kicker">
                  Step {active + 1} of {steps.length}
                </p>
                <h3 className="ip-demo-title">
                  <span className="ip-demo-stage-word">{step.stage}</span>
                  <span className="ip-demo-stage-sub">{step.subtitle}</span>
                </h3>
                <BalancedText
                  className="ip-muted ip-text-block ip-demo-desc ip-demo-desc-numbered"
                  lines={step.description}
                />
              </header>
            </div>
          )}

          {isLanding && index === 5 ? (
            <div
              className={`ip-demo-match-card ip-scan-result-card ip-scan-motion-in${step5Phase === "open" ? " ip-demo-match-card-open" : ""}`}
            >
              <div className="ip-scan-status-label">
                {step5Phase === "open" ? "OPEN" : "MATCHED"}
                <span className="ip-match-badge ip-match-badge-yes">Demo</span>
              </div>
              <div className="ip-scan-url-domain">{step.linkBadge}</div>
              <p className="ip-faint ip-scan-result-detail">
                Summer launch portal · 94% · high
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
