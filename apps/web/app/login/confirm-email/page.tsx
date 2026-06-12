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
        <div className="ip-auth-card ip-auth-card-center">
          <h1 className="ip-display ip-auth-title">Check your email</h1>
          <BalancedText
            className="ip-muted ip-text-block ip-copy-sm ip-auth-subcopy"
            lines={[
              "We need your email address",
              "to show inbox shortcuts.",
            ]}
          />
          <Link href="/login" className="ip-nav-link ip-auth-toggle-caps ip-btn-mt-lg">
            Sign In
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="ip-auth-card ip-auth-card-center ip-auth-card-confirm ip-auth-card-portal">
        <p className="ip-mono ip-badge ip-badge-accent ip-auth-badge ip-auth-badge-caps">
          Almost there
        </p>
        <h1 className="ip-display ip-auth-title ip-auth-title-confirm ip-auth-title-caps">
          Confirm your email
        </h1>
        <BalancedText
          className="ip-muted ip-text-block ip-copy-sm ip-auth-subcopy"
          lines={[
            "We sent a confirmation link",
            "to the address below.",
            "Confirm before using RQ Plus.",
          ]}
        />

        <div className="ip-confirm-email-chip">{email}</div>

        <BalancedText
          className="ip-muted ip-text-block ip-copy-sm ip-confirm-steps-balanced"
          lines={[
            "Open your inbox & tap Confirm email.",
            "Use the shortcut below if we know your provider.",
            "Return here — we will send you to your dashboard.",
          ]}
        />

        {status && (
          <div className="ip-badge ip-badge-success ip-card-spaced">
            {status}
          </div>
        )}
        {error && <div className="ip-auth-error">{error}</div>}

        {inbox && (
          <a
            href={inbox.href}
            target="_blank"
            rel="noopener noreferrer"
            className="ip-btn ip-btn-primary ip-auth-btn-full ip-auth-input-gap-sm"
          >
            {inbox.label}
          </a>
        )}

        <button
          type="button"
          className="ip-btn ip-btn-secondary ip-auth-btn-full ip-auth-input-gap-sm"
          onClick={() => void resend()}
        >
          Resend confirmation email
        </button>

        <button
          type="button"
          className="ip-btn ip-btn-ghost ip-auth-btn-full"
          disabled={checking}
          onClick={() => void checkConfirmed()}
        >
          {checking ? "Checking…" : "I confirmed — continue"}
        </button>

        <p className="ip-faint ip-auth-hint">
          Links expire after a while. Already confirmed?{" "}
          <Link href="/login" className="ip-link-accent ip-auth-toggle-caps">
            Sign In
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
          <div className="ip-auth-card ip-auth-card-center">
            <BalancedText className="ip-muted ip-text-block" lines={["Loading…"]} />
          </div>
        </AuthShell>
      }
    >
      <ConfirmEmailContent />
    </Suspense>
  );
}
