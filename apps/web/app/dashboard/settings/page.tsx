"use client";

import { useEffect, useState, useCallback } from "react";
import { createBrowserClient_ } from "@/lib/supabase-browser";
import type { PlanTier } from "@/lib/subscription";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { PageIntro } from "@/components/ui/PageIntro";
import { BalancedText } from "@/components/ui/BalancedText";

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
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <PageIntro
        title="Settings"
        lines={["Account, billing, appearance,", "& growth tools."]}
      />

      {msg && (
        <div
          className="ip-card"
          style={{
            marginBottom: "1rem",
            fontSize: "0.85rem",
            color: "var(--success)",
            borderColor: "color-mix(in srgb, var(--success) 40%, var(--border))",
          }}
        >
          {msg}
        </div>
      )}

      <section className="ip-card" style={{ marginBottom: "1.25rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, margin: "0 0 1rem" }}>Appearance</h2>
        <BalancedText
          className="ip-muted ip-text-block ip-card-copy"
          style={{ fontSize: "0.85rem", marginBottom: 14 }}
          lines={[
            "Choose dark, light,",
            "or match your system setting.",
            "Saved on this device.",
          ]}
        />
        <ThemeToggle />
      </section>

      <section className="ip-card" style={{ marginBottom: "1.25rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, margin: "0 0 1rem" }}>Account</h2>
        <p style={{ margin: "0 0 8px", fontSize: "0.9rem" }}>
          <span className="ip-faint" style={{ marginRight: 12 }}>
            Email
          </span>
          {email}
        </p>
        <p style={{ margin: "0 0 8px", fontSize: "0.9rem" }}>
          <span className="ip-faint" style={{ marginRight: 12 }}>
            Plan
          </span>
          <span style={{ textTransform: "capitalize" }}>{tier}</span>
        </p>
        {tier !== "free" && tier !== "enterprise" && (
          <button
            type="button"
            onClick={openBillingPortal}
            disabled={billingLoading}
            className="ip-btn ip-btn-primary ip-btn-sm"
            style={{ marginTop: 8 }}
          >
            {billingLoading ? "Opening…" : "Manage billing (Stripe)"}
          </button>
        )}
        {tier === "free" && (
          <a href="/pricing" className="ip-btn ip-btn-primary ip-btn-sm" style={{ marginTop: 8, display: "inline-flex" }}>
            Upgrade plan
          </a>
        )}
      </section>

      <section className="ip-card" style={{ marginBottom: "1.25rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, margin: "0 0 1rem" }}>Referrals</h2>
        <BalancedText
          className="ip-muted ip-text-block ip-card-copy"
          style={{ fontSize: "0.85rem", marginBottom: 12 }}
          lines={[
            "Share Image Portal.",
            "When someone signs up with your link,",
            "you both get credited on",
            "future referral rewards.",
          ]}
        />
        <p style={{ margin: "0 0 8px", fontSize: "0.9rem" }}>
          <span className="ip-faint" style={{ marginRight: 12 }}>
            Your code
          </span>
          <code className="ip-mono" style={{ color: "var(--accent)" }}>
            {referralCode || "…"}
          </code>
        </p>
        <button
          type="button"
          onClick={() => copy(referralLink, "Referral link")}
          className="ip-btn ip-btn-secondary ip-btn-sm"
          disabled={!referralLink}
        >
          Copy referral link
        </button>
      </section>

      <section className="ip-card">
        <h2 style={{ fontSize: "1rem", fontWeight: 600, margin: "0 0 1rem" }}>Quick links</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <a href="/dashboard/api-keys" style={{ color: "var(--accent)", textDecoration: "none", fontSize: "0.9rem" }}>
            API keys →
          </a>
          <a href="/dashboard/scan-history" style={{ color: "var(--accent)", textDecoration: "none", fontSize: "0.9rem" }}>
            Scan history →
          </a>
          <a href="/scan" style={{ color: "var(--accent)", textDecoration: "none", fontSize: "0.9rem" }}>
            Open scanner →
          </a>
        </div>
      </section>
    </div>
  );
}
