"use client";

import { createContext, useContext } from "react";
import type { PlanTier } from "./subscription";

export interface SubscriptionInfo {
  plan_tier: PlanTier;
  status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

export const SubscriptionContext = createContext<SubscriptionInfo | null>(null);

export function useSubscription() {
  return useContext(SubscriptionContext);
}
