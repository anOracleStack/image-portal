"use client";

import { useCallback, useRef, useState, type CSSProperties } from "react";
import { BalancedText } from "@/components/ui/BalancedText";

interface Props {
  onUpload: (file: File) => Promise<void>;
  disabled?: boolean;
}

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

function dropzoneStyle(dragOver: boolean): CSSProperties {
  return {
    border: `2px dashed ${dragOver ? "var(--accent)" : "var(--border-strong)"}`,
    borderRadius: 12,
    padding: "2rem 1rem",
    textAlign: "center",
    cursor: "pointer",
    transition: "border-color 0.2s",
    background: dragOver
      ? "color-mix(in srgb, var(--accent) 8%, transparent)"
      : "transparent",
  };
}

function barStyle(pct: number): CSSProperties {
  return {
    width: `${pct}%`,
    height: "100%",
    background: "var(--accent)",
    transition: "width 0.3s",
  };
}

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
        setError("Only JPEG, PNG, & WebP files are allowed.");
        return;
      }
      if (file.size > MAX_SIZE) {
        setError("File exceeds 10 MB limit.");
        return;
      }

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
          <BalancedText className="ip-muted ip-text-block" lines={["Uploading…"]} />
        ) : (
          <>
            <BalancedText
              className="ip-text-block"
              style={{ color: "var(--foreground)", margin: 0 }}
              lines={[
                "Drop an image here",
                "or click to browse.",
              ]}
            />
            <BalancedText
              className="ip-muted ip-text-block"
              style={{ marginTop: 8, fontSize: "0.82rem" }}
              lines={["JPEG / PNG / WebP · max 10 MB"]}
            />
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
        <img
          src={preview}
          alt="Preview"
          style={{
            maxWidth: "100%",
            maxHeight: 240,
            borderRadius: 8,
            marginTop: 12,
            objectFit: "contain",
          }}
        />
      )}

      {progress > 0 && progress < 100 && (
        <div
          style={{
            marginTop: 12,
            height: 6,
            borderRadius: 3,
            background: "var(--border-strong)",
            overflow: "hidden",
          }}
        >
          <div style={barStyle(progress)} />
        </div>
      )}

      {error && (
        <BalancedText
          className="ip-text-block"
          style={{ fontSize: "0.82rem", color: "var(--danger)", marginTop: 8 }}
          lines={[error]}
        />
      )}
    </div>
  );
}
