/** Client-safe owner allowlist for full enterprise access without billing. */

import type { PlanTier } from "./plans";

export const OWNER_EMAILS = ["anoraclevision@gmail.com"] as const;

export function isOwnerEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return OWNER_EMAILS.some((owner) => owner.toLowerCase() === normalized);
}

/** Owner emails always resolve to enterprise tier limits & features. */
export function getEffectivePlanTier(
  email: string | null | undefined,
  actualTier: PlanTier
): PlanTier {
  return isOwnerEmail(email) ? "enterprise" : actualTier;
}
