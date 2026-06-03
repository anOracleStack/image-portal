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
    <div className="ip-dash-page">
      <PageIntro
        title="Settings"
        lines={["Account, billing, appearance,", "& growth tools."]}
      />

      {msg && (
        <div className="ip-card ip-card-success-msg ip-card-spaced">{msg}</div>
      )}

      <section className="ip-card ip-card-spaced">
        <h2 className="ip-card-section-title">Appearance</h2>
        <BalancedText
          className="ip-muted ip-text-block ip-card-copy ip-copy-sm"
          lines={[
            "Choose dark, light,",
            "or match your system setting.",
            "Saved on this device.",
          ]}
        />
        <ThemeToggle />
      </section>

      <section className="ip-card ip-card-spaced">
        <h2 className="ip-card-section-title">Account</h2>
        <p className="ip-account-row">
          <span className="ip-faint ip-account-label">Email</span>
          {email}
        </p>
        <p className="ip-account-row">
          <span className="ip-faint ip-account-label">Plan</span>
          <span className="ip-capitalize">{tier}</span>
        </p>
        {tier !== "free" && tier !== "enterprise" && (
          <button
            type="button"
            onClick={openBillingPortal}
            disabled={billingLoading}
            className="ip-btn ip-btn-primary ip-btn-sm ip-btn-mt-sm"
          >
            {billingLoading ? "Opening…" : "Manage billing (Stripe)"}
          </button>
        )}
        {tier === "free" && (
          <a
            href="/pricing"
            className="ip-btn ip-btn-primary ip-btn-sm ip-btn-mt-sm"
          >
            Upgrade plan
          </a>
        )}
      </section>

      <section className="ip-card ip-card-spaced">
        <h2 className="ip-card-section-title">Referrals</h2>
        <BalancedText
          className="ip-muted ip-text-block ip-card-copy ip-copy-sm"
          lines={[
            "Share Image Portal.",
            "When someone signs up with your link,",
            "you both get credited on",
            "future referral rewards.",
          ]}
        />
        <p className="ip-account-row">
          <span className="ip-faint ip-account-label">Your code</span>
          <code className="ip-mono ip-text-accent-mono">
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
        <h2 className="ip-card-section-title">Quick links</h2>
        <div className="ip-stack-links ip-stack-links-start">
          <a href="/dashboard/api-keys">API keys →</a>
          <a href="/dashboard/scan-history">Scan history →</a>
          <a href="/scan">Open scanner →</a>
        </div>
      </section>
    </div>
  );
}
