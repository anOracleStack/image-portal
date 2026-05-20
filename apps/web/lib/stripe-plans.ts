export const STRIPE_PRICE_IDS: Record<string, string> = {
  indie: process.env.STRIPE_PRICE_INDIE ?? "",
  pro: process.env.STRIPE_PRICE_PRO ?? "",
};

export function mapPriceIdToTier(priceId: string): string {
  const map: Record<string, string> = {};
  for (const [tier, pid] of Object.entries(STRIPE_PRICE_IDS)) {
    if (pid) map[pid] = tier;
  }
  return map[priceId] ?? "free";
}
