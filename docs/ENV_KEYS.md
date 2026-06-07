# Environment variables — Image Portal

All variables for `apps/web`. Copy [`apps/web/.env.example`](../apps/web/.env.example) to `apps/web/.env.local` for local dev. Add the same keys in **Vercel → Settings → Environment Variables** for production.

Run `pnpm check:env` from the repo root to see what is set (no secret values printed).

---

## Required

| Variable | Purpose | Where to get it | Placeholder format |
|----------|---------|-----------------|-------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project API URL | [Supabase Dashboard](https://supabase.com/dashboard) → project `duydupyyembdttmjvsxm` → **Settings → API → Project URL** | `https://duydupyyembdttmjvsxm.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client-side Supabase auth & RLS queries | Same page → **anon public** | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin (uploads, webhooks, workshop storage) | Same page → **service_role** (never expose to browser or mobile) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `NEXT_PUBLIC_APP_URL` | Canonical app origin (auth redirects, share links) | Local: `http://localhost:3004` · Production: `https://rub.pub` | URL with no trailing slash |

---

## Matching engine

| Variable | Required? | Purpose | Where to get it |
|----------|-----------|---------|-----------------|
| `CATALOG_EMBED_PROVIDER` | Recommended | `grid` = built-in demo matcher; `warm-endpoint` = production ML | Set `grid` for MVP |
| `CATALOG_EMBED_ENDPOINT` | If using warm-endpoint | HTTP URL that accepts image bytes, returns `{ "embedding": number[768] }` | Your embed service |
| `CATALOG_EMBED_API_KEY` | If embed service needs auth | Bearer or API key for embed endpoint | Your embed service |
| `EMBED_MODEL_ID` | Optional | Pinned model id (default `dinov2_vitb14`) | — |
| `EMBED_VERSION` | Optional | Embedding version integer (default `1`) | — |

Without a warm endpoint, set `CATALOG_EMBED_PROVIDER=grid` — uploads & scans work for demos but are not production-scale ML.

---

## AI chat (optional)

| Variable | Required? | Purpose | Where to get it |
|----------|-----------|---------|-----------------|
| `OPENAI_API_KEY` | Optional | Powers Help chat & Portal Workshop chat via OpenAI | [OpenAI API keys](https://platform.openai.com/api-keys) |
| `OPENAI_MODEL` | Optional | Model id (default `gpt-4o-mini`; supports vision for workshop) | — |

When unset, both chats use built-in rule-based fallbacks (no errors).

**Workshop vision:** When `OPENAI_API_KEY` is set, workshop chat sends the primary reference image (base64, server-side) to OpenAI for creative feedback. No extra env vars required. Help chat remains text-only.

---

## Billing (optional)

| Variable | Required? | Purpose | Where to get it |
|----------|-----------|---------|-----------------|
| `STRIPE_SECRET_KEY` | For paid plans | Server Stripe API | [Stripe Dashboard → API keys](https://dashboard.stripe.com/apikeys) |
| `STRIPE_WEBHOOK_SECRET` | For subscriptions | Verifies `/api/stripe/webhook` | Stripe → Webhooks → signing secret |
| `STRIPE_PRICE_INDIE` | For Indie tier | Price id (`price_...`) | Stripe → Products |
| `STRIPE_PRICE_PRO` | For Pro/Studio tier | Price id (`price_...`) | Stripe → Products |

Without Stripe keys, checkout & billing UI degrade gracefully (free tier only).

---

## Safety & limits (optional)

| Variable | Required? | Purpose | Where to get it |
|----------|-----------|---------|-----------------|
| `SAFE_BROWSING_API_KEY` | Optional | Google Safe Browsing for destination URL checks | [Google Cloud Console](https://console.cloud.google.com/) → Safe Browsing API |
| `MAX_IMAGE_UPLOAD_MB` | Optional | Upload size cap (default `10`) | — |
| `PORT` | Local only | Dev server port (default `3004` in `package.json`) | — |

---

## Mobile app (`apps/mobile/.env`)

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_API_URL` | API base, e.g. `https://rub.pub` |

---

## Security notes

- Never commit `.env.local` or real keys.
- `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_*`, `OPENAI_API_KEY`, and `CATALOG_EMBED_API_KEY` are **server-only**.
- Only `NEXT_PUBLIC_*` variables are exposed to the browser bundle.
