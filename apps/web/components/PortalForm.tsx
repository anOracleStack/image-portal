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
    background: active ? "#7df" : "#333",
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
    background: "#0a0a0a",
    position: "absolute",
    top: 3,
    left: active ? 25 : 3,
    transition: "left 0.2s",
  };
}
function submitStyle(disabled: boolean): React.CSSProperties {
  return {
    background: disabled ? "#333" : "#7df",
    border: "none",
    borderRadius: 10,
    padding: "12px 24px",
    fontSize: "1rem",
    fontWeight: 600,
    color: disabled ? "#666" : "#0a0a0a",
    cursor: disabled ? "not-allowed" : "pointer",
    marginTop: 8,
  };
}
const pStyles = {
  group: { display: "flex", flexDirection: "column" as const, gap: 6 },
  label: { fontSize: "0.85rem", fontWeight: 500, color: "#bbb" },
  input: { background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, padding: "10px 14px", fontSize: "0.95rem", color: "#ededed", outline: "none" },
  select: { background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, padding: "10px 14px", fontSize: "0.95rem", color: "#ededed", outline: "none" },
  error: { fontSize: "0.8rem", color: "#ef4444" },
  slugPreview: { fontSize: "0.82rem", color: "#7df", marginTop: -4, fontFamily: "monospace" },
  toggleRow: { display: "flex", gap: 12, alignItems: "center" },
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
          style={pStyles.input}
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
          style={pStyles.input}
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
          style={pStyles.select}
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
          <span style={{ fontSize: "0.9rem", color: "#ccc" }}>
            {visibility === "public" ? "Public" : "Private"}
          </span>
        </div>
      </div>

      <button type="submit" style={submitStyle(busy)} disabled={busy}>
        {busy ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
