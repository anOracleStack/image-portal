# Image Portal — what you must do (manual setup)

The codebase can run end-to-end once these steps are done. Do them in order while agents ship code.

---

## 1. Supabase (database & auth)

**Why:** Portals, images, fingerprints, and auth live in Supabase.

**Where:** [https://supabase.com/dashboard](https://supabase.com/dashboard) → project `ybqmvxuvaldfzmkbucqc`

### 1a. Environment variables (local + Vercel)

Copy `apps/web/.env.example` → `apps/web/.env.local` and fill:

| Variable | Where to get it |
|----------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role (**server only, never commit**) |

**Vercel:** Project → Settings → Environment Variables → add the same for **Production** (and Preview if you use it).

### 1b. Google sign-in (optional but recommended)

**Why:** Login page expects “Continue with Google.”

**Where:** Supabase → Authentication → Providers → Google

1. Create OAuth client in [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Authorized redirect URI: `https://rub.pub/auth/callback` (and `http://localhost:3000/auth/callback` for dev).
3. Paste Client ID + Secret into Supabase Google provider → Enable.
4. Supabase → Authentication → URL configuration → Site URL: `https://rub.pub`, Redirect URLs include `/auth/callback`.

If the Google app is in **Testing** mode, add your email under Test users.

---

## 2. Embedding provider (matching engine)

**Why:** Upload and scan must use the **same** embedding model or matches fail.

### Option A — MVP / demo (no ML API, works immediately)

In Vercel and `.env.local`:

```
CATALOG_EMBED_PROVIDER=grid
```

Uses a built-in 768-dim grid fingerprint. Good for demos and first E2E tests. Upgrade before serious scale.

### Option B — Production ML (recommended later)

Set a warm HTTP endpoint that accepts raw image bytes and returns `{ "embedding": number[768] }`:

```
CATALOG_EMBED_ENDPOINT=https://your-embed-service/embed
CATALOG_EMBED_API_KEY=your-secret
EMBED_MODEL_ID=dinov2_vitb14
```

Same model must be used for catalog upload and `/api/embed/query`.

---

## 3. Deploy web app to rub.pub

**Why:** Viewers use `https://rub.pub/scan` in the browser (no App Store).

**Where:** Vercel dashboard linked to `anOracleStack/image-portal`, root `apps/web`

1. Ensure env vars from §1–2 are set on **Production**.
2. Set `NEXT_PUBLIC_APP_URL=https://rub.pub`
3. Deploy latest `main` (or push to trigger auto-deploy).

Verify:

- `https://rub.pub/login` loads
- `https://rub.pub/scan` opens camera (HTTPS required)

---

## 4. Creator flow test (you)

1. Sign up / log in at `https://rub.pub/login`
2. Dashboard → **Create portal** → enter title + destination URL  
   → Portal starts **inactive**
3. Open the portal → **Upload or capture photo**
4. Review **Reference vs Enhanced** → **Approve & go live**
5. **Export image** (dashboard) → download file for print/screen

---

## 5. Viewer flow test (you)

1. On a phone, open **`https://rub.pub/scan`** in Safari or Chrome (not the stock Camera app).
2. Allow camera → **Capture photo** aimed at your printed/exported visual.
3. Expect **Link found** → **Open link →**

Optional: Safari → Share → **Add to Home Screen** so the scanner is one tap.

---

## 6. Stock iPhone/Android Camera app

**You cannot** make the default Camera app query Image Portal without:

- OS partnership, or
- A machine-readable layer in the export (QR, App Clip code, subtle URL text for Live Text), or
- V3 invisible watermark + OS support (not built).

**Honest viewer path today:** `rub.pub/scan` in the mobile browser.

---

## 7. Mobile Expo app (optional)

**Why:** Native app for creators/viewers who install from App Store later.

**Where:** `apps/mobile/.env`

```
EXPO_PUBLIC_API_URL=https://rub.pub
```

Run `pnpm --filter @ip/mobile start` for dev. EAS build is separate; not required for MVP if PWA scan works.

---

## 8. Stripe / Safe Browsing (optional)

Only needed for paid plans and URL safety in production:

- `STRIPE_*` from Stripe Dashboard
- `SAFE_BROWSING_API_KEY` from Google Cloud (Safe Browsing API)

---

## Quick checklist

- [ ] Supabase URL + anon + service role in Vercel Production
- [ ] `NEXT_PUBLIC_APP_URL=https://rub.pub`
- [ ] `CATALOG_EMBED_PROVIDER=grid` (or warm embed endpoint)
- [ ] Google OAuth enabled (if using Google login)
- [ ] Production deploy succeeded
- [ ] Creator: create → capture → approve → export
- [ ] Viewer: `rub.pub/scan` → match → open link

When all boxes are checked, the product matches the intended creator + viewer loop (browser scanner, no App Store for viewers).
