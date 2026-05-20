"use client";

import { SubscriptionContext, type SubscriptionInfo } from "@/lib/subscription-context";

export function SubscriptionProvider({
  subscription,
  children,
}: {
  subscription: SubscriptionInfo | null;
  children: React.ReactNode;
}) {
  return (
    <SubscriptionContext.Provider value={subscription}>
      {children}
    </SubscriptionContext.Provider>
  );
}
