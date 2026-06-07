"use client";

import { useEffect, useState } from "react";
import { createBrowserClient_ } from "@/lib/supabase-browser";
import type { PlanTier } from "@/lib/plans";
import { getEffectivePlanTier } from "@/lib/owner-access";

/** Loads the signed-in user's subscription tier (defaults to free). */
export function usePlanTier(): PlanTier {
  const [tier, setTier] = useState<PlanTier>("free");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const supabase = createBrowserClient_();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const { data } = await supabase
        .from("subscriptions")
        .select("plan_tier")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!cancelled) {
        const raw = (data?.plan_tier as PlanTier) ?? "free";
        setTier(getEffectivePlanTier(user.email, raw));
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return tier;
}
