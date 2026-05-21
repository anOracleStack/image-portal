"use client";

import Link from "next/link";
import type { PlanTier } from "@/lib/subscription";

interface Props {
  tier: PlanTier;
}

const colors: Record<PlanTier, { bg: string; text: string }> = {
  free: {
    bg: "var(--bg-elevated)",
    text: "var(--text-muted)",
  },
  indie: {
    bg: "color-mix(in srgb, var(--accent) 18%, transparent)",
    text: "var(--accent)",
  },
  pro: {
    bg: "color-mix(in srgb, var(--warning, #facc15) 18%, transparent)",
    text: "var(--warning, #facc15)",
  },
  enterprise: {
    bg: "color-mix(in srgb, var(--success) 18%, transparent)",
    text: "var(--success)",
  },
};

const styles = {
  wrapper: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  },
  badge: (tier: PlanTier) => {
    const c = colors[tier] ?? colors.free;
    return {
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: 999,
      fontSize: "0.75rem",
      fontWeight: 600,
      background: c.bg,
      color: c.text,
      textTransform: "capitalize" as const,
    };
  },
  upgradeLink: {
    fontSize: "0.75rem",
    color: "var(--accent)",
    textDecoration: "none",
    fontWeight: 600,
  },
};

export function SubscriptionBadge({ tier }: Props) {
  return (
    <span style={styles.wrapper}>
      <span style={styles.badge(tier)}>{tier}</span>
      {tier === "free" && (
        <Link href="/pricing" style={styles.upgradeLink}>
          Upgrade
        </Link>
      )}
    </span>
  );
}
