"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

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
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        color: "#ededed",
        fontFamily: "system-ui, sans-serif",
        padding: "2rem 1rem",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <form
        onSubmit={submit}
        style={{
          maxWidth: 420,
          width: "100%",
          background: "#141414",
          border: "1px solid #222",
          borderRadius: 16,
          padding: "2rem",
        }}
      >
        <h1 style={{ fontSize: "1.25rem", margin: "0 0 0.5rem" }}>Report abuse</h1>
        <p style={{ color: "#888", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
          Portal: <strong style={{ color: "#7df" }}>{slug}</strong>
        </p>

        <label style={{ display: "block", marginBottom: "1rem" }}>
          <span style={{ fontSize: "0.8rem", color: "#888" }}>Reason</span>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{
              width: "100%",
              marginTop: 6,
              padding: "10px 12px",
              background: "#1a1a1a",
              border: "1px solid #333",
              borderRadius: 8,
              color: "#ededed",
            }}
          >
            {REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "block", marginBottom: "1.5rem" }}>
          <span style={{ fontSize: "0.8rem", color: "#888" }}>Details (optional)</span>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={4}
            style={{
              width: "100%",
              marginTop: 6,
              padding: "10px 12px",
              background: "#1a1a1a",
              border: "1px solid #333",
              borderRadius: 8,
              color: "#ededed",
              resize: "vertical",
            }}
          />
        </label>

        <button
          type="submit"
          disabled={status === "loading" || status === "done"}
          style={{
            width: "100%",
            padding: "12px",
            background: status === "done" ? "#1a3b1a" : "#7df",
            color: "#0a0a0a",
            border: "none",
            borderRadius: 10,
            fontWeight: 600,
            cursor: status === "loading" ? "wait" : "pointer",
          }}
        >
          {status === "loading" ? "Submitting…" : status === "done" ? "Submitted" : "Submit report"}
        </button>

        {msg && (
          <p
            style={{
              marginTop: 12,
              fontSize: "0.85rem",
              color: status === "error" ? "#ef4444" : "#4ade80",
            }}
          >
            {msg}
          </p>
        )}

        <button
          type="button"
          onClick={() => router.push(`/p/${slug}`)}
          style={{
            marginTop: 16,
            background: "none",
            border: "none",
            color: "#888",
            cursor: "pointer",
            fontSize: "0.85rem",
          }}
        >
          ← Back to portal
        </button>
      </form>
    </div>
  );
}
