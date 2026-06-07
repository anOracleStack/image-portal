"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BalancedText } from "@/components/ui/BalancedText";

type WorkshopMessage = { role: "user" | "assistant"; content: string; at: string };

interface Props {
  portalId: string;
  onApproved: () => void;
}

export default function PortalWorkshop({ portalId, onApproved }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [approving, setApproving] = useState(false);
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
      setError(null);
      setSuccess(null);
      const form = new FormData();
      for (const f of list) form.append("file", f);

      try {
        const res = await fetch(`/api/portals/${portalId}/workshop`, {
          method: "POST",
          body: form,
        });
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
      } finally {
        setUploading(false);
        if (fileRef.current) fileRef.current.value = "";
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

  if (loading) {
    return <p className="ip-muted ip-copy-sm">Loading workshop…</p>;
  }

  return (
    <div className="ip-workshop">
      <BalancedText
        className="ip-muted ip-text-block ip-card-copy ip-copy-sm"
        lines={[
          "Upload reference images, workshop the enhanced version in chat,",
          "& approve when it's ready to go live.",
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
        onClick={() => fileRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") fileRef.current?.click();
        }}
      >
        {uploading ? (
          <p className="ip-muted">Uploading & analyzing…</p>
        ) : (
          <>
            <p className="ip-workshop-upload-title">Add reference images</p>
            <p className="ip-muted ip-copy-sm">
              Drop files here, click to browse, or use your camera. Multiple images OK.
            </p>
          </>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        multiple
        className="ip-hidden-canvas"
        onChange={(e) => {
          if (e.target.files?.length) uploadFiles(e.target.files);
        }}
      />

      {success && <div className="ip-export-msg ip-export-msg-success">{success}</div>}
      {error && <div className="ip-export-msg ip-export-msg-error">{error}</div>}

      {(references.length > 0 || localPreviews.length > 0) && (
        <div className="ip-workshop-refs">
          <h3 className="ip-workshop-section-title">
            Your references ({references.length || localPreviews.length})
            {uploading && localPreviews.length > 0 ? " — uploading…" : ""}
          </h3>
          <div className="ip-workshop-ref-grid">
            {references.map((url, i) => (
              <figure key={`${url}-${i}`} className="ip-workshop-ref-card">
                <img src={cacheBust(url)} alt={`Reference ${i + 1}`} />
                <figcaption>Reference {i + 1}</figcaption>
              </figure>
            ))}
            {references.length === 0 &&
              localPreviews.map((url, i) => (
                <figure key={`local-${url}`} className="ip-workshop-ref-card">
                  <img src={url} alt={`Upload ${i + 1}`} />
                  <figcaption>{uploading ? "Uploading…" : "Not saved yet"}</figcaption>
                </figure>
              ))}
          </div>
        </div>
      )}

      <div className="ip-workshop-main">
        <div className="ip-workshop-preview">
          <h3 className="ip-workshop-section-title">Enhanced output</h3>
          {enhancedUrl ? (
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
            <span>Use enhanced version when going live</span>
          </label>
          <button
            type="button"
            className="ip-btn ip-btn-primary ip-workshop-approve"
            disabled={approving || references.length === 0}
            onClick={handleApprove}
          >
            {approving ? "Going live…" : "Approve & go live"}
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
              placeholder='e.g. "make it brighter" or "sharper"'
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
