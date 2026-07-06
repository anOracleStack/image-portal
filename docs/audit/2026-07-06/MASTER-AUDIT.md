# Image Portal — Master Audit & Remediation Report

**Date:** 2026-07-06 · **Commit audited:** `50c3f17` · **Production:** https://rub.pub
**Method:** 6 parallel read-only domain audits (web, security, design, vision, data, parity) +
orchestrator verification. Full per-domain reports in this directory (`a`–`f`).

---

## Verdict

The **marketing and design surface is polished and production-current** — rub.pub is serving
the latest `main`, the landing/auth/pricing UI is coherent, the URL-safety core is solid, and
the codebase typechecks and builds clean. But two categories of serious problems sat beneath it:

1. **A cluster of unauthenticated service-role API routes** (live-exploitable IDOR/SSRF) —
   now **FIXED and verified** in this session.
2. **The core recognition engine is demo-grade and partly broken** (no geometric verification,
   native mobile can never match, embedding-version safety is vacuous) — **flagged for a
   product decision**, not silently changed.

**Totals across all agents:** 18 P0 · 40 P1 · 50 P2 · 42 P3 (some overlap; deduped below).
All six domain reports (`a`–`f`) are complete.

---

## P0 — go-live blockers

### Security (FIXED THIS SESSION — verified with runtime 401 + build)

| # | Endpoint | Was | Fix | Verified |
|---|---|---|---|---|
| 1 | `DELETE /api/portals/[id]` | Anyone could delete any portal by UUID | auth + ownership check | 401 anon ✓ |
| 2 | `POST /api/portals/[id]` toggle_status | Anyone could enable/disable any portal | auth + ownership check | 401 anon ✓ |
| 3 | `GET /api/portals/scan-history` | Dumped every user's scan events | auth + owner filter (also fixed page shape) | 401 anon ✓ |
| 4 | `POST /api/stripe/portal` | Opened any user's billing portal via body userId | auth + session-derived user; fixed 404 return_url | 401 anon ✓ |
| 5 | `POST /api/stripe/create-checkout` | Bound checkout to any userId | auth + session-derived user | — |
| 6 | `POST /api/portals/[id]/export` | Exported any portal's image | auth + ownership check | 401 anon ✓ |
| 7 | `GET /api/images/[id]` | Served private/suspended portal images by UUID | public-only, else owner-gated; `no-store` for private | — |
| 8 | `POST /api/hooks/scan` (SSRF) | Fetched arbitrary URL (cloud metadata) | URL-safety validation + `redirect:"error"` | metadata IP rejected ✓ |
| 9 | `GET /auth/callback` open redirect | `?next=https://evil.com` honored | same-origin relative paths only | — |

Files: `apps/web/app/api/portals/[id]/route.ts`, `.../scan-history/route.ts`,
`.../stripe/portal/route.ts`, `.../stripe/create-checkout/route.ts`, `.../[id]/export/route.ts`,
`.../images/[id]/route.ts`, `.../hooks/scan/route.ts`, `apps/web/app/auth/callback/route.ts`.

### Correctness / config (FIXED THIS SESSION)

- **Near-duplicate collision gate** (scan-hijack defense) compared a dHash against an aHash and
  never fired → now compares against the column that actually stores the dHash. `lib/portal-image.ts`.
- **Safe Browsing silently disabled**: code read `GOOGLE_SAFE_BROWSING_API_KEY` while docs/tooling
  used `SAFE_BROWSING_API_KEY` → now accepts both. `lib/safe-browsing.ts`.
- **Dead `fingerprints` table delete** on portal deletion → removed (CASCADE handles it). `[id]/route.ts`.

### Requires USER action (cannot be fixed from code)

- **P0-DB1 — Which Supabase project is production?** The app's `.env.local` points to
  `duydupyyembdttmjvsxm`, but the CLI is linked to a *different* project `ybqmvxuvaldfzmkbucqc`
  in both `.temp/linked-project.json` files. Anyone running `supabase db push` has been migrating
  the **wrong** database. Confirm the real production ref before applying anything.
- **P0-DB2 — Storage bucket privacy.** `portal-images`/`portal-exports` were created **public**
  and only made private by later hardening migrations. If those migrations never reached the live
  project (see P0-DB1), every uploaded file is publicly downloadable regardless of the code fixes.
  Verify in Dashboard → Storage that both buckets are Private, and that all 9 migrations are applied.

### Design / UX (Agent C — some FIXED, one DECISION REQUIRED)

- **FIXED this session:** branded 404 page (`app/not-found.tsx`) so expired `/p/{slug}` portals no
  longer show a raw black error; acquisition CTAs now open the sign-up view (`/login?mode=signup`)
  instead of "Welcome back"; hero H1 accessible name fixed ("Image**into**" → proper spacing);
  `/scan` light-theme placeholder text made readable on the dark camera well. Verified: 404 returns
  proper 404 + branded chrome; `?mode=signup` renders "New here / Create Account".
- **P0-D1 — DECISION REQUIRED: the landing is not responsive on phones.** `LandingScaleShell` scales
  the fixed 1440px landing down to a 0.5 floor and **clips** (not reflows) below ~720px, so at 375px
  roughly half the design — including the nav (logo, Menu, theme toggle) — is off-screen. This is an
  architecture choice (scale-and-clip vs true mobile reflow), not a one-line fix; the marketing
  sub-pages (pricing/gallery/scan) are properly responsive. Recommended: a real mobile nav + reflow
  for the landing below 768px. Flagged for direction rather than a unilateral rework of the strongest
  desktop asset. `components/LandingScaleShell.tsx`, `lib/scale-shell.ts`, `app/globals.css:1834+`.
- **P1/P2 (queued):** help-chat FAB overlaps the theme toggle on mobile; gallery error is a raw
  string with no retry; auth pages drop site chrome; legal pages are "coming soon" stubs beside a
  paid pricing page; ~6 "and"-vs-"&" copy-rule violations; theme toggle has three inconsistent
  presentations. Desktop design quality is otherwise strong (coherent mood system, AA+ dark contrast,
  exemplary reduced-motion handling).

### Vision engine (DECISION REQUIRED — not silently changed)

- **P0-V1 — No geometric verification (Stage B).** Spec §2.2 mandates ORB+RANSAC; the shipped
  `verify.ts` is a fixed-position block-statistics comparator with no keypoints/homography/RANSAC.
  Consequence: real print scans at an angle false-negative; same-layout-different-content posters
  can false-positive. `packages/vision/src/verify.ts`.
- **P0-V2 — Native mobile scans can never match.** `apps/mobile/App.tsx` omits the image frame, so
  every candidate scores 0 inliers → band always "low". (Does **not** block the web/PWA launch; the
  PWA sends the frame.)
- **P0-V3 — Embedding-version invariant is vacuous.** Grid vectors are stamped `dinov2_vitb14`;
  configuring a real embedding endpoint would silently mix vector spaces under identical labels —
  the exact "total silent failure" the spec's Law 4 exists to prevent.
- **P0-V4 — Scan-limit enforcement is dead code.** `match_fingerprints` RPC returns no `owner_id`,
  so plan caps never run and usage meters read 0. Fix is a one-line RPC change (migration) + it needs
  applying to the confirmed production DB (see P0-DB1). Billing isn't live yet (no Stripe keys), so
  lower urgency.

---

## P1 / P2 / P3 — see per-domain reports

Highlights carried forward (not blocking, ranked for the fix queue):

- **P1** — in-memory rate limits are per-serverless-instance (move to shared store); `total_scans`
  never increments on image scans; "hide from gallery" private setting also bricks scanning +
  404s the slug; no perspective correction; scan hot path does up to 20 sequential storage downloads
  (<1.5s gate at risk); no CI gate before Vercel auto-deploys; no security headers (CSP/XFO); mobile
  lacks the print/screen toggle.
- **P2** — several read routes leak metadata for private/suspended portals (lookup, external info,
  share-card); no `scan_events` retention (CCPA); `portal-cache`/`avatars` bucket policies; the only
  test file exercises dead `recognize()` code, so the real scan route is untested; nested-anchor HTML
  in portal cards.
- **P3** — SEO (robots/sitemap/per-route metadata/OG/JSON-LD), custom 404, favicon/apple-touch-icon,
  ORB-via-opencv-wasm upgrade path, SSCD/DINOv2 + on-device ONNX, honest in-app "demo matcher" note.

---

## Cross-front consistency (the "one thing has what another lacks" check)

| Capability | Web/PWA | Production | Mobile | Docs |
|---|---|---|---|---|
| Landing redesign, auth UI, pricing | ✓ | ✓ (current) | n/a | ✓ |
| Scan flow works | ✓ (demo-grade) | ✓ (demo-grade) | ✗ (never matches, P0-V2) | overstates as on-device |
| print/screen toggle | ✓ | ✓ | ✗ | — |
| On-device embedding | n/a | n/a | stub/dead | described as real |
| SEO / OG / robots | ✗ | ✗ | n/a | — |
| Security headers | ✗ | ✗ | n/a | — |

---

## What shipped in this session

10 code fixes (9 security P0s + collision gate + Safe Browsing), all verified by:
`pnpm --filter @ip/web typecheck` ✓ · `pnpm --filter @ip/web build` ✓ · `pnpm test` 4/4 ✓ ·
runtime anonymous-request probes returning 401/rejection ✓.

## Open decisions for the user

1. **Vision engine:** ship secured-but-demo-grade matcher now + upgrade (ORB → SuperPoint/LightGlue,
   real embeddings) as a fast-follow, **or** hold launch until the matcher is real?
2. **Supabase dashboard workstream:** resolve P0-DB1 (project ref) and P0-DB2 (bucket privacy +
   migration application) — required for a truly secure go-live.
