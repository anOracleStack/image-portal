"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import type { ScanResponse } from "@ip/shared";
import { EMBED_MODEL, EMBED_VERSION } from "@ip/shared";
import { MarketingPage } from "@/components/marketing/MarketingPage";
import { PageIntro } from "@/components/ui/PageIntro";
import { BalancedText } from "@/components/ui/BalancedText";

const THROTTLE_MS = 500;
const MAX_LOG = 50;

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

type LogEntry = {
  id: number;
  ts: string;
  response: ScanResponse;
  error?: string;
};

export default function ScanPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const busyRef = useRef(false);
  const nextIdRef = useRef(0);

  const [cameraState, setCameraState] = useState<
    "idle" | "starting" | "ready" | "error"
  >("idle");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [lastResult, setLastResult] = useState<ScanResponse | null>(null);
  const [captureCount, setCaptureCount] = useState(0);

  const startCamera = useCallback(async () => {
    setCameraState("starting");
    setCameraError(null);
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
  }, []);

  const captureAndScan = useCallback(async () => {
    if (busyRef.current) return;
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
    const embedding = computeEmbedding(imageData.data, w, h);
    const phash = computeDHash(imageData.data, w, h);
    const frameBase64 = canvas.toDataURL("image/jpeg", 0.7).split(",")[1] ?? "";

    busyRef.current = true;
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
          sourceType: "screen",
          embeddingModel: EMBED_MODEL,
          embeddingVersion: EMBED_VERSION,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as Record<string, unknown>).error as string ?? `Server error (${res.status})`);
      }
      const data: ScanResponse = await res.json();
      setLastResult(data);
      setLog((prev) => {
        const entry: LogEntry = { id: nextIdRef.current++, ts: new Date().toLocaleTimeString(), response: data };
        return [entry, ...prev].slice(0, MAX_LOG);
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Scan failed";
      const fallback: ScanResponse = {
        band: "low",
        matched: false,
        confidence: 0,
        embeddingDistance: null,
        inlierCount: null,
        matchMethod: "error",
        portal: null,
        message: msg,
      };
      setLog((prev) => {
        const entry: LogEntry = { id: nextIdRef.current++, ts: new Date().toLocaleTimeString(), response: fallback, error: msg };
        return [entry, ...prev].slice(0, MAX_LOG);
      });
    } finally {
      busyRef.current = false;
    }
  }, []);

  const startScanning = useCallback(() => {
    setScanning(true);
    setLog([]);
    nextIdRef.current = 0;
    setCaptureCount(0);
  }, []);

  const stopScanning = useCallback(() => {
    setScanning(false);
  }, []);

  useEffect(() => {
    if (!scanning) {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    intervalRef.current = setInterval(() => {
      captureAndScan().then(() => setCaptureCount((c) => c + 1));
    }, THROTTLE_MS);
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [scanning, captureAndScan]);

  useEffect(() => {
    return () => {
      stopCamera();
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [stopCamera]);

  return (
    <MarketingPage>
      <main className="ip-scan-main">
        <PageIntro
          title="Live scan"
          lines={[
            "Scan a poster, card, menu, or sticker",
            "to open its linked destination.",
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
              <span className="ip-scan-overlay-badge">
                {scanning ? "SCANNING" : "PAUSED"}
              </span>
              {captureCount > 0 && (
                <span className="ip-scan-overlay-badge" title="Frames analyzed this session">
                  {captureCount} frames
                </span>
              )}
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
          {cameraState === "ready" && !scanning && (
            <button type="button" className="ip-btn ip-btn-primary" onClick={startScanning}>
              Start scanning
            </button>
          )}
          {cameraState === "ready" && scanning && (
            <button type="button" className="ip-btn ip-btn-danger" onClick={stopScanning}>
              Stop scanning
            </button>
          )}
          {cameraState === "ready" && (
            <button type="button" className="ip-btn ip-btn-secondary" onClick={stopCamera}>
              Stop camera
            </button>
          )}
        </div>

        {cameraState === "ready" && scanning && (
          <p className="ip-muted ip-scan-hint ip-text-block">
            Each frame is checked against your portal catalog. Use Stop scanning when you are done.
          </p>
        )}

        {error && (
          <div className="ip-card ip-card-danger">{error}</div>
        )}

        {lastResult && (
          <div className="ip-card ip-scan-result-card">
            <div className="ip-scan-status-label">Latest result</div>
            <div>
              {lastResult.matched && lastResult.portal ? (
                <>
                  Matched{" "}
                  <strong>{lastResult.portal.title}</strong>
                  <span
                    className={`ip-match-badge ${lastResult.matched ? "ip-match-badge-yes" : "ip-match-badge-no"}`}
                  >
                    {lastResult.band.toUpperCase()} {(lastResult.confidence * 100).toFixed(0)}%
                  </span>
                  <div className="ip-faint ip-scan-result-detail">
                    {lastResult.portal.destinationDomain}
                  </div>
                  {lastResult.portal.slug && (
                    <a
                      href={`/p/${lastResult.portal.slug}/go`}
                      className="ip-btn ip-btn-secondary ip-btn-sm ip-scan-result-cta"
                    >
                      Open destination
                    </a>
                  )}
                </>
              ) : (
                <>
                  No match
                  <span className="ip-match-badge ip-match-badge-no">
                    {(lastResult.confidence * 100).toFixed(0)}%
                  </span>
                  {lastResult.message && (
                    <div className="ip-faint ip-scan-result-detail">
                      {lastResult.message}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        <div>
          <div className="ip-scan-log-header">
            <h3 className="ip-scan-log-title">Scan Log</h3>
            <span className="ip-faint ip-copy-sm">
              {log.length > 0 ? `Last ${log.length}` : ""}
            </span>
          </div>

          <div className="ip-card ip-scan-log-scroll">
            {log.length === 0 ? (
              <div className="ip-scan-log-empty">
                {scanning ? (
                  <BalancedText
                    className="ip-muted ip-text-block"
                    lines={["Waiting for results…"]}
                  />
                ) : (
                  <p className="ip-muted ip-scan-log-empty-msg">
                    Start scanning to see results here.
                  </p>
                )}
              </div>
            ) : (
              log.map((entry) => (
                <div key={entry.id} className="ip-scan-log-entry">
                  <div className="ip-scan-log-row">
                    <span className="ip-scan-log-ts">{entry.ts}</span>
                    {entry.response.matched && entry.response.portal ? (
                      <span className="ip-scan-log-portal">
                        <span className="ip-text-accent-mono">✓</span>{" "}
                        {entry.response.portal.title}
                      </span>
                    ) : (
                      <span className="ip-faint">
                        {entry.error ? "✗ Error" : "— No match"}
                      </span>
                    )}
                  </div>
                  <span
                    className={`ip-match-badge ip-scan-log-match ${entry.response.matched ? "ip-match-badge-yes" : "ip-match-badge-no"}`}
                  >
                    {(entry.response.confidence * 100).toFixed(0)}%{" "}
                    {entry.response.band.toUpperCase()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </MarketingPage>
  );
}
