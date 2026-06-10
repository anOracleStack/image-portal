"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { BalancedText } from "@/components/ui/BalancedText";
import { UseCaseModal } from "@/components/landing/UseCaseModal";
import { USE_CASES, demoAssetPath, type UseCaseSlug } from "@/lib/use-cases";

type UseCasesSectionProps = {
  /** Show only the first N use cases (landing viewport). */
  limit?: number;
  /** Tighter cards for full-viewport landing row. */
  compact?: boolean;
};

export function UseCasesSection({ limit, compact = false }: UseCasesSectionProps = {}) {
  const [openSlug, setOpenSlug] = useState<UseCaseSlug | null>(null);
  const cases = limit != null ? USE_CASES.slice(0, limit) : USE_CASES;
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);

  const open = (slug: UseCaseSlug) => {
    lastTriggerRef.current = triggerRefs.current[slug] ?? null;
    setOpenSlug(slug);
  };

  const close = () => setOpenSlug(null);

  return (
    <>
      <div
        className={`ip-use-cases-grid${compact ? " ip-landing-cards-row ip-landing-use-cases-row" : " ip-grid-3"}`}
      >
        {cases.map((c) => (
          <button
            key={c.slug}
            ref={(el) => {
              triggerRefs.current[c.slug] = el;
            }}
            type="button"
            className={`ip-card ip-card-interactive ip-card-glow ip-card-copy ip-use-case-card${compact ? " ip-landing-compact-card" : ""}`}
            onClick={() => open(c.slug)}
            aria-haspopup="dialog"
            aria-expanded={openSlug === c.slug}
          >
            <div className="ip-use-case-card-thumb">
              <Image
                src={demoAssetPath(c.slug, "thumb")}
                alt={`${c.titleCaps} print preview`}
                width={280}
                height={350}
                className="ip-use-case-card-thumb-img"
                loading="lazy"
                sizes="(max-width: 640px) 100vw, 280px"
              />
              <span className="ip-use-case-card-thumb-shade" aria-hidden />
            </div>
            <h3 className="ip-display ip-use-case-card-title">{c.titleCaps}</h3>
            <BalancedText
              className="ip-muted ip-text-block ip-copy-sm"
              lines={c.lines}
            />
          </button>
        ))}
      </div>
      <UseCaseModal slug={openSlug} onClose={close} returnFocusRef={lastTriggerRef} />
    </>
  );
}
