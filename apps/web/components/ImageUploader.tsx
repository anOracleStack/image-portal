"use client";

import { useCallback, useRef, useState, type CSSProperties } from "react";
import { BalancedText } from "@/components/ui/BalancedText";
import { compressImageForUpload } from "@/lib/compress-image-client";

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
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const validateAndUpload = useCallback(
    async (file: File) => {
      setError(null);
      setSuccess(null);
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
        const prepared = await compressImageForUpload(file);
        setProgress(60);
        await onUpload(prepared);
        setProgress(100);
        setSuccess("Image uploaded successfully.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed.");
        setPreview(null);
      } finally {
        setUploading(false);
        setProgress(0);
        if (galleryRef.current) galleryRef.current.value = "";
        if (cameraRef.current) cameraRef.current.value = "";
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
        onClick={() => galleryRef.current?.click()}
      >
        {busy ? (
          <BalancedText className="ip-muted ip-text-block" lines={["Uploading…"]} />
        ) : (
          <>
            <BalancedText
              className="ip-text-block"
              style={{ color: "var(--foreground)", margin: 0 }}
              lines={["Drop an image here", "or pick from your photo library."]}
            />
            <div className="ip-uploader-actions">
              <button
                type="button"
                className="ip-btn ip-btn-primary ip-uploader-cta"
                onClick={(e) => {
                  e.stopPropagation();
                  galleryRef.current?.click();
                }}
              >
                Upload image
              </button>
              <button
                type="button"
                className="ip-btn ip-btn-secondary ip-uploader-cta"
                onClick={(e) => {
                  e.stopPropagation();
                  cameraRef.current?.click();
                }}
                aria-label="Take photo with camera"
              >
                Camera
              </button>
            </div>
            <BalancedText
              className="ip-muted ip-text-block"
              style={{ marginTop: 8, fontSize: "0.82rem" }}
              lines={["JPEG / PNG / WebP · max 10 MB"]}
            />
          </>
        )}
      </div>

      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleChange}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={handleChange}
      />

      {preview && (
        <img
          src={preview}
          alt="Preview"
          className="ip-uploader-preview"
        />
      )}

      {success && !busy && (
        <BalancedText
          className="ip-text-block ip-export-msg-success"
          style={{ fontSize: "0.82rem", marginTop: 8 }}
          lines={[success]}
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
