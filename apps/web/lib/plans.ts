/** Client-safe plan tiers & limits (no server-only imports). */

export type PlanTier = "free" | "indie" | "pro" | "enterprise";

export interface PlanLimits {
  maxPortals: number;
  maxScansPerMonth: number;
  maxTeamSeats: number;
}

export const PLANS: Record<PlanTier, PlanLimits> = {
  free: { maxPortals: 3, maxScansPerMonth: 200, maxTeamSeats: 0 },
  indie: { maxPortals: 25, maxScansPerMonth: 5000, maxTeamSeats: 1 },
  pro: { maxPortals: 100, maxScansPerMonth: 50000, maxTeamSeats: 3 },
  enterprise: { maxPortals: 999999, maxScansPerMonth: 999999, maxTeamSeats: 999 },
};

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
