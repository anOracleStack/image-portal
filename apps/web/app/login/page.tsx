"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, type FormEvent, useEffect, useState } from "react";

import { AuthShell } from "@/components/auth/AuthShell";
import { BalancedText } from "@/components/ui/BalancedText";

const KEEP_SIGNED_IN_KEY = "ip_keep_signed_in";

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
  if (lower.includes("provider is not enabled")) {
    return "Google sign-in is not enabled yet. Use email & password, or ask the admin to enable Google in Supabase.";
  }
  return message;
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);

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
    try {
      const stored = localStorage.getItem(KEEP_SIGNED_IN_KEY);
      if (stored === "0") {
        setKeepSignedIn(false);
      }
    } catch {
      /* private mode */
    }
  }, [searchParams]);

  useEffect(() => {
    try {
      localStorage.setItem(KEEP_SIGNED_IN_KEY, keepSignedIn ? "1" : "0");
    } catch {
      /* private mode */
    }
  }, [keepSignedIn]);

  async function signInWithGoogle() {
    setError(null);
    setOauthLoading(true);
    const redirectTo = authCallbackUrl(window.location.origin);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (oauthError) {
        setError(friendlyAuthError(oauthError.message));
        setOauthLoading(false);
      }
    } catch {
      setError("Could not start Google sign-in. Please try again.");
      setOauthLoading(false);
    }
  }

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

  const busy = loading || oauthLoading;
  const inputClass = "ip-input ip-auth-input-center";

  return (
    <AuthShell>
      <form
        onSubmit={handleSubmit}
        className="ip-auth-card ip-auth-card-center ip-auth-card-portal ip-auth-card-login"
      >
        <p className="ip-mono ip-badge ip-badge-accent ip-auth-badge ip-auth-badge-caps">
          {isSignUp ? "New here" : "Welcome back"}
        </p>
        <h1 className="ip-display ip-auth-title ip-auth-title-caps">
          {isSignUp ? "Create Account" : "Sign In"}
        </h1>
        {isSignUp ? (
          <BalancedText
            className="ip-muted ip-text-block ip-copy-sm ip-auth-subcopy"
            lines={["Confirm your email,", "then start building portals."]}
          />
        ) : (
          <BalancedText
            className="ip-muted ip-text-block ip-copy-sm ip-auth-subcopy"
            lines={["Pick up where you left off."]}
          />
        )}

        {error && <div className="ip-auth-error">{error}</div>}

        <button
          type="button"
          className="ip-btn ip-btn-google"
          disabled={busy}
          onClick={() => void signInWithGoogle()}
        >
          <GoogleIcon />
          {oauthLoading ? "Connecting…" : "Continue with Google"}
        </button>

        <div className="ip-auth-divider" role="presentation">
          <span>or use email</span>
        </div>

        <label className="ip-mono ip-faint ip-auth-label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          className={`${inputClass} ip-auth-input-gap`}
          placeholder="you@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />

        <label className="ip-mono ip-faint ip-auth-label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          className={`${inputClass} ip-auth-input-gap-sm`}
          placeholder="At least 6 characters"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={isSignUp ? "new-password" : "current-password"}
        />

        {!isSignUp && (
          <label className="ip-auth-remember">
            <input
              type="checkbox"
              checked={keepSignedIn}
              onChange={(e) => setKeepSignedIn(e.target.checked)}
            />
            Keep me signed in
          </label>
        )}

        <button
          type="submit"
          disabled={busy}
          className="ip-btn ip-btn-primary ip-auth-submit-caps ip-auth-btn-full"
        >
          {loading ? "Please wait…" : isSignUp ? "Sign Up" : "Sign In"}
        </button>

        {isSignUp && (
          <BalancedText
            className="ip-faint ip-text-block ip-auth-hint"
            lines={["Confirm via email before signing in."]}
          />
        )}

        <p className="ip-muted ip-auth-footer">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            type="button"
            className="ip-auth-toggle-caps ip-auth-link-btn"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
          >
            {isSignUp ? "Sign In" : "Sign Up"}
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
          <div className="ip-auth-card ip-auth-card-center ip-auth-card-portal">
            <BalancedText className="ip-muted ip-text-block" lines={["Loading…"]} />
          </div>
        </AuthShell>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
