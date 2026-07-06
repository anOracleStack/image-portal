# Audit F — Parity & Ops Findings

**Scope:** production parity, PWA, mobile parity, docs drift, ops config.
**Commit verified:** `50c3f17` (local `main` == `origin/main`).
**Production:** https://rub.pub (Vercel, root `apps/web`).
**Method:** `curl` against production + local dev server (`127.0.0.1:3004`), direct source reads.

## Summary

**Production parity verdict: PRODUCTION IS CURRENT.** rub.pub is serving the cinema-hero
redesign from commit `50c3f17` — verified hero markup (`Turn any Image / into a Doorway`,
`NEXT GENERATION QR CODE` subtitle), pricing copy, nav, footer links, and `Continue with
Google` on `/login` all match local source exactly. No stale-deploy risk found (T-001/T-002
in PROJECT-TASKS.md are correctly marked done).

The real risk surface is elsewhere: (1) the mobile app's on-device embedding design
(described in root README and `lib/embedding.ts`) is dead code — the shipped `App.tsx`
silently takes a different, working path (server-side embedding) instead, so docs and code
disagree about how the app actually works; (2) an env var name mismatch
(`GOOGLE_SAFE_BROWSING_API_KEY` vs documented `SAFE_BROWSING_API_KEY`) is wrong in the code,
docs, AND the `check:env` tool simultaneously, so the tooling can't catch it; (3) zero SEO
differentiation across routes (every page shares one title/description, no OG image, no
structured data) and no security headers beyond Vercel's default HSTS; (4) no CI/CD gate at
all before Vercel auto-deploys from `main`.

## Parity matrix

| Capability | Web (local) | Production | PWA | Mobile (Expo) | Docs |
|---|---|---|---|---|---|
| Cinema hero / landing redesign | present | present | present (same bundle) | n/a | present (E2E_CHECKLIST matches) |
| `Continue with Google` on /login | present | present | present | n/a | present (PROJECT-TASKS T-002) |
| Scan flow (camera → embed → match) | present | present | present (installable) | present (functional, different path) | partial (see P1-1) |
| Source type toggle (print/screen) | present | present | present | **absent** (hardcoded `"print"`) | absent |
| On-device embedding | absent (n/a to web) | n/a | n/a | **stubbed/unused, throws** | described as intentional (README) but code bypasses it entirely |
| PWA manifest + icons | present | present | present | n/a | present |
| Service worker / offline | **absent** | **absent** | **absent** | n/a | not claimed |
| iOS install meta tags | partial (capable+title only) | partial | partial | n/a | not documented |
| Per-route SEO metadata | absent | absent | n/a | n/a | not documented |
| OG image | absent | absent | n/a | n/a | not documented |
| Structured data (JSON-LD) | absent | absent | n/a | n/a | not documented |
| robots.txt / sitemap.xml | absent (404) | absent (404) | n/a | n/a | not documented |
| Custom 404/500 page | absent (Next default) | absent (Next default) | n/a | n/a | not documented |
| Security headers (CSP/XFO/etc.) | absent | absent (only HSTS via Vercel) | n/a | n/a | not documented |
| CI/CD gate (typecheck/test before deploy) | absent | absent | n/a | n/a | not documented |
| `favicon.ico` | absent | 404 | n/a | n/a | not documented |

## Findings

### P0 — none found in production parity

Production content, routing, auth UI, and pricing all match `main` at `50c3f17`. No stale
deploy, no missing feature that main has and prod doesn't, and no route returning wrong or
broken content.

### P1 — parity/ops defects

**P1-1. Mobile "on-device embedding" is dead code; actual mobile scan path silently diverges from documented architecture.**
Evidence: `apps/mobile/lib/embedding.ts` defines `getEmbedder()` / `UnconfiguredEmbedder`
that throws `"On-device model ... not bundled ... see docs/MANUAL.md TASK 10"`. Grep across
`apps/mobile` shows `getEmbedder` is referenced only in its own definition — `App.tsx` never
imports or calls it. Instead `App.tsx` (lines ~45-56) POSTs the raw JPEG as multipart form
data straight to `POST /api/embed/query` (server-side embedding, same as web). Root
`README.md` line 20-21 and line 37-39 both describe mobile as doing "on-device embedding"
pending a model bundle — that description does not match what ships today; the app actually
works via a fully server-side path that was added later (per PROJECT-TASKS.md "2026-06-09
PWA ship-today" entry adding `/api/embed/query`) and nobody updated the mobile description or
removed the stub.
Consequence: anyone reading README/MANUAL.md to understand the mobile app's status will
believe it's blocked pending a native model bundle, when it in fact already works
end-to-end today (assuming `EXPO_PUBLIC_API_URL` is reachable). Conversely, `embedding.ts` is
unreachable code that could be deleted or should be wired in and documented as the future
path.

**P1-2. Mobile lacks the print/screen source-type toggle that web has.**
Evidence: `apps/web/app/scan/page.tsx` line 25 has `sourceType` state with a print/screen
toggle UI (lines 287-305) sent as `sourceType` in the `/api/scan` POST body. `apps/mobile/App.tsx`
hardcodes `sourceType: "print"` (line ~72) with no UI to change it.
Consequence: mobile users scanning a screen (not a printed image) get worse match-confidence
banding (`decideBand` in `packages/shared` weights source type), with no way to correct it.

**P1-3. `GOOGLE_SAFE_BROWSING_API_KEY` / `SAFE_BROWSING_API_KEY` name mismatch across code, docs, and tooling.**
Evidence: `apps/web/lib/safe-browsing.ts` line 8 reads `process.env.GOOGLE_SAFE_BROWSING_API_KEY`.
`docs/ENV_KEYS.md` line 64 and `apps/web/.env.example` line ~28 both document
`SAFE_BROWSING_API_KEY` (no `GOOGLE_` prefix). `scripts/check-env.mjs` line 34 also checks
`SAFE_BROWSING_API_KEY`. All three docs/tooling surfaces agree with each other and
disagree with the actual code.
Consequence: a user who follows ENV_KEYS.md/USER_SETUP.md and sets `SAFE_BROWSING_API_KEY`
in Vercel will have URL-safety checks silently no-op (feature reads as "unset"), with
`pnpm check:env` reporting false-green. No error, just silent feature loss.

**P1-4. `docs/DEPLOY.md` and `docs/USER_SETUP.md` instruct `cd image-portal` from a starting point that is already the repo root.**
Evidence: `docs/DEPLOY.md` lines 15 and 59, `docs/USER_SETUP.md` line 60 all say
`cd image-portal` before running install/build/deploy commands. The actual repo root
directory is itself named `image-portal` (confirmed via `pwd` → `.../RQ/image-portal`); there
is no nested `image-portal/` subdirectory to `cd` into.
Consequence: following the doc verbatim from the repo root fails with "No such file or
directory." Low severity to fix (drop the `cd` line or clarify it assumes starting from the
parent `RQ/` directory) but will trip up exactly the "fresh agent following docs" scenario
PROJECT-TASKS.md explicitly worries about.

**P1-5. No CI/CD gate before Vercel auto-deploys `main`.**
Evidence: `.github/workflows` does not exist anywhere in the repo (`find` returns nothing).
`vercel.json` wires Vercel directly to `pnpm --filter @ip/web build`, and DEPLOY.md confirms
"Enable Automatic deployments for main." There is no typecheck/test/lint step gating a push
to `main` before it reaches production.
Consequence: a broken typecheck or failing vitest suite (`pnpm test`) can reach production
directly; the only backstop is a human running `pnpm --filter @ip/web build`/`typecheck`
locally, which PROJECT-TASKS.md's own work log shows is inconsistently done ("Commit: none —
user did not request" pattern recurs).

**P1-6. No security headers beyond Vercel's default HSTS.**
Evidence: `curl -sD - https://rub.pub/` response headers show only
`strict-transport-security: max-age=63072000` (Vercel platform default). No
`Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, or
`Referrer-Policy`. `apps/web/next.config.mjs` has no `headers()` export; `middleware.ts` only
handles Supabase session refresh, not response headers.
Consequence: no clickjacking protection (no XFO/frame-ancestors), no CSP to limit XSS blast
radius, no MIME-sniffing protection. Not exploited today, but a real gap for a site that
handles auth and user uploads.

**P1-7. No `favicon.ico` and no `apple-touch-icon` — PWA "Add to Home Screen" will show a generic icon on some surfaces.**
Evidence: `curl -o /dev/null -w '%{http_code}' https://rub.pub/favicon.ico` → `404`.
`grep apple-touch-icon` on production HTML → 0 matches. Only `mobile-web-app-capable` and
`apple-mobile-web-app-title` meta tags are present (from `apps/web/app/layout.tsx` line 36
`manifest:` block); the manifest's `icon-192`/`icon-512` PNGs do exist and serve 200, so
Android/Chrome install works, but classic browser tab favicon and iOS-specific
`apple-touch-icon` link are both missing.
Consequence: browser tabs show no favicon; iOS Safari "Add to Home Screen" before iOS 15 (and
some non-Safari iOS browsers) may fall back to a screenshot thumbnail instead of the brand
mark.

### P2 — docs drift / inconsistency

**P2-1. `NEXT_PUBLIC_STRIPE_PRICE_INDIE` / `NEXT_PUBLIC_STRIPE_PRICE_PRO` used in code but entirely undocumented.**
Evidence: `apps/web/app/pricing/page.tsx` lines 109-110 read
`process.env.NEXT_PUBLIC_STRIPE_PRICE_INDIE` / `_PRO` (client-exposed). Neither
`docs/ENV_KEYS.md` nor `apps/web/.env.example` mentions these — only the server-only
`STRIPE_PRICE_INDIE`/`STRIPE_PRICE_PRO` are documented.
Consequence: a user wiring Stripe by following ENV_KEYS.md alone will miss setting the
client-side price IDs, and the pricing page's checkout-price display/logic will be
incomplete without anyone knowing why.

**P2-2. `IP_HASH_SALT` used in code, undocumented anywhere.**
Evidence: `apps/web/app/api/scan/route.ts` line 35 and `apps/web/app/api/embed/query/route.ts`
line 29 both read `process.env.IP_HASH_SALT` (falls back to a hardcoded `"ip"` if unset).
Not present in `ENV_KEYS.md`, `.env.example`, or `check-env.mjs`.
Consequence: minor — has a safe default — but production is currently running with the
default salt `"ip"` unless someone set this out-of-band, which weakens the IP-hashing
privacy guarantee the code comments claim ("ip hashed — Master Spec 7").

**P2-3. E2E_CHECKLIST.md and PROJECT-TASKS.md claims verified accurate — no drift found there.**
Cross-checked hero copy, CTA labels, Google login presence, and pricing page presence against
both local and production HTML — all matched. Noting this explicitly since 4 of 6 docs
audited were accurate; only DEPLOY.md/USER_SETUP.md (`cd image-portal`) and ENV_KEYS.md
(Safe Browsing var name) had drift.

### P3 — improvements

**P3-1. No robots.txt or sitemap.xml.** Both 404 on production. For a public marketing site
wanting organic discovery, add a minimal `app/robots.ts` and `app/sitemap.ts` (Next.js
metadata routes) covering `/`, `/pricing`, `/gallery`, `/scan`.

**P3-2. No per-route SEO metadata.** `/login`, `/pricing`, `/gallery`, `/scan` all inherit the
exact same `<title>`/description from root layout — no route-level `generateMetadata` or
`metadata` export overrides them. Adding per-route titles ("Pricing — RQ Plus", "Gallery —
RQ Plus") is a low-effort SEO/UX win.

**P3-3. No OG image or JSON-LD structured data.** `og:image` meta tag is absent entirely
(social shares will show no preview image); no `application/ld+json` anywhere. Consider a
static OG image plus `Organization`/`WebSite` structured data on the homepage.

**P3-4. No custom 404/500 pages.** Production 404 falls through to the stock Next.js
error page (plain, unstyled, "This page could not be found."), inconsistent with the
site's cinema/portal visual identity elsewhere.

**P3-5. Minimal CI pipeline recommendation.** Given no `.github/workflows` exists, a minimal
gate would be: on PR/push to `main`, run `pnpm install`, `pnpm --filter @ip/web typecheck`,
`pnpm --filter @ip/vision test` (or repo-root `pnpm test`), and `pnpm --filter @ip/web build`
— matching exactly what DEPLOY.md already asks humans to run manually before deploying, just
automated as a required check ahead of the existing Vercel auto-deploy.

**P3-6. `apps/mobile/lib/embedding.ts` should be either wired in or deleted/relabeled.**
Since it's currently unreachable, either (a) delete it and update README/MANUAL.md to
describe the actual server-side embedding path mobile uses today, or (b) if on-device
embedding is still the intended end state, wire `getEmbedder()` into `App.tsx` behind a
feature flag so the "TASK 10" pending status is visible in the code path that actually runs.

## Count table

| Severity | Count |
|---|---|
| P0 | 0 |
| P1 | 7 |
| P2 | 3 |
| P3 | 6 |
| **Total** | **16** |
