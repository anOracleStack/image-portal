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

const s = {
  page: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    background: "#0a0a0a",
    color: "#ededed",
    fontFamily: "system-ui, sans-serif",
  } as const,
  card: {
    width: "100%",
    maxWidth: 400,
    padding: "2rem",
    borderRadius: 12,
    border: "1px solid #222",
    background: "#111",
  } as const,
  title: {
    margin: "0 0 0.25rem",
    fontSize: "1.5rem",
    fontWeight: 600,
  } as const,
  subtitle: {
    margin: "0 0 1.5rem",
    fontSize: "0.875rem",
    color: "#888",
  } as const,
  label: {
    display: "block",
    marginBottom: 4,
    fontSize: "0.8125rem",
    color: "#aaa",
  } as const,
  input: {
    width: "100%",
    padding: "0.625rem 0.75rem",
    marginBottom: "1rem",
    borderRadius: 8,
    border: "1px solid #333",
    background: "#1a1a1a",
    color: "#ededed",
    fontSize: "0.9375rem",
    outline: "none",
    boxSizing: "border-box" as const,
  },
  button: {
    width: "100%",
    padding: "0.7rem",
    borderRadius: 8,
    border: "none",
    background: "#7df",
    color: "#0a0a0a",
    fontSize: "0.9375rem",
    fontWeight: 600,
    cursor: "pointer",
  } as const,
  toggle: {
    marginTop: "1rem",
    textAlign: "center" as const,
    fontSize: "0.8125rem",
    color: "#888",
  } as const,
  toggleLink: {
    color: "#7df",
    cursor: "pointer",
    textDecoration: "underline",
    marginLeft: 4,
  } as const,
  error: {
    padding: "0.5rem 0.75rem",
    marginBottom: "1rem",
    borderRadius: 8,
    background: "#2a0f0f",
    border: "1px solid #e44",
    color: "#f88",
    fontSize: "0.8125rem",
    lineHeight: 1.45,
  } as const,
};

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
    <div style={s.page}>
      <form onSubmit={handleSubmit} style={s.card}>
        <h1 style={s.title}>{isSignUp ? "Create Account" : "Sign In"}</h1>
        <p style={s.subtitle}>
          {isSignUp
            ? "Sign up, confirm your email, then start building portals"
            : "Welcome back to Image Portal"}
        </p>

        {error && <div style={s.error}>{error}</div>}

        <label style={s.label} htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          placeholder="you@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={s.input}
        />

        <label style={s.label} htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          placeholder="At least 6 characters"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={s.input}
        />

        <button type="submit" disabled={loading} style={s.button}>
          {loading ? "Please wait…" : isSignUp ? "Sign Up" : "Sign In"}
        </button>

        {isSignUp && (
          <p style={{ ...s.subtitle, marginTop: "0.75rem", marginBottom: 0 }}>
            After sign up you must confirm via email before you can sign in.
          </p>
        )}

        <div style={s.toggle}>
          {isSignUp ? "Already have an account?" : "Don't have an account?"}
          <span
            style={s.toggleLink}
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </span>
        </div>
      </form>
    </div>
  );
}

export default function LoginPage() {
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
      <LoginForm />
    </Suspense>
  );
}
