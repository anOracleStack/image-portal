"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useId, useRef, type RefObject } from "react";
import { getUseCase, type UseCaseSlug } from "@/lib/use-cases";

const UseCaseDemo = dynamic(
  () => import("@/components/landing/UseCaseDemo").then((m) => m.UseCaseDemo),
  { ssr: false, loading: () => <p className="ip-muted ip-use-case-modal-loading">Loading demo…</p> },
);

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

type UseCaseModalProps = {
  slug: UseCaseSlug | null;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
};

export function UseCaseModal({ slug, onClose, returnFocusRef }: UseCaseModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const config = slug ? getUseCase(slug) : null;

  const trapFocus = useCallback((e: KeyboardEvent) => {
    if (e.key !== "Tab" || !panelRef.current) return;
    const nodes = panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE);
    if (nodes.length === 0) return;
    const first = nodes[0]!;
    const last = nodes[nodes.length - 1]!;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  useEffect(() => {
    if (!slug) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      trapFocus(e);
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
      returnFocusRef.current?.focus();
    };
  }, [slug, onClose, returnFocusRef, trapFocus]);

  if (!slug || !config) return null;

  return (
    <div
      className="ip-use-case-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="ip-use-case-modal-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="ip-use-case-modal-header">
          <div>
            <h2 id={titleId} className="ip-use-case-modal-title">
              {config.titleCaps}
            </h2>
            <p className="ip-muted ip-use-case-modal-sub">
              Seven steps from upload to open — same flow as the hero demo.
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="ip-use-case-modal-close"
            onClick={onClose}
            aria-label="Close demo"
          >
            ×
          </button>
        </header>
        <div className="ip-use-case-modal-body">
          <UseCaseDemo key={slug} slug={slug} autoAdvance="after-interaction" />
        </div>
      </div>
    </div>
  );
}
