"use client";

import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { SubscriptionBadge } from "@/components/SubscriptionBadge";
import { useEffect, useState } from "react";
import type { PlanTier } from "@/lib/subscription";

interface Props {
  user: User;
}

const styles = {
  header: {
    background: "#0f0f0f",
    borderBottom: "1px solid #222",
    position: "sticky" as const,
    top: 0,
    zIndex: 50,
  },
  inner: {
    maxWidth: 1200,
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 1rem",
    height: 56,
  },
  left: {
    display: "flex",
    alignItems: "center",
    gap: 28,
  },
  logo: {
    fontSize: "1.1rem",
    fontWeight: 700,
    color: "#7df",
    textDecoration: "none",
  },
  link: {
    fontSize: "0.875rem",
    color: "#aaa",
    textDecoration: "none",
    transition: "color 0.15s",
  },
  right: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  email: {
    fontSize: "0.8125rem",
    color: "#888",
  },
  logoutBtn: {
    background: "#222",
    border: "none",
    borderRadius: 8,
    padding: "6px 14px",
    fontSize: "0.8125rem",
    color: "#ededed",
    cursor: "pointer",
  },
} as const;

export function Navbar({ user }: Props) {
  const router = useRouter();
  const [tier, setTier] = useState<PlanTier>("free");

  useEffect(() => {
    async function fetchTier() {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );
      const { data } = await supabase
        .from("subscriptions")
        .select("plan_tier")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data?.plan_tier) setTier(data.plan_tier as PlanTier);
    }
    fetchTier();
  }, [user.id]);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header style={styles.header}>
      <div style={styles.inner}>
        <div style={styles.left}>
          <Link href="/" style={styles.logo}>
            Image Portal
          </Link>
          <Link href="/dashboard" style={styles.link}>
            Dashboard
          </Link>
          <Link href="/dashboard/scan-history" style={styles.link}>
            History
          </Link>
          <Link href="/dashboard/api-keys" style={styles.link}>
            API
          </Link>
          <Link href="/gallery" style={styles.link}>
            Gallery
          </Link>
          <Link href="/scan" style={styles.link}>
            Scan
          </Link>
          <Link href="/pricing" style={styles.link}>
            Pricing
          </Link>
          <Link href="/dashboard/settings" style={styles.link}>
            Settings
          </Link>
        </div>

        <div style={styles.right}>
          <span style={styles.email}>{user.email}</span>
          <SubscriptionBadge tier={tier} />
          <button style={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
