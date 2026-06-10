"use client";

import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { RqPlusMark } from "@/components/brand/RqPlusMark";
import { SubscriptionBadge } from "@/components/SubscriptionBadge";
import { useEffect, useState } from "react";
import type { PlanTier } from "@/lib/subscription";
import { getEffectivePlanTier, isOwnerEmail } from "@/lib/owner-access";

interface Props {
  user: User;
}

const navLinks = [
  { href: "/dashboard", label: "Portals" },
  {
    href: "/dashboard/scan-history",
    label: "History",
    hint: "Scan log for your portals — who scanned, when, & match confidence.",
  },
  { href: "/scan", label: "Scan" },
  {
    href: "/dashboard/api-keys",
    label: "API",
    hint: "Programmatic access — create keys to upload portals or query scan data.",
  },
  {
    href: "/gallery",
    label: "Gallery",
    hint: "Public showcase of portals opted in — browse what others have published.",
  },
  { href: "/pricing", label: "Pricing" },
] as const;

function ProfileIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

export function Navbar({ user }: Props) {
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

      const raw = (data?.plan_tier as PlanTier) ?? "free";
      setTier(getEffectivePlanTier(user.email, raw));
    }
    fetchTier();
  }, [user.id, user.email]);

  return (
    <header className="ip-dash-header">
      <div className="ip-container ip-dash-header-inner">
        <Link href="/dashboard" className="ip-logo ip-dash-logo">
          <RqPlusMark />
          <span>RQ Plus</span>
        </Link>

        <nav className="ip-dash-nav" aria-label="Dashboard">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="ip-nav-link"
              title={"hint" in link ? link.hint : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ip-dash-header-actions">
          <SubscriptionBadge tier={tier} isOwner={isOwnerEmail(user.email)} />
          <Link
            href="/dashboard/settings"
            className="ip-btn ip-btn-ghost ip-btn-sm ip-dash-profile-btn"
            aria-label="Profile & settings"
            title="Profile & settings"
          >
            <ProfileIcon />
          </Link>
        </div>
      </div>
    </header>
  );
}
