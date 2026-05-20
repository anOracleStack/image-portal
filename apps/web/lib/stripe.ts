import "server-only";
import Stripe from "stripe";

export function stripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key, {
    apiVersion: "2026-04-22.dahlia",
    typescript: true,
  });
}

export function mapPriceIdToTier(priceId: string): string {
  if (priceId === process.env.STRIPE_PRICE_INDIE) return "indie";
  if (priceId === process.env.STRIPE_PRICE_PRO) return "pro";
  return "free";
}
