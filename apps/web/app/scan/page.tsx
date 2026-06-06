"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import type { ScanResponse, SourceType } from "@ip/shared";
import {
  EMBED_MODEL,
  EMBED_VERSION,
  assessFrameQuality,
} from "@ip/shared";
import { MarketingPage } from "@/components/marketing/MarketingPage";
import { PageIntro } from "@/components/ui/PageIntro";
import { BalancedText } from "@/components/ui/BalancedText";

const CAPTURE_JPEG_QUALITY = 0.88;

function computeDHash(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): string {
  const size = 8;
  const scaledW = size + 1;
  const gray = new Float64Array(scaledW * size);
  const stepX = (width - 1) / scaledW;
  const stepY = (height - 1) / size;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < scaledW; x++) {
      const px = Math.round(x * stepX);
      const py = Math.round(y * stepY);
      const i = (py * width + px) * 4;
      gray[y * scaledW + x] =
        0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!;
    }
  }
  let bits = "";
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      bits += gray[y * scaledW + x]! > gray[y * scaledW + x + 1]! ? "1" : "0";
    }
  }
  return bits;
}

function computeEmbedding(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): number[] {
  const grid = 16;
  const sx = (width - 1) / grid;
  const sy = (height - 1) / grid;
  const emb: number[] = [];
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid; x++) {
      const i = (Math.round(y * sy) * width + Math.round(x * sx)) * 4;
      emb.push(data[i]! / 255, data[i + 1]! / 255, data[i + 2]! / 255);
    }
  }
  return emb;
}

type CapturePhase = "ready" | "analyzing" | "success" | "retry";

export default function ScanPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const busyRef = useRef(false);

  const [cameraState, setCameraState] = useState<
    "idle" | "starting" | "ready" | "error"
  >("idle");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [phase, setPhase] = useState<CapturePhase>("ready");
  const [sourceType, setSourceType] = useState<SourceType>("print");
  const [retryMessage, setRetryMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResponse | null>(null);

  const startCamera = useCallback(async () => {
    setCameraState("starting");
    setCameraError(null);
    setPhase("ready");
    setRetryMessage(null);
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraState("ready");
    } catch (err: unknown) {
      let msg = "Camera access failed.";
      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          msg = "Camera permission denied. Please allow camera access in your browser settings.";
        } else if (err.name === "NotFoundError") {
          msg = "No camera found on this device.";
        } else if (err.name === "NotReadableError") {
          msg = "Camera is in use by another application.";
        } else {
          msg = err.message || msg;
        }
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setCameraError(msg);
      setCameraState("error");
    }
  }, []);

  const stopCamera = useCallback(() => {
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraState("idle");
    setPhase("ready");
    setRetryMessage(null);
    setResult(null);
  }, []);

  const capturePhoto = useCallback(async () => {
    if (busyRef.current || phase === "analyzing") return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    if (video.readyState < 2) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = video.videoWidth;
    const h = video.videoHeight;
    if (w === 0 || h === 0) return;
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(video, 0, 0);

    const imageData = ctx.getImageData(0, 0, w, h);
    const quality = assessFrameQuality(imageData.data, w, h);
    if (!quality.ok) {
      setPhase("retry");
      setRetryMessage(quality.message ?? "Capture again with a clearer photo.");
      setResult(null);
      return;
    }

    const embedding = computeEmbedding(imageData.data, w, h);
    const phash = computeDHash(imageData.data, w, h);
    const frameBase64 =
      canvas.toDataURL("image/jpeg", CAPTURE_JPEG_QUALITY).split(",")[1] ?? "";

    busyRef.current = true;
    setPhase("analyzing");
    setRetryMessage(null);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embedding,
          phash,
          frameBase64,
          devicePlatform: "web",
          source: "pwa",
          sourceType,
          embeddingModel: EMBED_MODEL,
          embeddingVersion: EMBED_VERSION,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          ((body as Record<string, unknown>).error as string) ??
            `Server error (${res.status})`,
        );
      }
      const data: ScanResponse = await res.json();
      if (data.matched && data.portal) {
        setResult(data);
        setPhase("success");
        setRetryMessage(null);
      } else {
        setResult(data);
        setPhase("retry");
        setRetryMessage(
          data.message ?? "Capture again — center the image & hold steady.",
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Analysis failed";
      setPhase("retry");
      setRetryMessage(`${msg} — capture again.`);
      setResult(null);
    } finally {
      busyRef.current = false;
    }
  }, [phase, sourceType]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const overlayLabel =
    phase === "analyzing"
      ? "ANALYZING"
      : phase === "success"
        ? "MATCHED"
        : phase === "retry"
          ? "RETRY"
          : "READY";

  return (
    <MarketingPage>
      <main className="ip-scan-main ip-scan-main-centered">
        <PageIntro
          title="Capture"
          lines={[
            "Take one photo of a poster, card, menu, or sticker.",
            "We analyze it & deliver the high-quality file when matched.",
          ]}
        />
        <canvas ref={canvasRef} className="ip-hidden-canvas" aria-hidden />

        <div className="ip-scan-video-box">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="ip-scan-video"
            onLoadedMetadata={() => {
              if (cameraState === "starting") setCameraState("ready");
            }}
          />
          {cameraState === "idle" && (
            <div className="ip-scan-idle-overlay">
              <p className="ip-muted ip-scan-placeholder">Camera not started</p>
              <button type="button" className="ip-btn ip-btn-primary" onClick={startCamera}>
                Start camera
              </button>
            </div>
          )}
          {cameraState === "starting" && (
            <div className="ip-scan-idle-overlay">
              <p className="ip-muted ip-scan-placeholder">Camera starting</p>
            </div>
          )}
          {cameraState === "error" && (
            <BalancedText
              className="ip-text-block ip-scan-placeholder ip-scan-placeholder-danger"
              lines={[cameraError ?? "Camera error."]}
            />
          )}

          {cameraState === "ready" && (
            <div className="ip-scan-overlay">
              <span className="ip-scan-overlay-badge">{overlayLabel}</span>
            </div>
          )}
        </div>

        <div className="ip-scan-controls">
          {cameraState === "error" && (
            <button type="button" className="ip-btn ip-btn-primary" onClick={startCamera}>
              Retry camera
            </button>
          )}
          {cameraState === "starting" && (
            <button type="button" className="ip-btn ip-btn-secondary" disabled>
              Camera starting
            </button>
          )}
          {cameraState === "ready" && phase !== "analyzing" && (
            <button
              type="button"
              className="ip-btn ip-btn-primary"
              onClick={capturePhoto}
            >
              {phase === "ready" ? "Capture photo" : "Capture again"}
            </button>
          )}
          {cameraState === "ready" && phase === "analyzing" && (
            <button type="button" className="ip-btn ip-btn-secondary" disabled>
              Analyzing…
            </button>
          )}
          {cameraState === "ready" && (
            <button type="button" className="ip-btn ip-btn-secondary" onClick={stopCamera}>
              Stop camera
            </button>
          )}
        </div>

        {cameraState === "ready" && phase === "ready" && (
          <div className="ip-scan-source-toggle">
            <span className="ip-muted ip-copy-sm">Target type:</span>
            <button
              type="button"
              className={`ip-btn ip-btn-sm ${sourceType === "print" ? "ip-btn-primary" : "ip-btn-secondary"}`}
              onClick={() => setSourceType("print")}
            >
              Printed
            </button>
            <button
              type="button"
              className={`ip-btn ip-btn-sm ${sourceType === "screen" ? "ip-btn-primary" : "ip-btn-secondary"}`}
              onClick={() => setSourceType("screen")}
            >
              Screen
            </button>
          </div>
        )}

        {cameraState === "ready" && (
          <p className="ip-muted ip-scan-privacy-note ip-text-block">
            One photo is enough. We check quality on your device first, then match against
            our catalog. Camera frames are not saved unless a portal match is logged.
          </p>
        )}

        {phase === "retry" && retryMessage && (
          <div className="ip-card ip-card-danger ip-text-block">
            <div className="ip-scan-status-label">Try again</div>
            <BalancedText className="ip-text-block" lines={[retryMessage]} />
            {result && !result.matched && result.confidence > 0 && (
              <p className="ip-faint ip-scan-result-detail">
                Closest match: {(result.confidence * 100).toFixed(0)}% ({result.band})
              </p>
            )}
          </div>
        )}

        {phase === "success" && result?.matched && result.portal && (
          <div className="ip-card ip-scan-result-card">
            <div className="ip-scan-status-label">Matched</div>
            <div>
              <strong>{result.portal.title}</strong>
              <span className="ip-match-badge ip-match-badge-yes">
                {result.band.toUpperCase()} {(result.confidence * 100).toFixed(0)}%
              </span>
              <div className="ip-faint ip-scan-result-detail">
                {result.portal.destinationDomain}
              </div>
              {result.portal.imageUrl && (
                <a
                  href={result.portal.imageUrl}
                  download
                  className="ip-btn ip-btn-primary ip-btn-sm ip-scan-result-cta"
                >
                  Download high-quality image
                </a>
              )}
              {result.portal.slug && (
                <a
                  href={`/p/${result.portal.slug}/go`}
                  className="ip-btn ip-btn-secondary ip-btn-sm ip-scan-result-cta"
                >
                  Open destination
                </a>
              )}
            </div>
          </div>
        )}
      </main>
    </MarketingPage>
  );
}
