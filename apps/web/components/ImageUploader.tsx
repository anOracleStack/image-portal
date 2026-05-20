"use client";

import { useCallback, useRef, useState } from "react";

interface Props {
  onUpload: (file: File) => Promise<void>;
  disabled?: boolean;
}

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

function dropzoneStyle(dragOver: boolean): React.CSSProperties {
  return {
    border: `2px dashed ${dragOver ? "#7df" : "#333"}`,
    borderRadius: 12,
    padding: "2rem 1rem",
    textAlign: "center",
    cursor: "pointer",
    transition: "border-color 0.2s",
    background: dragOver ? "rgba(119, 221, 255, 0.06)" : "transparent",
  };
}
function barStyle(pct: number): React.CSSProperties {
  return {
    width: `${pct}%`,
    height: "100%",
    background: "#7df",
    transition: "width 0.3s",
  };
}
const iStyles = {
  preview: { maxWidth: "100%", maxHeight: 240, borderRadius: 8, marginTop: 12, objectFit: "contain" as const },
  progress: { marginTop: 12, height: 6, borderRadius: 3, background: "#222", overflow: "hidden" },
  hint: { fontSize: "0.82rem", color: "#888", marginTop: 8 },
  error: { fontSize: "0.82rem", color: "#ef4444", marginTop: 8 },
};

export default function ImageUploader({ onUpload, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const validateAndUpload = useCallback(
    async (file: File) => {
      setError(null);
      setPreview(null);
      setProgress(0);

      if (!ALLOWED_TYPES.has(file.type)) {
        setError("Only JPEG, PNG, and WebP files are allowed.");
        return;
      }
      if (file.size > MAX_SIZE) {
        setError("File exceeds 10 MB limit.");
        return;
      }

      // Show preview
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);

      setUploading(true);
      setProgress(30);
      try {
        await onUpload(file);
        setProgress(100);
      } finally {
        setUploading(false);
        setProgress(0);
        setPreview(null);
      }
    },
    [onUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) validateAndUpload(file);
    },
    [validateAndUpload]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) validateAndUpload(file);
    },
    [validateAndUpload]
  );

  const busy = uploading || disabled;

  return (
    <div>
      <div
        style={dropzoneStyle(dragOver)}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? (
          <p style={{ color: "#888" }}>Uploading…</p>
        ) : (
          <>
            <p style={{ color: "#ccc", margin: 0 }}>
              Drop an image here or click to browse
            </p>
            <div style={iStyles.hint}>JPEG / PNG / WebP &middot; max 10 MB</div>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: "none" }}
        onChange={handleChange}
      />

      {preview && !busy && (
        <img src={preview} alt="Preview" style={iStyles.preview} />
      )}

      {progress > 0 && progress < 100 && (
        <div style={iStyles.progress}>
          <div style={barStyle(progress)} />
        </div>
      )}

      {error && <div style={iStyles.error}>{error}</div>}
    </div>
  );
}
