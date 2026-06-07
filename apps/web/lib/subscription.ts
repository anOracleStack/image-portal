import { createClient } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase-admin";
import {
  type PlanTier,
  type PlanLimits,
  PLANS,
  getPlanLimits,
  canHideFromGallery,
  enforceGalleryVisibility,
} from "@/lib/plans";
import { getEffectivePlanTier, isOwnerEmail } from "@/lib/owner-access";

export type { PlanTier, PlanLimits };
export { PLANS, getPlanLimits, canHideFromGallery, enforceGalleryVisibility };

async function resolveUserEmail(
  userId: string,
  email?: string | null
): Promise<string | null> {
  if (email !== undefined) return email;
  const admin = createAdminClient();
  const { data } = await admin.auth.admin.getUserById(userId);
  return data.user?.email ?? null;
}

function applyOwnerTier(
  email: string | null | undefined,
  rawTier: PlanTier
): PlanTier {
  return getEffectivePlanTier(email, rawTier);
}

/**
 * Fetch the user's subscription row from the database.
 * Falls back to a "free" default if no row exists.
 * Owner emails always receive enterprise tier regardless of DB state.
 */
export async function getUserSubscription(
  userId: string,
  email?: string | null
) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  const resolvedEmail = await resolveUserEmail(userId, email);
  const rawTier: PlanTier = data?.plan_tier ?? "free";
  const plan_tier = applyOwnerTier(resolvedEmail, rawTier);

  if (!data) {
    return {
      plan_tier,
      status: "active",
      stripe_customer_id: null as string | null,
      stripe_subscription_id: null as string | null,
      current_period_start: null as string | null,
      current_period_end: null as string | null,
      cancel_at_period_end: false,
    };
  }

  return {
    ...(data as {
      plan_tier: PlanTier;
      status: string;
      stripe_customer_id: string | null;
      stripe_subscription_id: string | null;
      current_period_start: string | null;
      current_period_end: string | null;
      cancel_at_period_end: boolean;
    }),
    plan_tier,
    status: isOwnerEmail(resolvedEmail) ? "active" : data.status,
  };
}

/**
 * Check whether the user can create another portal under their current plan.
 * Returns an object with `allowed` and `reason` if denied.
 */
export async function checkPortalLimit(
  userId: string,
  email?: string | null
) {
  const admin = createAdminClient();

  const [subResult, countResult, resolvedEmail] = await Promise.all([
    admin.from("subscriptions").select("plan_tier").eq("user_id", userId).maybeSingle(),
    admin
      .from("portals")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", userId),
    resolveUserEmail(userId, email),
  ]);

  const rawTier: PlanTier = subResult.data?.plan_tier ?? "free";
  const tier = applyOwnerTier(resolvedEmail, rawTier);
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
export async function checkScanLimit(
  userId: string,
  month: string,
  email?: string | null
) {
  const admin = createAdminClient();

  const [subResult, usageResult, resolvedEmail] = await Promise.all([
    admin.from("subscriptions").select("plan_tier").eq("user_id", userId).maybeSingle(),
    admin
      .from("subscription_usage")
      .select("scan_count")
      .eq("user_id", userId)
      .eq("month", month)
      .maybeSingle(),
    resolveUserEmail(userId, email),
  ]);

  const rawTier: PlanTier = subResult.data?.plan_tier ?? "free";
  const tier = applyOwnerTier(resolvedEmail, rawTier);
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
