# Image Portal — what you must do (manual setup)

The codebase runs end-to-end once you add secrets below. Agents have wired everything else with placeholders & graceful fallbacks.

**Production:** https://rub.pub  
**Supabase project ref:** `duydupyyembdttmjvsxm`  
**Local dev port:** `3004`

---

## Quick start (keys only)

1. Copy `apps/web/.env.example` → `apps/web/.env.local`
2. Fill **required** keys (see [ENV_KEYS.md](./ENV_KEYS.md))
3. Run `pnpm check:env` — fix any missing required vars
4. `pnpm --filter @ip/web dev` → open http://localhost:3004
5. For production: add the same keys in Vercel → deploy (see [DEPLOY.md](./DEPLOY.md))

---

## 1. Supabase (database & auth)

**Why:** Portals, images, fingerprints, & auth live in Supabase.

**Where:** [Supabase Dashboard](https://supabase.com/dashboard/project/duydupyyembdttmjvsxm)

### 1a. API keys

| Variable | Dashboard path |
|----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | **Settings → API → Project URL** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Settings → API → anon public** |
| `SUPABASE_SERVICE_ROLE_KEY` | **Settings → API → service_role** (server only — never commit) |

Add the same three to **Vercel → Settings → Environment Variables → Production**.

### 1b. Google sign-in (optional but recommended)

**Why:** Login page offers “Continue with Google.”

#### Step 1 — Google Cloud OAuth client (you must do this)

1. Open [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials).
2. **Create OAuth client ID** → Application type: **Web application**.
3. **Authorized JavaScript origins:**
   - `https://rub.pub`
   - `http://localhost:3004`
4. **Authorized redirect URIs:**
   - `https://duydupyyembdttmjvsxm.supabase.co/auth/v1/callback` (Supabase handles OAuth callback)
5. Copy **Client ID** & **Client secret**.

#### Step 2 — Supabase Google provider

1. Supabase → **Authentication → Providers → Google**.
2. Paste Client ID & secret → **Enable**.
3. If the Google app is in **Testing** mode, add your email under **Test users** (or publish the app).

#### Step 3 — URL configuration

**Option A — script (needs Supabase personal access token):**

```bash
export SUPABASE_ACCESS_TOKEN="sbp_..."   # https://supabase.com/dashboard/account/tokens
export SUPABASE_PROJECT_REF="duydupyyembdttmjvsxm"
bash scripts/supabase-auth-rub-pub.sh
```

**Option B — manual clicks:**

1. Supabase → **Authentication → URL Configuration**
2. **Site URL:** `https://rub.pub` (use `http://localhost:3004` only for local-only testing)
3. **Redirect URLs** — add each on its own line:
   - `https://rub.pub/auth/callback`
   - `http://localhost:3004/auth/callback`
   - `http://127.0.0.1:3004/auth/callback`

---

## 2. Embedding provider (matching engine)

**Why:** Upload & scan must use the **same** embedding model or matches fail.

### Option A — MVP / demo (works immediately)

```
CATALOG_EMBED_PROVIDER=grid
```

Built-in 768-dim grid fingerprint. Good for demos & first E2E tests.

### Option B — Production ML (later)

```
CATALOG_EMBED_PROVIDER=warm-endpoint
CATALOG_EMBED_ENDPOINT=https://your-embed-service/embed
CATALOG_EMBED_API_KEY=your-secret
EMBED_MODEL_ID=dinov2_vitb14
```

---

## 3. OpenAI (optional — smarter chat)

**Why:** Help chat & Portal Workshop chat use GPT when this key is set; otherwise rule-based FAQ.

```
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini   # optional
```

Get keys at [platform.openai.com/api-keys](https://platform.openai.com/api-keys). Add to Vercel Production if you want LLM chat on rub.pub.

---

## 4. Deploy web app to rub.pub

See [DEPLOY.md](./DEPLOY.md) for Vercel GitHub integration or CLI.

Minimum production env:

- All Supabase keys from §1a
- `NEXT_PUBLIC_APP_URL=https://rub.pub`
- `CATALOG_EMBED_PROVIDER=grid` (or warm endpoint)

Verify:

- `https://rub.pub/login` loads
- `https://rub.pub/scan` opens camera (HTTPS required)

---

## 5. Creator flow test (you)

1. Sign up / log in at `https://rub.pub/login`
2. Dashboard → **Create portal** → title + destination (e.g. `nike.com`)
3. Open portal → **Workshop your visual** → upload reference image(s)
4. Review reference vs enhanced → chat adjustments optional → **Approve & go live**
5. **Export image** → download for print/screen

Full steps: [E2E_CHECKLIST.md](./E2E_CHECKLIST.md)

---

## 6. Viewer flow test (you)

1. On a phone, open **`https://rub.pub/scan`** in Safari or Chrome
2. Allow camera → capture your printed/exported visual
3. Expect **Link found** → **Open link**

Optional: Safari → Share → **Add to Home Screen** for a one-tap scanner PWA.

---

## 7. Stripe / Safe Browsing (optional)

Only for paid plans & production URL safety:

- `STRIPE_*` from [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
- `SAFE_BROWSING_API_KEY` from Google Cloud Safe Browsing API

See [ENV_KEYS.md](./ENV_KEYS.md).

---

## 8. Mobile Expo app (optional)

`apps/mobile/.env`:

```
EXPO_PUBLIC_API_URL=https://rub.pub
```

Run `pnpm --filter @ip/mobile start`. EAS build is separate; not required if PWA scan works.

---

## Checklist

- [ ] Supabase URL + anon + service role in `.env.local` & Vercel Production
- [ ] `NEXT_PUBLIC_APP_URL` correct per environment
- [ ] `CATALOG_EMBED_PROVIDER=grid` (or warm embed endpoint)
- [ ] Google OAuth enabled in Supabase (if using Google login)
- [ ] `OPENAI_API_KEY` added (optional, for LLM chat)
- [ ] Production deploy succeeded
- [ ] Creator: create → workshop → approve → export
- [ ] Viewer: `rub.pub/scan` → match → open link
