"use client";

import { useEffect, useState } from "react";
import { createBrowserClient_ } from "@/lib/supabase-browser";
import type { PlanTier } from "@/lib/subscription";

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

      if (!cancelled) setTier((data?.plan_tier as PlanTier) ?? "free");
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return tier;
}
