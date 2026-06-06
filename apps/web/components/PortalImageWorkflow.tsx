"use client";

import { useCallback, useRef, useState } from "react";
import { BalancedText } from "@/components/ui/BalancedText";

interface Props {
  portalId: string;
  onComplete: () => void;
  isInactive: boolean;
}

type Phase = "idle" | "preparing" | "review" | "approving" | "done" | "error";

export default function PortalImageWorkflow({
  portalId,
  onComplete,
  isInactive,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [referencePreview, setReferencePreview] = useState<string | null>(null);
  const [enhancedPreview, setEnhancedPreview] = useState<string | null>(null);
  const [useEnhanced, setUseEnhanced] = useState(true);
  const [doneMsg, setDoneMsg] = useState<string | null>(null);

  const prepareFile = useCallback(
    async (file: File) => {
      setError(null);
      setPhase("preparing");
      setDoneMsg(null);
      const form = new FormData();
      form.append("file", file);

      const res = await fetch(`/api/portals/${portalId}/image/prepare`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        setPhase("error");
        setError(data.error ?? "Prepare failed");
        return;
      }
      setReferencePreview(data.referencePreview);
      setEnhancedPreview(data.enhancedPreview);
      setPhase("review");
    },
    [portalId],
  );

  const onFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) await prepareFile(file);
      e.target.value = "";
    },
    [prepareFile],
  );

  const handleApprove = useCallback(async () => {
    setPhase("approving");
    setError(null);
    const res = await fetch(`/api/portals/${portalId}/image/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ useEnhanced }),
    });
    const data = await res.json();
    if (!res.ok) {
      setPhase("error");
      setError(data.error ?? "Approve failed");
      return;
    }
    setDoneMsg(data.message ?? "Portal is live.");
    setPhase("done");
    onComplete();
  }, [portalId, useEnhanced, onComplete]);

  return (
    <div className="ip-portal-workflow">
      {isInactive && phase === "idle" && (
        <BalancedText
          className="ip-muted ip-text-block ip-card-copy ip-copy-sm"
          lines={[
            "This portal is not live yet.",
            "Upload or capture a visual, review the enhanced version,",
            "& approve to enable scanning.",
          ]}
        />
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="ip-hidden-canvas"
        onChange={onFileChange}
      />

      {phase === "idle" && (
        <div className="ip-portal-workflow-actions">
          <button
            type="button"
            className="ip-btn ip-btn-primary"
            onClick={() => inputRef.current?.click()}
          >
            Upload or capture photo
          </button>
        </div>
      )}

      {phase === "preparing" && (
        <p className="ip-muted ip-copy-sm">Analyzing & enhancing…</p>
      )}

      {phase === "review" && referencePreview && enhancedPreview && (
        <div className="ip-portal-workflow-review">
          <div className="ip-portal-workflow-compare">
            <div>
              <div className="ip-detail-label">Reference</div>
              <img src={referencePreview} alt="Reference" className="ip-detail-thumb" />
            </div>
            <div>
              <div className="ip-detail-label">Enhanced (recommended)</div>
              <img src={enhancedPreview} alt="Enhanced" className="ip-detail-thumb" />
            </div>
          </div>
          <label className="ip-portal-workflow-check">
            <input
              type="checkbox"
              checked={useEnhanced}
              onChange={(e) => setUseEnhanced(e.target.checked)}
            />
            <span>Use enhanced version when going live</span>
          </label>
          <div className="ip-portal-workflow-actions">
            <button
              type="button"
              className="ip-btn ip-btn-primary"
              onClick={handleApprove}
            >
              Approve & go live
            </button>
            <button
              type="button"
              className="ip-btn ip-btn-secondary"
              onClick={() => {
                setPhase("idle");
                setReferencePreview(null);
                setEnhancedPreview(null);
              }}
            >
              Choose different photo
            </button>
          </div>
        </div>
      )}

      {phase === "approving" && (
        <p className="ip-muted ip-copy-sm">Registering image & activating portal…</p>
      )}

      {phase === "done" && doneMsg && (
        <div className="ip-export-msg ip-export-msg-success">{doneMsg}</div>
      )}

      {phase === "error" && error && (
        <div className="ip-export-msg ip-export-msg-error">{error}</div>
      )}
    </div>
  );
}
