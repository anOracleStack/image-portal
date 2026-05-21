#!/usr/bin/env bash
# Run after: vercel login, domain rub.pub purchased, DNS access.
# From repo root. Does not commit or deploy by itself.
set -euo pipefail

cd "$(dirname "$0")/.."
ORIGIN="https://rub.pub"
PROJECT="${VERCEL_PROJECT:-image-portal}"

echo "==> Vercel: set production app URL"
vercel env rm NEXT_PUBLIC_APP_URL production -y 2>/dev/null || true
printf '%s' "$ORIGIN" | vercel env add NEXT_PUBLIC_APP_URL production

echo "==> Vercel: add domains (follow prompts if CLI asks)"
vercel domains add rub.pub --project "$PROJECT" || true
vercel domains add www.rub.pub --project "$PROJECT" || true

echo ""
echo "Done (CLI). You still must:"
echo "  1. DNS at registrar — Vercel Domains tab shows exact records for rub.pub + www"
echo "  2. Supabase → Authentication → URL Configuration:"
echo "       Site URL: $ORIGIN"
echo "       Redirect URLs: $ORIGIN/auth/callback"
echo "                      http://localhost:3000/auth/callback"
echo "                      http://localhost:3004/auth/callback"
echo "  3. Stripe → Webhooks endpoint: $ORIGIN/api/stripe/webhook (if using Stripe)"
echo "  4. Redeploy production after env + domain propagate"
