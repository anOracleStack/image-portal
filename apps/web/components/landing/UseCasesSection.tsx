"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { BalancedText } from "@/components/ui/BalancedText";
import { UseCaseModal } from "@/components/landing/UseCaseModal";
import { USE_CASES, demoAssetPath, type UseCaseSlug } from "@/lib/use-cases";

export function UseCasesSection() {
  const [openSlug, setOpenSlug] = useState<UseCaseSlug | null>(null);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);

  const open = (slug: UseCaseSlug) => {
    lastTriggerRef.current = triggerRefs.current[slug] ?? null;
    setOpenSlug(slug);
  };

  const close = () => setOpenSlug(null);

  return (
    <>
      <div className="ip-grid-3 ip-use-cases-grid">
        {USE_CASES.map((c) => (
          <button
            key={c.slug}
            ref={(el) => {
              triggerRefs.current[c.slug] = el;
            }}
            type="button"
            className="ip-card ip-card-interactive ip-card-glow ip-card-copy ip-use-case-card"
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
