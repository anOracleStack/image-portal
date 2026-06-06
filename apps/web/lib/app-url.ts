/**
 * Canonical public origin for links, metadata, Stripe return URLs, and exports.
 * Set NEXT_PUBLIC_APP_URL in Vercel (production: https://rub.pub).
 */
export function getAppUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  if (process.env.VERCEL_ENV === "production") {
    return PRODUCTION_APP_ORIGIN;
  }

  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelHost) return `https://${vercelHost}`;

  const port = process.env.PORT ?? "3004";
  return `http://localhost:${port}`;
}

/** Production host for docs and copy (env still wins at runtime). */
export const PRODUCTION_APP_ORIGIN = "https://rub.pub";
