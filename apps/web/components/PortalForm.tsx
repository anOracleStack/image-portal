"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  destinationUrlErrorMessage,
  normalizeDestinationInput,
  validateDestination,
} from "@ip/shared";
import { canHideFromGallery, type PlanTier } from "@/lib/plans";

interface PortalValues {
  title: string;
  destinationUrl: string;
  visibility: "public" | "private";
}

interface Props {
  initialValues?: Partial<PortalValues>;
  onSubmit: (values: PortalValues) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
  planTier?: PlanTier;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toggleStyle(active: boolean, disabled?: boolean): React.CSSProperties {
  return {
    background: active ? "var(--accent)" : "var(--border-strong)",
    border: "none",
    borderRadius: 999,
    width: 48,
    height: 26,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.55 : 1,
    position: "relative",
    transition: "background 0.2s",
  };
}
function toggleDotStyle(active: boolean): React.CSSProperties {
  return {
    width: 20,
    height: 20,
    borderRadius: "50%",
    background: "var(--accent-foreground)",
    position: "absolute",
    top: 3,
    left: active ? 25 : 3,
    transition: "left 0.2s",
  };
}
function submitClass(disabled: boolean): string {
  return `ip-btn ip-btn-primary ip-form-submit${disabled ? " ip-btn-disabled" : ""}`;
}
const pStyles = {
  group: { display: "flex", flexDirection: "column" as const, gap: 8 },
  label: { fontSize: "1rem", fontWeight: 600, color: "var(--text-muted)" },
  toggleRow: { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" as const },
  visibilityLabel: { fontSize: "1rem", color: "var(--text)" },
};

/** Normalize casual input (methodmoirai.com) to a canonical https URL for display + save. */
function formatDestinationField(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  const verdict = validateDestination(trimmed);
  return verdict.ok ? verdict.normalized : normalizeDestinationInput(trimmed);
}

function destinationFieldError(raw: string): string | undefined {
  const formatted = formatDestinationField(raw);
  if (!formatted) return "Destination URL is required";
  const verdict = validateDestination(formatted);
  if (!verdict.ok) return destinationUrlErrorMessage(verdict.reason);
  return undefined;
}

export default function PortalForm({
  initialValues,
  onSubmit,
  isLoading,
  submitLabel = "Save Portal",
  planTier = "free",
}: Props) {
  const galleryEditable = canHideFromGallery(planTier);
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [destinationUrl, setDestinationUrl] = useState(
    initialValues?.destinationUrl ?? ""
  );
  const [visibility, setVisibility] = useState<"public" | "private">(
    galleryEditable ? (initialValues?.visibility ?? "public") : "public"
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!galleryEditable) setVisibility("public");
  }, [galleryEditable]);

  const slug = slugify(title);

  const applyDestinationFormat = useCallback(() => {
    if (!destinationUrl.trim()) return;
    const formatted = formatDestinationField(destinationUrl);
    setDestinationUrl(formatted);
    const err = destinationFieldError(formatted);
    setErrors((prev) => {
      const next = { ...prev };
      if (err) next.destinationUrl = err;
      else delete next.destinationUrl;
      return next;
    });
  }, [destinationUrl]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const errs: Record<string, string> = {};

      if (!title.trim()) errs.title = "Title is required";
      else if (title.length > 120) errs.title = "Max 120 characters";

      const formattedDestination = formatDestinationField(destinationUrl);
      const destinationErr = destinationFieldError(formattedDestination);
      if (destinationErr) errs.destinationUrl = destinationErr;

      if (Object.keys(errs).length > 0) {
        if (formattedDestination && formattedDestination !== destinationUrl.trim()) {
          setDestinationUrl(formattedDestination);
        }
        setErrors(errs);
        return;
      }

      const verdict = validateDestination(formattedDestination);
      const normalizedUrl = verdict.ok ? verdict.normalized : formattedDestination;
      setDestinationUrl(normalizedUrl);

      setErrors({});
      setSubmitting(true);
      try {
        await onSubmit({
          title: title.trim(),
          destinationUrl: normalizedUrl,
          visibility: galleryEditable ? visibility : "public",
        });
      } finally {
        setSubmitting(false);
      }
    },
    [title, destinationUrl, visibility, galleryEditable, onSubmit]
  );

  const busy = !!(submitting || isLoading);

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 560 }}
    >
      <div style={pStyles.group}>
        <label style={pStyles.label}>Title</label>
        <input
          className="ip-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="My Portal"
        />
        {slug && (
          <div className="ip-mono ip-faint" style={{ fontSize: "0.9375rem", marginTop: -4 }}>
            Slug: /p/{slug}
          </div>
        )}
        {errors.title && (
          <div style={{ fontSize: "0.9375rem", color: "var(--danger)" }}>{errors.title}</div>
        )}
      </div>

      <div style={pStyles.group}>
        <label style={pStyles.label}>Destination URL</label>
        <input
          className="ip-input"
          type="text"
          inputMode="url"
          autoComplete="url"
          value={destinationUrl}
          onChange={(e) => {
            setDestinationUrl(e.target.value);
            if (errors.destinationUrl) {
              setErrors((prev) => {
                const next = { ...prev };
                delete next.destinationUrl;
                return next;
              });
            }
          }}
          onBlur={applyDestinationFormat}
          onKeyDown={(e) => {
            if (e.key === "Enter") applyDestinationFormat();
          }}
          placeholder="methodmoirai.com"
        />
        <p className="ip-muted ip-copy-sm" style={{ marginTop: -4 }}>
          Type any website — we add https:// automatically. Include www only if your site uses it.
        </p>
        {errors.destinationUrl && (
          <div style={{ fontSize: "0.9375rem", color: "var(--danger)" }}>
            {errors.destinationUrl}
          </div>
        )}
      </div>

      <div style={pStyles.group} className="ip-gallery-privacy-field">
        <label style={pStyles.label}>Public gallery</label>
        <p className="ip-muted ip-copy-sm ip-gallery-privacy-hint">
          {galleryEditable
            ? "Public portals appear on the gallery. Private portals stay off the gallery but still work via scan & direct link."
            : "Free plan portals are listed in the public gallery. Upgrade to Indie or above to hide a portal from the gallery."}
        </p>
        <div style={pStyles.toggleRow}>
          <button
            type="button"
            style={toggleStyle(visibility === "public", !galleryEditable)}
            disabled={!galleryEditable}
            aria-pressed={visibility === "public"}
            onClick={() => {
              if (!galleryEditable) return;
              setVisibility(visibility === "public" ? "private" : "public");
            }}
          >
            <div style={toggleDotStyle(visibility === "public")} />
          </button>
          <span style={pStyles.visibilityLabel}>
            {visibility === "public" ? "Listed in gallery" : "Hidden from gallery"}
          </span>
          {!galleryEditable && (
            <Link href="/pricing" className="ip-link-accent ip-copy-sm">
              Upgrade for gallery privacy
            </Link>
          )}
        </div>
      </div>

      <button type="submit" className={submitClass(busy)} disabled={busy}>
        {busy ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
