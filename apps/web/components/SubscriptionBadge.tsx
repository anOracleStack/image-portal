"use client";

import Link from "next/link";
import type { PlanTier } from "@/lib/subscription";

interface Props {
  tier: PlanTier;
}

const colors: Record<PlanTier, { bg: string; text: string }> = {
  free:       { bg: "#2a2a2a", text: "#999" },
  indie:      { bg: "#14253d", text: "#5b8def" },
  pro:        { bg: "#2a2010", text: "#f0b429" },
  enterprise: { bg: "#1f1030", text: "#a78bfa" },
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
    color: "#7df",
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
