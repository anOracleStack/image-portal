"use client";

import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { getInboxLinkForEmail } from "@/lib/email-inbox-url";
import { AuthShell } from "@/components/auth/AuthShell";
import { BalancedText } from "@/components/ui/BalancedText";

function ConfirmEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = (searchParams.get("email") ?? "").trim();
  const inbox = useMemo(() => (email ? getInboxLinkForEmail(email) : null), [email]);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  async function resend() {
    if (!email) return;
    setError(null);
    setStatus(null);
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/auth/welcome")}`,
      },
    });
    if (resendError) {
      setError(resendError.message);
      return;
    }
    setStatus("We sent another confirmation email. Check your inbox (& spam).");
  }

  async function checkConfirmed() {
    setChecking(true);
    setError(null);
    const { data } = await supabase.auth.getSession();
    if (data.session?.user?.email_confirmed_at) {
      router.push("/auth/welcome");
      router.refresh();
      return;
    }
    setChecking(false);
    setError(
      "Not confirmed yet. Open your inbox, tap the link in our email, then try again.",
    );
  }

  if (!email) {
    return (
      <AuthShell>
        <div className="ip-auth-card">
          <h1 className="ip-display" style={{ fontSize: "1.5rem", margin: "0 0 0.5rem" }}>
            Check your email
          </h1>
          <BalancedText
            className="ip-muted ip-text-block"
            lines={[
              "We need your email address",
              "to show inbox shortcuts.",
            ]}
          />
          <Link href="/login" className="ip-nav-link" style={{ marginTop: 16, display: "inline-block" }}>
            Back to sign in
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="ip-auth-card ip-auth-card-center">
        <h1 className="ip-display" style={{ fontSize: "1.5rem", margin: "0 0 0.5rem" }}>
          Confirm your email
        </h1>
        <BalancedText
          className="ip-muted ip-text-block"
          style={{ marginBottom: "1.25rem", maxWidth: 360, lineHeight: 1.55 }}
          lines={[
            "We sent a confirmation link to the",
            "address below. Confirm before",
            "using Image Portal.",
          ]}
        />

        <div className="ip-input" style={{ marginBottom: "1.25rem", wordBreak: "break-all" }}>
          {email}
        </div>

        <ol
          className="ip-muted"
          style={{
            margin: "0 auto 1.25rem",
            paddingLeft: "1.25rem",
            fontSize: "0.875rem",
            lineHeight: 1.6,
            maxWidth: 340,
            textAlign: "left",
          }}
        >
          <li>Open your inbox (button below if we recognize your provider).</li>
          <li>
            Find the message from Image Portal & tap <strong>Confirm email</strong>.
          </li>
          <li>You will return here & land on your dashboard.</li>
        </ol>

        {status && (
          <div className="ip-badge ip-badge-success" style={{ marginBottom: "1rem", display: "block", padding: "0.5rem 0.75rem" }}>
            {status}
          </div>
        )}
        {error && (
          <div style={{ marginBottom: "1rem", color: "var(--danger)", fontSize: "0.8125rem" }}>
            {error}
          </div>
        )}

        {inbox && (
          <a
            href={inbox.href}
            target="_blank"
            rel="noopener noreferrer"
            className="ip-btn ip-btn-primary"
            style={{ width: "100%", marginBottom: "0.75rem" }}
          >
            {inbox.label}
          </a>
        )}

        <button type="button" className="ip-btn ip-btn-secondary" style={{ width: "100%", marginBottom: "0.5rem" }} onClick={() => void resend()}>
          Resend confirmation email
        </button>

        <button
          type="button"
          className="ip-btn ip-btn-ghost"
          style={{ width: "100%" }}
          disabled={checking}
          onClick={() => void checkConfirmed()}
        >
          {checking ? "Checking…" : "I confirmed — continue"}
        </button>

        <p className="ip-faint" style={{ fontSize: "0.8rem", marginTop: "1rem", lineHeight: 1.5 }}>
          Links expire after a while. Already confirmed?{" "}
          <Link href="/login" style={{ color: "var(--accent)" }}>
            Sign in
          </Link>
          .
        </p>
      </div>
    </AuthShell>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense
      fallback={
        <AuthShell>
          <div className="ip-auth-card">
            <p className="ip-muted">Loading…</p>
          </div>
        </AuthShell>
      }
    >
      <ConfirmEmailContent />
    </Suspense>
  );
}
