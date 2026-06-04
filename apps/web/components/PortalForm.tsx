"use client";

import { useCallback, useState } from "react";

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
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toggleStyle(active: boolean): React.CSSProperties {
  return {
    background: active ? "var(--accent)" : "var(--border-strong)",
    border: "none",
    borderRadius: 999,
    width: 48,
    height: 26,
    cursor: "pointer",
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
  input: {},
  select: {},
  error: { fontSize: "0.9375rem", color: "var(--danger)" },
  slugPreview: { fontSize: "0.9375rem", color: "var(--accent)", marginTop: -4, fontFamily: "var(--font-mono)" },
  toggleRow: { display: "flex", gap: 12, alignItems: "center" },
  visibilityLabel: { fontSize: "1rem", color: "var(--text-muted)" },
};

const URL_REGEX = /^https?:\/\/.+\..+/i;

export default function PortalForm({
  initialValues,
  onSubmit,
  isLoading,
  submitLabel = "Save Portal",
}: Props) {
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [destinationUrl, setDestinationUrl] = useState(
    initialValues?.destinationUrl ?? ""
  );
  const [scanMode, setScanMode] = useState<"image" | "hybrid">(
    initialValues?.scanMode ?? "image"
  );
  const [visibility, setVisibility] = useState<"public" | "private">(
    initialValues?.visibility ?? "public"
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

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
          visibility,
        });
      } finally {
        setSubmitting(false);
      }
    },
    [title, destinationUrl, scanMode, visibility, onSubmit]
  );

       const busy = !!(submitting || isLoading);

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 560 }}
    >
      {/* Title */}
      <div style={pStyles.group}>
        <label style={pStyles.label}>Title</label>
        <input
          className="ip-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="My Portal"
        />
        {slug && (
          <div style={pStyles.slugPreview}>Slug: /p/{slug}</div>
        )}
        {errors.title && <div style={pStyles.error}>{errors.title}</div>}
      </div>

      {/* Destination URL */}
      <div style={pStyles.group}>
        <label style={pStyles.label}>Destination URL</label>
        <input
          className="ip-input"
          value={destinationUrl}
          onChange={(e) => setDestinationUrl(e.target.value)}
          placeholder="https://example.com"
        />
        {errors.destinationUrl && (
          <div style={pStyles.error}>{errors.destinationUrl}</div>
        )}
      </div>

      {/* Scan Mode */}
      <div style={pStyles.group}>
        <label style={pStyles.label}>Scan Mode</label>
        <select
          className="ip-input"
          value={scanMode}
          onChange={(e) => setScanMode(e.target.value as "image" | "hybrid")}
        >
          <option value="image">Image</option>
          <option value="hybrid">Hybrid</option>
        </select>
      </div>

      {/* Visibility */}
      <div style={pStyles.group}>
        <label style={pStyles.label}>Visibility</label>
        <div style={pStyles.toggleRow}>
          <button
            type="button"
            style={toggleStyle(visibility === "public")}
            onClick={() =>
              setVisibility(visibility === "public" ? "private" : "public")
            }
          >
            <div style={toggleDotStyle(visibility === "public")} />
          </button>
          <span className="ip-muted" style={pStyles.visibilityLabel}>
            {visibility === "public" ? "Public" : "Private"}
          </span>
        </div>
      </div>

      <button type="submit" className={submitClass(busy)} disabled={busy}>
        {busy ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
