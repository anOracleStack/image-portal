import { createClient } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase-admin";

export type PlanTier = "free" | "indie" | "pro" | "enterprise";

export interface PlanLimits {
  maxPortals: number;
  maxScansPerMonth: number;
  maxTeamSeats: number;
}

export const PLANS: Record<PlanTier, PlanLimits> = {
  free:       { maxPortals: 3,      maxScansPerMonth: 200,    maxTeamSeats: 0 },
  indie:      { maxPortals: 25,     maxScansPerMonth: 5000,   maxTeamSeats: 1 },
  pro:        { maxPortals: 100,    maxScansPerMonth: 50000,  maxTeamSeats: 3 },
  enterprise: { maxPortals: 999999, maxScansPerMonth: 999999, maxTeamSeats: 999 },
};

/* ───────── helpers ───────── */

/**
 * Fetch the user's subscription row from the database.
 * Falls back to a "free" default if no row exists.
 */
export async function getUserSubscription(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) {
    return {
      plan_tier: "free" as PlanTier,
      status: "active",
    };
  }

  return data as {
    plan_tier: PlanTier;
    status: string;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    current_period_start: string | null;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
  };
}

/** Return the limit object for a given tier. Falls back to free. */
export function getPlanLimits(tier: PlanTier): PlanLimits {
  return PLANS[tier] ?? PLANS.free;
}

/** Paid tiers (Indie+) may hide portals from the public gallery. */
export function canHideFromGallery(tier: PlanTier): boolean {
  return tier !== "free";
}

/** Free portals are always public in the gallery; paid may choose. */
export function enforceGalleryVisibility(
  tier: PlanTier,
  visibility: "public" | "private"
): "public" | "private" {
  return canHideFromGallery(tier) ? visibility : "public";
}

/**
 * Check whether the user can create another portal under their current plan.
 * Returns an object with `allowed` and `reason` if denied.
 */
export async function checkPortalLimit(userId: string) {
  const admin = createAdminClient();

  const [subResult, countResult] = await Promise.all([
    admin.from("subscriptions").select("plan_tier").eq("user_id", userId).maybeSingle(),
    admin
      .from("portals")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", userId),
  ]);

  const tier: PlanTier = subResult.data?.plan_tier ?? "free";
  const limits = getPlanLimits(tier);
  const currentPortals = countResult.count ?? 0;

  if (currentPortals >= limits.maxPortals) {
    return {
      allowed: false,
      reason: `Your ${tier} plan allows at most ${limits.maxPortals} portals.`,
    };
  }

  return { allowed: true, reason: null };
}

/**
 * Check whether the user can perform another scan this billing month.
 * Returns an object with `allowed`, `remaining`, and `reason` if denied.
 */
export async function checkScanLimit(userId: string, month: string) {
  const admin = createAdminClient();

  const [subResult, usageResult] = await Promise.all([
    admin.from("subscriptions").select("plan_tier").eq("user_id", userId).maybeSingle(),
    admin.from("subscription_usage")
      .select("scan_count")
      .eq("user_id", userId)
      .eq("month", month)
      .maybeSingle(),
  ]);

  const tier: PlanTier = subResult.data?.plan_tier ?? "free";
  const limits = getPlanLimits(tier);
  const used = usageResult.data?.scan_count ?? 0;
  const remaining = limits.maxScansPerMonth - used;

  if (remaining <= 0) {
    return {
      allowed: false,
      remaining: 0,
      reason: `Monthly scan limit of ${limits.maxScansPerMonth} reached. Upgrade to scan more.`,
    };
  }

  return { allowed: true, remaining, reason: null };
}
