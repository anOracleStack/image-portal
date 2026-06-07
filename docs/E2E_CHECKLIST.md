# End-to-end verification checklist

Use this after local setup or a production deploy to confirm the full creator → viewer loop.

**Production:** https://rub.pub · **Local:** http://localhost:3004  
**Supabase ref:** `duydupyyembdttmjvsxm`

---

## Pre-flight

- [ ] `pnpm check:env` passes (or all required vars set in Vercel)
- [ ] `pnpm --filter @ip/web build` succeeds
- [ ] `pnpm --filter @ip/web typecheck` succeeds

### Stale copy audit (2026-06-07)

Grep for removed product strings in `apps/web` & `packages`:

```bash
rg "choose how visitors scan|Enter a valid URL \(http/https\)" apps/web packages
```

**Result:** No matches — casual URL copy & image-only scan mode are in place.

---

## Landing & marketing

- [ ] `/` — hero: “Turn any **Image** into a **Doorway**”, subtitle “Next generation QR code”
- [ ] Hero CTAs: **GET STARTED FREE** & **SEE HOW IT WORKS** (uppercase, bold)
- [ ] Scan demo shows **Scan → Match → Open** strip with animated active step; live preview advances
- [ ] Use cases section centered; line breaks per voice memo 53
- [ ] “Why RQ Plus?” cards centered
- [ ] Pricing block centered with link to `/pricing`
- [ ] Sticky marketing nav; footer present
- [ ] Help chat (?) opens, answers a test question

---

## Auth

- [ ] `/login` — email sign-up & **Continue with Google** (Google requires §1b in USER_SETUP)
- [ ] Email confirmation lands on `/auth/callback` (if email provider enabled)
- [ ] Dashboard redirects unauthenticated users to `/login`

---

## Creator flow — create → upload → approve → export

### Create portal

1. [ ] Log in → Dashboard → **Create Portal**
2. [ ] Enter title (e.g. `Summer Launch`)
3. [ ] Enter casual destination `nike.com` (no `https://` required) → saves as `https://nike.com/`
4. [ ] Portal appears **inactive** in dashboard

### Workshop upload

5. [ ] Open portal detail → **Workshop your visual**
6. [ ] Upload JPEG/PNG/WebP (drag-drop, browse, or camera) — progress bar while uploading
7. [ ] Reference strip + before/after slider appear after upload
8. [ ] Enhanced preview generates (or clear error if enhancement fails; references retained)

### Workshop chat

9. [ ] Send chat message (e.g. “make it brighter”) — assistant replies
10. [ ] With `OPENAI_API_KEY`: creative/LLM + optional vision replies; without: rule-based adjustments still work

### Approve & export

11. [ ] Toggle “Use enhanced version” if desired
12. [ ] **Approve & go live** → portal status **active**
13. [ ] **Export image** downloads PNG suitable for print/screen
14. [ ] Portal slug URL `/p/{slug}` loads interstitial (if configured)

---

## First-run onboarding

- [ ] Dashboard shows 3-step wizard until **Got it** / **Finish** (sets `ip_onboarding_done` in localStorage)
- [ ] Steps link to Create portal, Dashboard, `/scan`

---

## Viewer flow — scan on phone

15. [ ] On phone browser, open `https://rub.pub/scan` (or local tunnel for dev)
16. [ ] Grant camera permission
17. [ ] Capture photo of exported/printed visual
18. [ ] Match result shows correct portal / destination domain
19. [ ] **Open link** navigates to destination URL

### PWA (optional)

20. [ ] Add to Home Screen → icon opens scan UI full-screen

---

## Dashboard polish

- [ ] Fixed header nav on dashboard routes
- [ ] Dashboard footer present
- [ ] Help chat available on dashboard pages

---

## Optional integrations

| Feature | Requires | Verify |
|---------|----------|--------|
| Google login | Google OAuth + Supabase provider | Sign in with Google |
| LLM chat | `OPENAI_API_KEY` | Workshop & help give non-template answers |
| Stripe billing | `STRIPE_*` keys | `/pricing` checkout (test mode) |
| Safe Browsing | `SAFE_BROWSING_API_KEY` | Malicious URL blocked on portal create |

---

## Production smoke (rub.pub)

- [ ] Hard refresh `/` & `/login` (incognito)
- [ ] Compare deployed commit to `main` (`git log -1` vs Vercel deployment)
- [ ] No QR/hybrid scan mode UI on create or portal detail

---

## Sign-off

| Role | Date | Notes |
|------|------|-------|
| Agent build | 2026-06-07 | Code complete; user keys & live browser pass pending |
| User | | |
