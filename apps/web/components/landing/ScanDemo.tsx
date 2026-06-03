"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { BalancedText } from "@/components/ui/BalancedText";

const DEMO_DESTINATION = "rub.pub/summer-launch";

const QUICK_GUIDE = [
  {
    label: "Upload",
    summary: "Drop .JPEG, .PNG, or .WEBP — we access, view, & analyze it.",
  },
  {
    label: "Capture",
    summary: "No file? Snap a photo on your phone. Same analysis.",
  },
  {
    label: "Enhance",
    summary: "We refine your capture & send a clean reference back.",
  },
  {
    label: "Link",
    summary: "Link the URL where viewers land after scanning.",
  },
  {
    label: "Approve",
    summary: "Preview visual + URL — nothing live until approved.",
  },
  {
    label: "Scan",
    summary: "Viewers scan your physical or digital image.",
  },
  {
    label: "Open",
    summary: "Viewers are directed to your attached URL instantly.",
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

const steps: DemoStep[] = [
  {
    id: 0,
    label: "Upload",
    stage: "Upload",
    subtitle: "an image file",
    description: [
      "Drop a .JPEG, .PNG, & .WEBP file — up to 10 MB.",
      "We access, view, & analyze it to build your portal.",
      "Your image becomes the key to every scan.",
    ],
    example: "Example: event poster file (.PNG)",
    image: "/demo/poster-reference.png",
    imageAlt: "Clean event poster ready to upload",
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
    example: "Example: phone photo of a poster on a wall",
    image: "/demo/scan-photo.png",
    imageAlt: "Phone photo of a poster at an angle",
    variant: "scan",
    showReticle: true,
  },
  {
    id: 2,
    label: "Enhance",
    stage: "Enhance",
    subtitle: "we reimagine your visual for you",
    description: [
      "If a photo is taken, we refine your capture",
      "for optimized & enhanced quality.",
      "You receive a clean, high-quality reference.",
      "Nothing goes live until you approve the image.",
    ],
    example: "Example: enhanced reference sent for review",
    image: "/demo/poster-reference.png",
    imageAlt: "Enhanced high-quality reference visual",
    variant: "enhanced",
    showEnhancedBadge: true,
  },
  {
    id: 3,
    label: "Link",
    stage: "Link",
    subtitle: "a URL destination to your image",
    description: [
      "Link the image to wherever viewers should land.",
      "Website, store, menu, or ticket page — any URL.",
      "Update the destination anytime without reprinting",
      "or re-exporting anything at all.",
    ],
    example: `Example: ${DEMO_DESTINATION}`,
    image: "/demo/poster-reference.png",
    imageAlt: "Poster linked to a destination URL",
    variant: "linked",
    linkBadge: DEMO_DESTINATION,
  },
  {
    id: 4,
    label: "Approve",
    stage: "Approve",
    subtitle: "your portal after everything is reviewed",
    description: [
      "Preview the enhanced visual & linked URL.",
      "Approve when the look & destination are correct.",
      "Your scannable portal goes live on your OK.",
    ],
    example: "Example: final preview before going live",
    image: "/demo/poster-reference.png",
    imageAlt: "Portal preview awaiting approval",
    variant: "approve",
    linkBadge: DEMO_DESTINATION,
  },
  {
    id: 5,
    label: "Scan",
    stage: "Scan",
    subtitle: "viewers scan your image when seen",
    description: [
      "Anyone points a camera at the print or screen.",
      "Retrieve → verify — scored in milliseconds.",
      "Real-world photos of the image still match.",
    ],
    example: "Example: scanning a printed flyer in the wild",
    image: "/demo/scan-photo.png",
    imageAlt: "Camera scanning a printed poster",
    variant: "matched",
    showReticle: true,
  },
  {
    id: 6,
    label: "Open",
    stage: "Open",
    subtitle: "the viewer lands on your linked page",
    description: [
      "A successful match opens your URL instantly.",
      "Every scan is logged in your dashboard.",
      `Example destination → ${DEMO_DESTINATION}`,
    ],
    example: "Example: visitor opens your linked page",
    image: null,
    imageAlt: "",
    variant: "open",
    previewUrl: DEMO_DESTINATION,
  },
];

export function ScanDemo() {
  const [active, setActive] = useState(0);
  const index = active % steps.length;
  const step = steps[index]!;

  useEffect(() => {
    const id = setInterval(() => {
      setActive((a) => (a + 1) % steps.length);
    }, 6500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="ip-demo ip-animate-in ip-animate-in-delay-2">
      <div className="ip-demo-guide" aria-label="Quick step guide">
        <p className="ip-demo-guide-label">Quick guide</p>
        <div className="ip-demo-guide-table">
          {QUICK_GUIDE.map((row, i) => (
            <button
              key={row.label}
              type="button"
              className="ip-demo-guide-row"
              data-active={active === i ? "true" : "false"}
              onClick={() => setActive(i)}
              aria-current={active === i ? "step" : undefined}
            >
              <span className="ip-demo-guide-step">{row.label}</span>
              <span className="ip-demo-guide-summary">{row.summary}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="ip-demo-body">
        <header className="ip-demo-header">
          <p className="ip-demo-kicker">Step {active + 1} of {steps.length}</p>
          <h3 className="ip-demo-title">
            <span className="ip-demo-stage-word">{step.stage}</span>
            <span className="ip-demo-stage-sub">{step.subtitle}</span>
          </h3>
          <BalancedText
            className="ip-muted ip-text-block ip-demo-desc ip-demo-desc-numbered"
            lines={step.description}
          />
        </header>

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
                  priority={active <= 1}
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
          <figcaption className="ip-demo-example">{step.example}</figcaption>
        </figure>
      </div>

      <div className="ip-demo-controls">
        <div className="ip-demo-steps" role="tablist" aria-label="Demo steps">
          {steps.map((s) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              className="ip-demo-step"
              data-active={active === s.id ? "true" : "false"}
              onClick={() => setActive(s.id)}
              aria-selected={active === s.id}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
