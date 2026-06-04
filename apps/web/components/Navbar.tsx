"use client";

import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { RqPlusMark } from "@/components/brand/RqPlusMark";
import { SubscriptionBadge } from "@/components/SubscriptionBadge";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useEffect, useState } from "react";
import type { PlanTier } from "@/lib/subscription";

interface Props {
  user: User;
}

const navLinks = [
  { href: "/dashboard", label: "Portals" },
  { href: "/dashboard/scan-history", label: "History" },
  { href: "/dashboard/api-keys", label: "API" },
  { href: "/gallery", label: "Gallery" },
  { href: "/scan", label: "Scan" },
  { href: "/pricing", label: "Pricing" },
  { href: "/dashboard/settings", label: "Settings" },
] as const;

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
    <header className="ip-dash-header">
      <div className="ip-container ip-dash-header-top">
        <Link href="/dashboard" className="ip-logo">
          <RqPlusMark />
          RQ Plus
        </Link>

        <div className="ip-dash-header-actions">
          <ThemeToggle compact />
          <span className="ip-dash-user-email">{user.email}</span>
          <SubscriptionBadge tier={tier} />
          <button type="button" className="ip-btn ip-btn-ghost ip-btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <nav className="ip-container ip-dash-header-nav" aria-label="Dashboard">
        {navLinks.map((link) => (
          <Link key={link.href} href={link.href} className="ip-nav-link">
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
