"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { PlanTier } from "@/lib/subscription";
import { canHideFromGallery } from "@/lib/subscription";

interface PortalValues {
  title: string;
  destinationUrl: string;
  scanMode: "image" | "hybrid";
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

const URL_REGEX = /^https?:\/\/.+\..+/i;

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
  const [scanMode, setScanMode] = useState<"image" | "hybrid">(
    initialValues?.scanMode ?? "image"
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

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const errs: Record<string, string> = {};

      if (!title.trim()) errs.title = "Title is required";
      else if (title.length > 120) errs.title = "Max 120 characters";

      if (!destinationUrl.trim()) {
        errs.destinationUrl = "Destination URL is required";
      } else if (!URL_REGEX.test(destinationUrl.trim())) {
        errs.destinationUrl = "Enter a valid URL (http/https)";
      }

      if (Object.keys(errs).length > 0) {
        setErrors(errs);
        return;
      }

      setErrors({});
      setSubmitting(true);
      try {
        await onSubmit({
          title: title.trim(),
          destinationUrl: destinationUrl.trim(),
          scanMode,
          visibility: galleryEditable ? visibility : "public",
        });
      } finally {
        setSubmitting(false);
      }
    },
    [title, destinationUrl, scanMode, visibility, galleryEditable, onSubmit]
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
          value={destinationUrl}
          onChange={(e) => setDestinationUrl(e.target.value)}
          placeholder="https://example.com"
        />
        {errors.destinationUrl && (
          <div style={{ fontSize: "0.9375rem", color: "var(--danger)" }}>
            {errors.destinationUrl}
          </div>
        )}
      </div>

      <div style={pStyles.group}>
        <label style={pStyles.label}>Scan mode</label>
        <select
          className="ip-input"
          value={scanMode}
          onChange={(e) => setScanMode(e.target.value as "image" | "hybrid")}
        >
          <option value="image">Image</option>
          <option value="hybrid">Hybrid</option>
        </select>
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
