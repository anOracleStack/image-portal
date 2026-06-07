# Deploy — Image Portal (rub.pub)

Production URL: **https://rub.pub**  
GitHub repo: **anOracleStack/image-portal**  
Vercel project root: **`apps/web`**

---

## Prerequisites

1. Complete [USER_SETUP.md](./USER_SETUP.md) — especially Supabase keys & `NEXT_PUBLIC_APP_URL=https://rub.pub`.
2. Confirm local build passes:

```bash
cd image-portal
pnpm install
pnpm --filter @ip/web build
pnpm --filter @ip/web typecheck
```

---

## Option A — GitHub auto-deploy (recommended)

1. **Link Vercel to GitHub**
   - [Vercel Dashboard](https://vercel.com) → Add Project → Import `anOracleStack/image-portal`.
   - **Root Directory:** `apps/web` (or use monorepo `vercel.json` at repo root — both are configured).

2. **Production branch**
   - Settings → Git → **Production Branch:** `main`.
   - Enable **Automatic deployments** for `main`.

3. **Environment variables**
   - Settings → Environment Variables.
   - Add all **required** keys from [ENV_KEYS.md](./ENV_KEYS.md) for **Production** (and Preview if you use PR previews).
   - Critical: `NEXT_PUBLIC_APP_URL=https://rub.pub`.

4. **Custom domain**
   - Settings → Domains → add `rub.pub` (and `www.rub.pub` if desired).
   - DNS: follow Vercel's records at your registrar.

5. **Verify deploy**
   - Push to `main` → Vercel builds automatically.
   - Check: `https://rub.pub/login`, `https://rub.pub/scan`.

`vercel.json` at repo root sets:

- `rootDirectory`: `apps/web`
- `buildCommand`: `cd ../.. && pnpm --filter @ip/web build`
- `installCommand`: `cd ../.. && pnpm install`

---

## Option B — Manual CLI deploy

Requires [Vercel CLI](https://vercel.com/docs/cli) logged in (`vercel login`).

```bash
cd image-portal
vercel link          # once, select image-portal project
vercel env pull      # optional: sync production env to .env.local
vercel deploy --prod
```

After deploy, confirm the production alias points to **rub.pub**.

---

## Supabase auth URLs (production)

Run after domain is live (requires [Supabase access token](https://supabase.com/dashboard/account/tokens)):

```bash
export SUPABASE_ACCESS_TOKEN="sbp_..."
export SUPABASE_PROJECT_REF="duydupyyembdttmjvsxm"
bash scripts/supabase-auth-rub-pub.sh
```

Or configure manually in Supabase → **Authentication → URL Configuration**:

- **Site URL:** `https://rub.pub`
- **Redirect URLs:** `https://rub.pub/auth/callback`, `http://localhost:3004/auth/callback`

---

## Post-deploy checklist

See [E2E_CHECKLIST.md](./E2E_CHECKLIST.md) for creator & viewer flows.

Quick smoke:

- [ ] `https://rub.pub/` loads landing with Help chat
- [ ] `https://rub.pub/login` shows Google + email sign-in
- [ ] `https://rub.pub/scan` requests camera (HTTPS)
- [ ] Dashboard create → workshop → approve works when logged in

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Old UI on rub.pub | Redeploy production from latest `main`; hard refresh |
| Google login redirect error | Check Supabase redirect URLs & Google OAuth client URIs |
| Upload fails | Verify `SUPABASE_SERVICE_ROLE_KEY` on Vercel; storage buckets exist |
| Scans never match | Set `CATALOG_EMBED_PROVIDER=grid` or configure warm embed endpoint |
| Workshop/help chat generic only | Add `OPENAI_API_KEY` on Vercel (optional) |
