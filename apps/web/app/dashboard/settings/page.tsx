"use client";

import { useEffect, useState, useCallback } from "react";
import { createBrowserClient_ } from "@/lib/supabase-browser";
import type { PlanTier } from "@/lib/subscription";

export default function SettingsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [tier, setTier] = useState<PlanTier>("free");
  const [referralCode, setReferralCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);

  const appUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "";

  useEffect(() => {
    async function load() {
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      if (!session.user) {
        window.location.href = "/login";
        return;
      }
      setUserId(session.user.id);
      setEmail(session.user.email ?? "");

      const supabase = createBrowserClient_();
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("plan_tier")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (sub?.plan_tier) setTier(sub.plan_tier as PlanTier);

      const { data: profile } = await supabase
        .from("profiles")
        .select("referral_code")
        .eq("id", session.user.id)
        .maybeSingle();
      if (profile?.referral_code) {
        setReferralCode(profile.referral_code);
      } else {
        const code = session.user.id.slice(0, 8).toUpperCase();
        setReferralCode(code);
        await supabase
          .from("profiles")
          .update({ referral_code: code })
          .eq("id", session.user.id);
      }
    }
    load();
  }, []);

  const referralLink = referralCode
    ? `${appUrl}/login?ref=${referralCode}`
    : "";

  const copy = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setMsg(`${label} copied`);
      setTimeout(() => setMsg(null), 2000);
    } catch {
      setMsg("Copy failed");
    }
  }, []);

  async function openBillingPortal() {
    if (!userId) return;
    setBillingLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setMsg(data.error ?? "Billing portal unavailable");
    } catch {
      setMsg("Failed to open billing portal");
    } finally {
      setBillingLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
        Settings
      </h1>
      <p style={{ color: "#888", marginBottom: "2rem", fontSize: "0.9rem" }}>
        Account, billing, and growth tools.
      </p>

      {msg && (
        <div
          style={{
            background: "#1a2a1a",
            border: "1px solid #4ade80",
            borderRadius: 8,
            padding: "10px 14px",
            marginBottom: "1rem",
            fontSize: "0.85rem",
            color: "#4ade80",
          }}
        >
          {msg}
        </div>
      )}

      <section style={card}>
        <h2 style={h2}>Account</h2>
        <p style={row}>
          <span style={label}>Email</span>
          {email}
        </p>
        <p style={row}>
          <span style={label}>Plan</span>
          <span style={{ textTransform: "capitalize" }}>{tier}</span>
        </p>
        {tier !== "free" && tier !== "enterprise" && (
          <button type="button" onClick={openBillingPortal} disabled={billingLoading} style={btn}>
            {billingLoading ? "Opening…" : "Manage billing (Stripe)"}
          </button>
        )}
        {tier === "free" && (
          <a href="/pricing" style={{ ...btn, display: "inline-block", textAlign: "center" as const }}>
            Upgrade plan
          </a>
        )}
      </section>

      <section style={card}>
        <h2 style={h2}>Referrals</h2>
        <p style={{ color: "#888", fontSize: "0.85rem", marginBottom: 12 }}>
          Share Image Portal. When someone signs up with your link, you both get credited on
          future referral rewards.
        </p>
        <p style={row}>
          <span style={label}>Your code</span>
          <code style={{ color: "#7df" }}>{referralCode || "…"}</code>
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => copy(referralLink, "Referral link")}
            style={btnSecondary}
            disabled={!referralLink}
          >
            Copy referral link
          </button>
        </div>
      </section>

      <section style={card}>
        <h2 style={h2}>Quick links</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <a href="/dashboard/api-keys" style={link}>
            API keys →
          </a>
          <a href="/dashboard/scan-history" style={link}>
            Scan history →
          </a>
          <a href="/scan" style={link}>
            Open scanner →
          </a>
        </div>
      </section>
    </div>
  );
}

const card = {
  background: "#141414",
  border: "1px solid #222",
  borderRadius: 12,
  padding: "1.25rem",
  marginBottom: "1.25rem",
} as const;

const h2 = { fontSize: "1rem", fontWeight: 600, margin: "0 0 1rem" } as const;
const row = { margin: "0 0 8px", fontSize: "0.9rem" } as const;
const label = { color: "#666", marginRight: 12 } as const;
const btn = {
  marginTop: 8,
  background: "#7df",
  color: "#0a0a0a",
  border: "none",
  borderRadius: 8,
  padding: "10px 18px",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: "0.875rem",
  textDecoration: "none",
} as const;
const btnSecondary = {
  background: "#222",
  color: "#ededed",
  border: "none",
  borderRadius: 8,
  padding: "10px 18px",
  fontSize: "0.875rem",
  cursor: "pointer",
} as const;
const link = { color: "#7df", textDecoration: "none", fontSize: "0.9rem" } as const;
