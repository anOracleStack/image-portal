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
      <section className="ip-marketing-section ip-marketing-section-tight ip-section-center ip-report-wrap">
        <form
          onSubmit={submit}
          className="ip-card ip-auth-card-center ip-report-form"
        >
          <h1 className="ip-display ip-auth-title">Report abuse</h1>
          <BalancedText
            className="ip-muted ip-text-block ip-copy-sm ip-card-spaced"
            lines={[`Portal: ${slug}`]}
          />

          <label className="ip-label ip-report-label">
            Reason
            <select
              className="ip-input ip-report-field"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>

          <label className="ip-label ip-report-label">
            Details (optional)
            <textarea
              className="ip-input ip-report-field ip-report-textarea"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
            />
          </label>

          <button
            type="submit"
            className="ip-btn ip-btn-primary ip-auth-btn-full"
            disabled={status === "loading" || status === "done"}
          >
            {status === "loading" ? "Submitting…" : status === "done" ? "Submitted" : "Submit report"}
          </button>

          {msg && (
            <BalancedText
              className={`ip-text-block ip-status-msg ${status === "error" ? "ip-status-msg-error" : "ip-status-msg-success"}`}
              lines={[msg]}
            />
          )}

          <button
            type="button"
            className="ip-btn ip-btn-ghost ip-auth-btn-full ip-btn-mt-lg"
            onClick={() => router.push(`/p/${slug}`)}
          >
            ← Back to portal
          </button>
        </form>
      </section>
    </MarketingPage>
  );
}
