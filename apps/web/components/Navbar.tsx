"use client";

import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { SubscriptionBadge } from "@/components/SubscriptionBadge";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useEffect, useState } from "react";
import type { PlanTier } from "@/lib/subscription";

interface Props {
  user: User;
}

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
      <div className="ip-container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <Link href="/dashboard" className="ip-logo" style={{ fontSize: "1rem" }}>
            <span className="ip-logo-mark" style={{ width: 22, height: 22 }} aria-hidden />
            Image Portal
          </Link>
          <Link href="/dashboard" className="ip-nav-link">
            Portals
          </Link>
          <Link href="/dashboard/scan-history" className="ip-nav-link">
            History
          </Link>
          <Link href="/dashboard/api-keys" className="ip-nav-link">
            API
          </Link>
          <Link href="/gallery" className="ip-nav-link">
            Gallery
          </Link>
          <Link href="/scan" className="ip-nav-link">
            Scan
          </Link>
          <Link href="/pricing" className="ip-nav-link">
            Pricing
          </Link>
          <Link href="/dashboard/settings" className="ip-nav-link">
            Settings
          </Link>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <ThemeToggle compact />
          <span className="ip-faint" style={{ fontSize: "0.75rem", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user.email}
          </span>
          <SubscriptionBadge tier={tier} />
          <button type="button" className="ip-btn ip-btn-ghost ip-btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
