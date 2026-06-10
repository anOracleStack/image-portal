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
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
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

  const cacheBust = (url: string) => `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`;

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
          "Upload your image in the Images section above.",
          "Refine here with AI enhance, compare before/after,",
          "& approve when ready to publish.",
        ]}
      />

      {success && <div className="ip-export-msg ip-export-msg-success">{success}</div>}
      {error && <div className="ip-export-msg ip-export-msg-error">{error}</div>}

      <div className="ip-workshop-layout">
        <aside className="ip-workshop-refs-strip">
          <h3 className="ip-workshop-section-title">
            Your images ({references.length})
          </h3>
          {references.length > 0 ? (
            <div className="ip-workshop-ref-strip">
              {references.map((url, i) => (
                <figure key={`${url}-${i}`} className="ip-workshop-ref-card">
                  <img src={cacheBust(url)} alt={`Reference ${i + 1}`} />
                  <figcaption>Ref {i + 1}</figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <p className="ip-muted ip-copy-sm">Upload in the Images section above.</p>
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
              <p className="ip-muted ip-copy-sm">Upload in the Images section to generate an enhanced visual.</p>
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
