"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, type FormEvent, useEffect, useState } from "react";

function authCallbackUrl(origin: string) {
  const next = encodeURIComponent("/auth/welcome");
  return `${origin}/auth/callback?next=${next}`;
}

function friendlyAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("only request this after")) {
    const match = message.match(/(\d+)\s*seconds?/i);
    const sec = match?.[1] ?? "a few";
    return `Too many attempts. Please wait ${sec} seconds, then try again.`;
  }
  if (lower.includes("email not confirmed")) {
    return "Confirm your email first — we sent you a link when you signed up.";
  }
  return message;
}

import { AuthShell } from "@/components/auth/AuthShell";
import { BalancedText } from "@/components/ui/BalancedText";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      document.cookie = `ip_ref=${encodeURIComponent(ref)}; path=/; max-age=604800; SameSite=Lax`;
    }
    const urlError = searchParams.get("error");
    if (urlError) {
      setError(urlError);
    }
    if (searchParams.get("confirmed") === "pending") {
      setIsSignUp(false);
    }
  }, [searchParams]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const redirectTo = authCallbackUrl(window.location.origin);

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirectTo },
        });
        if (signUpError) {
          setError(friendlyAuthError(signUpError.message));
        } else if (data.user && !data.session) {
          router.push(`/login/confirm-email?email=${encodeURIComponent(email)}`);
        } else if (data.session) {
          router.push("/auth/welcome");
          router.refresh();
        } else {
          router.push(`/login/confirm-email?email=${encodeURIComponent(email)}`);
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) {
          if (signInError.message.toLowerCase().includes("email not confirmed")) {
            router.push(`/login/confirm-email?email=${encodeURIComponent(email)}`);
            return;
          }
          setError(friendlyAuthError(signInError.message));
        } else {
          router.push("/dashboard");
          router.refresh();
        }
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <form onSubmit={handleSubmit} className="ip-auth-card ip-auth-card-center">
        <p className="ip-mono ip-badge ip-badge-accent" style={{ marginBottom: 12 }}>
          {isSignUp ? "Create account" : "Welcome back"}
        </p>
        <h1 className="ip-display" style={{ margin: "0 0 0.25rem", fontSize: "1.5rem" }}>
          {isSignUp ? "Create account" : "Sign in"}
        </h1>
        {isSignUp ? (
          <BalancedText
            className="ip-muted ip-text-block"
            style={{ margin: "0 0 1.5rem", fontSize: "0.875rem" }}
            lines={[
              "Confirm your email,",
              "then start building portals.",
            ]}
          />
        ) : (
          <BalancedText
            className="ip-muted ip-text-block"
            style={{ margin: "0 0 1.5rem", fontSize: "0.875rem" }}
            lines={["Pick up where you left off."]}
          />
        )}

        {error && (
          <div
            style={{
              padding: "0.5rem 0.75rem",
              marginBottom: "1rem",
              borderRadius: 8,
              background: "color-mix(in srgb, var(--danger) 12%, transparent)",
              border: "1px solid color-mix(in srgb, var(--danger) 40%, transparent)",
              color: "var(--danger)",
              fontSize: "0.8125rem",
            }}
          >
            {error}
          </div>
        )}

        <label className="ip-mono ip-faint" style={{ display: "block", marginBottom: 4, fontSize: "0.7rem" }} htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          className="ip-input"
          placeholder="you@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ marginBottom: "1rem" }}
        />

        <label className="ip-mono ip-faint" style={{ display: "block", marginBottom: 4, fontSize: "0.7rem" }} htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          className="ip-input"
          placeholder="At least 6 characters"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ marginBottom: "1rem" }}
        />

        <button type="submit" disabled={loading} className="ip-btn ip-btn-primary" style={{ width: "100%" }}>
          {loading ? "Please wait…" : isSignUp ? "Sign up" : "Sign in"}
        </button>

        {isSignUp && (
          <BalancedText
            className="ip-faint ip-text-block"
            style={{ marginTop: "0.75rem", marginBottom: 0, fontSize: "0.8rem" }}
            lines={[
              "You must confirm via email",
              "before signing in.",
            ]}
          />
        )}

        <p className="ip-muted" style={{ marginTop: "1rem", textAlign: "center", fontSize: "0.8125rem" }}>
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            type="button"
            style={{
              background: "none",
              border: "none",
              color: "var(--accent)",
              cursor: "pointer",
              textDecoration: "underline",
              font: "inherit",
            }}
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
          >
            {isSignUp ? "Sign in" : "Sign up"}
          </button>
        </p>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
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
      <LoginForm />
    </Suspense>
  );
}
