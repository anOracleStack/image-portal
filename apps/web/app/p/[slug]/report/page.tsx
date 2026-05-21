"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { MarketingPage } from "@/components/marketing/MarketingPage";
import { BalancedText } from "@/components/ui/BalancedText";

const REASONS = [
  "Phishing or scam",
  "Malware or harmful link",
  "Spam or misleading",
  "Copyright / trademark",
  "Other",
] as const;

export default function ReportAbusePage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const [reason, setReason] = useState<string>(REASONS[0]);
  const [details, setDetails] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMsg("");
    try {
      const portalRes = await fetch(
        `/api/portals/lookup?slug=${encodeURIComponent(slug)}`
      );
      const portalData = await portalRes.json();
      if (!portalRes.ok) throw new Error(portalData.error || "Portal not found");
      const portal = portalData.portal;

      const res = await fetch("/api/abuse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portalId: portal.id,
          reason,
          details,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      setStatus("done");
      setMsg("Report received. Our team will review it.");
    } catch (err) {
      setStatus("error");
      setMsg(err instanceof Error ? err.message : "Failed to submit");
    }
  }

  return (
    <MarketingPage>
      <section
        className="ip-section-center"
        style={{
          padding: "3rem 1rem",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <form
          onSubmit={submit}
          className="ip-card ip-auth-card-center"
          style={{ maxWidth: 420, width: "100%" }}
        >
          <h1 className="ip-display" style={{ fontSize: "1.25rem", margin: "0 0 0.5rem" }}>
            Report abuse
          </h1>
          <BalancedText
            className="ip-muted ip-text-block"
            style={{ marginBottom: "1.5rem", fontSize: "0.85rem" }}
            lines={[`Portal: ${slug}`]}
          />

          <label className="ip-label" style={{ display: "block", marginBottom: "1rem", textAlign: "left" }}>
            Reason
            <select
              className="ip-input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{ width: "100%", marginTop: 6 }}
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>

          <label className="ip-label" style={{ display: "block", marginBottom: "1.5rem", textAlign: "left" }}>
            Details (optional)
            <textarea
              className="ip-input"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
              style={{ width: "100%", marginTop: 6, resize: "vertical" }}
            />
          </label>

          <button
            type="submit"
            className="ip-btn ip-btn-primary"
            disabled={status === "loading" || status === "done"}
            style={{ width: "100%", cursor: status === "loading" ? "wait" : "pointer" }}
          >
            {status === "loading" ? "Submitting…" : status === "done" ? "Submitted" : "Submit report"}
          </button>

          {msg && (
            <BalancedText
              className="ip-text-block"
              style={{
                marginTop: 12,
                fontSize: "0.85rem",
                color: status === "error" ? "var(--danger)" : "var(--success)",
              }}
              lines={[msg]}
            />
          )}

          <button
            type="button"
            className="ip-btn ip-btn-ghost"
            onClick={() => router.push(`/p/${slug}`)}
            style={{ marginTop: 16, width: "100%" }}
          >
            ← Back to portal
          </button>
        </form>
      </section>
    </MarketingPage>
  );
}
