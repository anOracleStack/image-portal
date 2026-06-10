"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BalancedText } from "@/components/ui/BalancedText";

type WorkshopMessage = { role: "user" | "assistant"; content: string; at: string };

interface Props {
  portalId: string;
  onApproved: () => void;
}

function BeforeAfterSlider({
  beforeUrl,
  afterUrl,
}: {
  beforeUrl: string;
  afterUrl: string;
}) {
  const [pos, setPos] = useState(50);

  return (
    <div className="ip-workshop-ba">
      <img src={beforeUrl} alt="Reference before" className="ip-workshop-ba-base" />
      <div className="ip-workshop-ba-after" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <img src={afterUrl} alt="Enhanced after" />
      </div>
      <div className="ip-workshop-ba-handle" style={{ left: `${pos}%` }} aria-hidden />
      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        className="ip-workshop-ba-range"
        aria-label="Compare before and after"
      />
      <div className="ip-workshop-ba-labels">
        <span>Before</span>
        <span>After</span>
      </div>
    </div>
  );
}

export default function PortalWorkshop({ portalId, onApproved }: Props) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [approving, setApproving] = useState(false);
  const [approvedFlash, setApprovedFlash] = useState(false);
  const [chatBusy, setChatBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [references, setReferences] = useState<string[]>([]);
  const [enhancedUrl, setEnhancedUrl] = useState<string | null>(null);
  const [messages, setMessages] = useState<WorkshopMessage[]>([]);
  const [useEnhanced, setUseEnhanced] = useState(true);
  const [chatInput, setChatInput] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [localPreviews, setLocalPreviews] = useState<string[]>([]);

  const cacheBust = (url: string) => `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`;

  const revokeLocalPreviews = useCallback((urls: string[]) => {
    for (const url of urls) URL.revokeObjectURL(url);
  }, []);

  const loadState = useCallback(async () => {
    setError(null);
    const res = await fetch(`/api/portals/${portalId}/workshop`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to load workshop");
      return;
    }
    setReferences(data.references ?? []);
    setEnhancedUrl(data.enhancedUrl ?? null);
    setMessages(data.messages ?? []);
    setUseEnhanced(data.useEnhanced ?? true);
  }, [portalId]);

  useEffect(() => {
    loadState().finally(() => setLoading(false));
  }, [loadState]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatBusy]);

  useEffect(
    () => () => {
      revokeLocalPreviews(localPreviews);
    },
    [localPreviews, revokeLocalPreviews],
  );

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files).filter(
        (f) => f.type.startsWith("image/") || /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(f.name),
      );
      if (list.length === 0) {
        setError("Choose JPEG, PNG, or WebP images.");
        return;
      }

      const pendingPreviews = list.map((f) => URL.createObjectURL(f));
      setLocalPreviews((prev) => {
        revokeLocalPreviews(prev);
        return pendingPreviews;
      });

      setUploading(true);
      setUploadPct(8);
      setError(null);
      setSuccess(null);

      const form = new FormData();
      for (const f of list) form.append("file", f);

      try {
        const progressTimer = window.setInterval(() => {
          setUploadPct((p) => (p < 88 ? p + 6 : p));
        }, 280);

        const res = await fetch(`/api/portals/${portalId}/workshop`, {
          method: "POST",
          body: form,
        });
        window.clearInterval(progressTimer);
        setUploadPct(100);

        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Upload failed");
        setReferences(data.references ?? []);
        setEnhancedUrl(data.enhancedUrl ? cacheBust(data.enhancedUrl) : null);
        setMessages(data.messages ?? []);
        setLocalPreviews((prev) => {
          revokeLocalPreviews(prev);
          return [];
        });
        if (data.enhanceFailed) {
          setError(
            "References saved, but the enhanced preview could not be generated. Try again or approve with your reference.",
          );
        } else {
          setSuccess(
            `Uploaded ${list.length} image${list.length === 1 ? "" : "s"} — enhanced preview is ready.`,
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        setLocalPreviews((prev) => {
          revokeLocalPreviews(prev);
          return [];
        });
      } finally {
        setUploading(false);
        setUploadPct(0);
        if (galleryRef.current) galleryRef.current.value = "";
        if (cameraRef.current) cameraRef.current.value = "";
      }
    },
    [portalId, revokeLocalPreviews],
  );

  const sendChat = useCallback(async () => {
    const text = chatInput.trim();
    if (!text || chatBusy) return;
    setChatInput("");
    setChatBusy(true);
    setError(null);
    setMessages((m) => [...m, { role: "user", content: text, at: new Date().toISOString() }]);

    try {
      const res = await fetch(`/api/portals/${portalId}/workshop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "chat", message: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Message failed");
      setMessages(data.messages ?? []);
      if (data.enhancedUrl) setEnhancedUrl(cacheBust(data.enhancedUrl));
      if (data.references) setReferences(data.references);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Message failed");
    } finally {
      setChatBusy(false);
    }
  }, [chatBusy, chatInput, portalId]);

  const handleApprove = useCallback(async () => {
    if (references.length === 0) {
      setError("Upload at least one reference image before approving.");
      return;
    }
    setApproving(true);
    setError(null);
    try {
      const res = await fetch(`/api/portals/${portalId}/image/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ useEnhanced }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Approve failed");
      setSuccess(data.message ?? "Portal is live.");
      setApprovedFlash(true);
      window.setTimeout(() => setApprovedFlash(false), 2400);
      onApproved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approve failed");
    } finally {
      setApproving(false);
    }
  }, [portalId, references.length, useEnhanced, onApproved]);

  const toggleEnhanced = useCallback(
    async (next: boolean) => {
      setUseEnhanced(next);
      await fetch(`/api/portals/${portalId}/workshop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_use_enhanced", useEnhanced: next }),
      });
    },
    [portalId],
  );

  const firstRefUrl = references[0] ? cacheBust(references[0]) : null;
  const showSlider = Boolean(firstRefUrl && enhancedUrl);

  if (loading) {
    return <p className="ip-muted ip-copy-sm">Loading workshop…</p>;
  }

  return (
    <div className="ip-workshop">
      <BalancedText
        className="ip-muted ip-text-block ip-card-copy ip-copy-sm"
        lines={[
          "Upload a photo → compare before/after → approve when ready to publish.",
        ]}
      />

      <div
        className={`ip-workshop-upload${dragOver ? " ip-workshop-upload-active" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
        }}
        onClick={() => !uploading && galleryRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") galleryRef.current?.click();
        }}
      >
        {uploading ? (
          <div className="ip-workshop-upload-progress">
            <p className="ip-muted">Uploading & analyzing…</p>
            <div className="ip-workshop-progress-track" aria-hidden>
              <div
                className="ip-workshop-progress-fill"
                style={{ width: `${uploadPct}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <p className="ip-workshop-upload-title">Add images</p>
            <p className="ip-muted ip-copy-sm">
              Drop files here, or pick from your photo library. Use Take photo for the camera.
            </p>
            <div className="ip-workshop-upload-actions">
              <button
                type="button"
                className="ip-btn ip-btn-primary ip-workshop-upload-cta"
                onClick={(e) => {
                  e.stopPropagation();
                  galleryRef.current?.click();
                }}
              >
                Pick photo
              </button>
              <button
                type="button"
                className="ip-btn ip-btn-secondary ip-workshop-upload-cta"
                onClick={(e) => {
                  e.stopPropagation();
                  cameraRef.current?.click();
                }}
              >
                Take photo
              </button>
            </div>
          </>
        )}
      </div>

      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple
        className="ip-hidden-canvas"
        onChange={(e) => {
          if (e.target.files?.length) uploadFiles(e.target.files);
        }}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="ip-hidden-canvas"
        onChange={(e) => {
          if (e.target.files?.length) uploadFiles(e.target.files);
        }}
      />

      {success && <div className="ip-export-msg ip-export-msg-success">{success}</div>}
      {error && <div className="ip-export-msg ip-export-msg-error">{error}</div>}

      <div className="ip-workshop-layout">
        <aside className="ip-workshop-refs-strip">
          <h3 className="ip-workshop-section-title">
            Your images ({references.length || localPreviews.length})
          </h3>
          {(references.length > 0 || localPreviews.length > 0) ? (
            <div className="ip-workshop-ref-strip">
              {references.map((url, i) => (
                <figure key={`${url}-${i}`} className="ip-workshop-ref-card">
                  <img src={cacheBust(url)} alt={`Reference ${i + 1}`} />
                  <figcaption>Ref {i + 1}</figcaption>
                </figure>
              ))}
              {references.length === 0 &&
                uploading &&
                localPreviews.map((url, i) => (
                  <figure key={`local-${url}`} className="ip-workshop-ref-card">
                    <img src={url} alt={`Upload ${i + 1}`} />
                    <figcaption>Uploading…</figcaption>
                  </figure>
                ))}
            </div>
          ) : (
            <p className="ip-muted ip-copy-sm">No images uploaded yet.</p>
          )}
        </aside>

        <div className="ip-workshop-preview">
          <h3 className="ip-workshop-section-title">AI-enhanced preview</h3>
          <p className="ip-muted ip-copy-sm ip-workshop-section-help">
            Optional AI-enhanced version of your image — compare before approving.
          </p>
          {showSlider && firstRefUrl && enhancedUrl ? (
            <BeforeAfterSlider beforeUrl={firstRefUrl} afterUrl={enhancedUrl} />
          ) : enhancedUrl ? (
            <img
              src={enhancedUrl}
              alt="Enhanced preview"
              className="ip-workshop-enhanced-img"
            />
          ) : (
            <div className="ip-workshop-preview-empty">
              <p className="ip-muted ip-copy-sm">Upload a reference to generate the enhanced visual.</p>
            </div>
          )}
          <label className="ip-portal-workflow-check">
            <input
              type="checkbox"
              checked={useEnhanced}
              onChange={(e) => toggleEnhanced(e.target.checked)}
              disabled={!enhancedUrl}
            />
            <span>Use AI-enhanced version when going live</span>
          </label>
          <button
            type="button"
            className={`ip-btn ip-btn-primary ip-workshop-approve${approvedFlash ? " ip-workshop-approve-success" : ""}`}
            disabled={approving || references.length === 0}
            onClick={handleApprove}
          >
            {approving ? "Going live…" : approvedFlash ? "Live ✓" : "Approve & go live"}
          </button>
        </div>

        <div className="ip-workshop-chat">
          <h3 className="ip-workshop-section-title">Workshop chat</h3>
          <div className="ip-workshop-chat-log">
            {messages.map((msg, i) => (
              <div
                key={`${msg.at}-${i}`}
                className={`ip-workshop-chat-bubble ip-workshop-chat-${msg.role}`}
              >
                {msg.content}
              </div>
            ))}
            {chatBusy && (
              <div className="ip-workshop-chat-bubble ip-workshop-chat-assistant ip-muted">
                Thinking…
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <form
            className="ip-workshop-chat-form"
            onSubmit={(e) => {
              e.preventDefault();
              sendChat();
            }}
          >
            <input
              className="ip-input"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder='e.g. "make it brighter" or "what do you see?"'
              disabled={chatBusy}
            />
            <button type="submit" className="ip-btn ip-btn-secondary" disabled={chatBusy || !chatInput.trim()}>
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
