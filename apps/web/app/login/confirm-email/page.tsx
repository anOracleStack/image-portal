"use client";

import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { getInboxLinkForEmail } from "@/lib/email-inbox-url";

const s = {
  page: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    background: "#0a0a0a",
    color: "#ededed",
    fontFamily: "system-ui, sans-serif",
    padding: "1.5rem",
  } as const,
  card: {
    width: "100%",
    maxWidth: 440,
    padding: "2rem",
    borderRadius: 12,
    border: "1px solid #222",
    background: "#111",
  } as const,
  title: { margin: "0 0 0.5rem", fontSize: "1.5rem", fontWeight: 600 } as const,
  subtitle: {
    margin: "0 0 1.25rem",
    fontSize: "0.9rem",
    color: "#aaa",
    lineHeight: 1.5,
  } as const,
  emailBox: {
    padding: "0.75rem 1rem",
    marginBottom: "1.25rem",
    borderRadius: 8,
    background: "#1a1a1a",
    border: "1px solid #333",
    fontSize: "0.95rem",
    wordBreak: "break-all" as const,
  },
  steps: {
    margin: "0 0 1.25rem",
    paddingLeft: "1.25rem",
    fontSize: "0.875rem",
    color: "#bbb",
    lineHeight: 1.6,
  },
  primary: {
    display: "block",
    width: "100%",
    padding: "0.75rem",
    marginBottom: "0.75rem",
    borderRadius: 8,
    border: "none",
    background: "#7df",
    color: "#0a0a0a",
    fontSize: "0.9375rem",
    fontWeight: 600,
    cursor: "pointer",
    textAlign: "center" as const,
    textDecoration: "none",
  },
  secondary: {
    display: "block",
    width: "100%",
    padding: "0.7rem",
    marginBottom: "0.5rem",
    borderRadius: 8,
    border: "1px solid #444",
    background: "transparent",
    color: "#ededed",
    fontSize: "0.875rem",
    cursor: "pointer",
  },
  note: { fontSize: "0.8rem", color: "#777", marginTop: "1rem", lineHeight: 1.5 } as const,
  success: {
    padding: "0.5rem 0.75rem",
    marginBottom: "1rem",
    borderRadius: 8,
    background: "#0f2a1a",
    border: "1px solid #2a5",
    color: "#8f8",
    fontSize: "0.8125rem",
  } as const,
  error: {
    padding: "0.5rem 0.75rem",
    marginBottom: "1rem",
    borderRadius: 8,
    background: "#2a0f0f",
    border: "1px solid #e44",
    color: "#f88",
    fontSize: "0.8125rem",
  } as const,
  link: { color: "#7df", textDecoration: "underline" } as const,
};

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
    setStatus("We sent another confirmation email. Check your inbox (and spam).");
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
      <div style={s.page}>
        <div style={s.card}>
          <h1 style={s.title}>Check your email</h1>
          <p style={s.subtitle}>We need your email address to show inbox shortcuts.</p>
          <Link href="/login" style={s.link}>
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.title}>Confirm your email</h1>
        <p style={s.subtitle}>
          We sent a confirmation link to the address below. You must confirm before you can
          use Image Portal.
        </p>

        <div style={s.emailBox}>{email}</div>

        <ol style={s.steps}>
          <li>Open your email inbox (use the button below if we recognize your provider).</li>
          <li>Find the message from Image Portal and tap <strong>Confirm email</strong>.</li>
          <li>You will return to this site and land on your dashboard automatically.</li>
        </ol>

        {status && <div style={s.success}>{status}</div>}
        {error && <div style={s.error}>{error}</div>}

        {inbox && (
          <a href={inbox.href} target="_blank" rel="noopener noreferrer" style={s.primary}>
            {inbox.label}
          </a>
        )}

        <button type="button" style={s.secondary} onClick={() => void resend()}>
          Resend confirmation email
        </button>

        <button
          type="button"
          style={s.secondary}
          disabled={checking}
          onClick={() => void checkConfirmed()}
        >
          {checking ? "Checking…" : "I confirmed — continue to Image Portal"}
        </button>

        <p style={s.note}>
          The link in your email expires after a while. If it fails, use resend above. Already
          confirmed?{" "}
          <Link href="/login" style={s.link}>
            Sign in
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense
      fallback={
        <div style={s.page}>
          <div style={s.card}>
            <p style={s.subtitle}>Loading…</p>
          </div>
        </div>
      }
    >
      <ConfirmEmailContent />
    </Suspense>
  );
}
