"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import type { ScanResponse } from "@ip/shared";
import { EMBED_MODEL, EMBED_VERSION } from "@ip/shared";

const THROTTLE_MS = 500;
const MAX_LOG = 50;

// ---------- browser-side perceptual hash (difference hash, 8x8) ----------
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

// ---------- 16x16 RGB grid → 768-dim pixel embedding ----------
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

// ---------- types ----------
type LogEntry = {
  id: number;
  ts: string;
  response: ScanResponse;
  error?: string;
};

// ---------- inline styles ----------
const s = {
  page: {
    background: "#0a0a0a",
    color: "#ededed",
    fontFamily:
      'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    minHeight: "100vh",
    paddingBottom: 40,
  },
  header: {
    background: "#0f0f0f",
    borderBottom: "1px solid #222",
    position: "sticky" as const,
    top: 0,
    zIndex: 50,
  },
  headerInner: {
    maxWidth: 1200,
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 1rem",
    height: 56,
  },
  logo: {
    fontSize: "1.1rem",
    fontWeight: 700,
    color: "#7df",
    textDecoration: "none",
  },
  navLink: {
    fontSize: "0.875rem",
    color: "#aaa",
    textDecoration: "none",
    transition: "color 0.15s",
  },
  main: {
    maxWidth: 800,
    margin: "0 auto",
    padding: "2rem 1rem",
  },
  videoBox: {
    position: "relative" as const,
    borderRadius: 12,
    overflow: "hidden",
    background: "#000",
    marginBottom: 20,
    aspectRatio: "4 / 3" as const,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "contain" as const,
    display: "block",
  },
  videoPlaceholder: {
    color: "#555",
    fontSize: 14,
    textAlign: "center" as const,
    padding: "0 1rem",
  },
  overlay: {
    position: "absolute" as const,
    bottom: 12,
    left: 12,
    right: 12,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  overlayBadge: {
    background: "rgba(0,0,0,0.75)",
    borderRadius: 8,
    padding: "4px 10px",
    fontSize: 12,
    color: "#7df",
    fontVariantNumeric: "tabular-nums" as const,
  },
  controls: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    marginBottom: 20,
    flexWrap: "wrap" as const,
  },
  btn: {
    background: "#222",
    color: "#ededed",
    border: "none",
    borderRadius: 10,
    padding: "10px 22px",
    fontSize: "0.9rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  btnPrimary: {
    background: "#7df",
    color: "#0a0a0a",
    border: "none",
    borderRadius: 10,
    padding: "10px 22px",
    fontSize: "0.9rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  btnDanger: {
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "10px 22px",
    fontSize: "0.9rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  statusCard: {
    background: "#0f0f0f",
    borderRadius: 12,
    padding: "16px 20px",
    border: "1px solid #222",
    marginBottom: 20,
    fontSize: 14,
    lineHeight: 1.6,
  },
  statusLabel: {
    color: "#888",
    fontSize: 12,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    marginBottom: 6,
  },
  matchBadge: (matched: boolean) =>
    ({
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 600,
      background: matched ? "rgba(119,221,255,0.15)" : "rgba(239,68,68,0.15)",
      color: matched ? "#7df" : "#ef4444",
      marginLeft: 8,
    }) as const,
  logBox: {
    background: "#0f0f0f",
    borderRadius: 12,
    border: "1px solid #222",
    maxHeight: 360,
    overflowY: "auto" as const,
  },
  logEntry: {
    padding: "10px 16px",
    borderBottom: "1px solid #1a1a1a",
    fontSize: 13,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  logLeft: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
    flex: 1,
  },
  logTs: {
    color: "#555",
    fontSize: 11,
    fontVariantNumeric: "tabular-nums" as const,
    flexShrink: 0,
  },
  logPortal: {
    whiteSpace: "nowrap" as const,
    overflow: "hidden" as const,
    textOverflow: "ellipsis" as const,
  },
  logEmpty: {
    padding: "24px 16px",
    textAlign: "center" as const,
    color: "#555",
    fontSize: 13,
  },
  errorBox: {
    background: "#2a0a0a",
    border: "1px solid #ef4444",
    borderRadius: 8,
    padding: "12px 16px",
    color: "#ef4444",
    marginBottom: "1rem",
    fontSize: 14,
  },
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

  // ---------- Camera ----------
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

  // ---------- Scan loop ----------
  const captureAndScan = useCallback(async () => {
    if (busyRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    if (video.readyState < 2) return; // not enough data yet
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Match canvas to video dimensions
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

  // Start/stop scanning
  const startScanning = useCallback(() => {
    setScanning(true);
    setLog([]);
    nextIdRef.current = 0;
    setCaptureCount(0);
  }, []);

  const stopScanning = useCallback(() => {
    setScanning(false);
  }, []);

  // Timer for capture loop
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

  // ---------- Cleanup on unmount ----------
  useEffect(() => {
    return () => {
      stopCamera();
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [stopCamera]);

  // ---------- Render ----------
  return (
    <div style={s.page}>
      {/* Header */}
      <header style={s.header}>
        <div style={s.headerInner}>
          <a href="/" style={s.logo}>
            Image Portal
          </a>
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <a href="/dashboard" style={s.navLink}>
              Dashboard
            </a>
            <a href="/scan" style={{ ...s.navLink, color: "#ededed" }}>
              Scan
            </a>
          </div>
        </div>
      </header>

      <main style={s.main}>
        {/* Hidden canvas for frame extraction */}
        <canvas ref={canvasRef} style={{ display: "none" }} />

        {/* Camera preview */}
        <div style={s.videoBox}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={s.video}
            onLoadedMetadata={() => {
              if (cameraState === "starting") setCameraState("ready");
            }}
          />
          {cameraState === "idle" && (
            <div style={s.videoPlaceholder}>
              Camera not started
            </div>
          )}
          {cameraState === "starting" && (
            <div style={s.videoPlaceholder}>
              Starting camera…
            </div>
          )}
          {cameraState === "error" && (
            <div style={{ ...s.videoPlaceholder, color: "#ef4444" }}>
              {cameraError}
            </div>
          )}

          {/* Overlay badges */}
          {cameraState === "ready" && (
            <div style={s.overlay}>
              <span style={s.overlayBadge}>
                {scanning ? "SCANNING" : "PAUSED"}
              </span>
              {captureCount > 0 && (
                <span style={s.overlayBadge}>
                  {captureCount} scans
                </span>
              )}
            </div>
          )}
        </div>

        {/* Controls */}
        <div style={s.controls}>
          {cameraState === "idle" && (
            <button style={s.btnPrimary} onClick={startCamera}>
              Start Camera
            </button>
          )}
          {cameraState === "error" && (
            <button style={s.btnPrimary} onClick={startCamera}>
              Retry Camera
            </button>
          )}
          {cameraState === "starting" && (
            <button style={s.btn} disabled>
              Starting…
            </button>
          )}
          {cameraState === "ready" && !scanning && (
            <button style={s.btnPrimary} onClick={startScanning}>
              Start Scanning
            </button>
          )}
          {cameraState === "ready" && scanning && (
            <button style={s.btnDanger} onClick={stopScanning}>
              Stop Scanning
            </button>
          )}
          {cameraState === "ready" && (
            <button style={s.btn} onClick={stopCamera}>
              Stop Camera
            </button>
          )}
        </div>

        {/* API error */}
        {error && <div style={s.errorBox}>{error}</div>}

        {/* Last scan result */}
        {lastResult && (
          <div style={s.statusCard}>
            <div style={s.statusLabel}>Last Scan</div>
            <div>
              {lastResult.matched && lastResult.portal ? (
                <>
                  Matched{" "}
                  <strong>{lastResult.portal.title}</strong>
                  <span style={s.matchBadge(true)}>
                    {lastResult.band.toUpperCase()} {(lastResult.confidence * 100).toFixed(0)}%
                  </span>
                  <div style={{ color: "#888", fontSize: 12, marginTop: 4 }}>
                    {lastResult.portal.destinationDomain}
                  </div>
                </>
              ) : (
                <>
                  No match
                  <span style={s.matchBadge(false)}>
                    {(lastResult.confidence * 100).toFixed(0)}%
                  </span>
                  {lastResult.message && (
                    <div style={{ color: "#888", fontSize: 12, marginTop: 4 }}>
                      {lastResult.message}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Scan log */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: "0.95rem",
                fontWeight: 600,
                color: "#ededed",
              }}
            >
              Scan Log
            </h3>
            <span style={{ color: "#555", fontSize: 12 }}>
              {log.length > 0 ? `Last ${log.length}` : ""}
            </span>
          </div>

          <div style={s.logBox}>
            {log.length === 0 ? (
              <div style={s.logEmpty}>
                {scanning
                  ? "Waiting for results…"
                  : "Start scanning to see results here."}
              </div>
            ) : (
              log.map((entry) => (
                <div key={entry.id} style={s.logEntry}>
                  <div style={s.logLeft}>
                    <span style={s.logTs}>{entry.ts}</span>
                    {entry.response.matched && entry.response.portal ? (
                      <span style={s.logPortal}>
                        <span style={{ color: "#7df" }}>✓</span>{" "}
                        {entry.response.portal.title}
                      </span>
                    ) : (
                      <span style={{ color: "#888" }}>
                        {entry.error ? "✗ Error" : "— No match"}
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      ...s.matchBadge(entry.response.matched),
                      flexShrink: 0,
                    }}
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
    </div>
  );
}
