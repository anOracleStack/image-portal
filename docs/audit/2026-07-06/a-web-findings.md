# Audit A — Web Correctness (apps/web)

Date: 2026-07-06 · Auditor: Agent A · Scope: apps/web routes, pages, lib, components, middleware. All paths relative to `apps/web/` unless prefixed.

## Summary

The web app typechecks clean and the happy-path UI (dashboard, create/edit, scan page, workshop, gallery) is coherent with good loading/empty/error states. However, a cluster of API route handlers were shipped without auth checks while using the service-role client, producing cross-tenant read/write/delete primitives: any anonymous caller can delete or toggle any portal, dump every user's scan events, export any portal's image, and open any user's Stripe billing portal by UUID. Separately, plan-tier scan limits are structurally unenforced because the `match_fingerprints` RPC does not return `owner_id`, so the usage counter and limit check never execute; `total_scans` is likewise never incremented on image scans. The near-duplicate collision guard (the spec's scan-hijack defense) compares dhash against ahash and is effectively inert. The external API's scan action posts a payload the scan endpoint's Zod schema always rejects, so that feature never works. Several endpoints skip Zod validation and rate limiting required by spec §7, in-memory rate limit maps are per-instance only, and the "hide from gallery" paid feature silently disables scanning and slug links entirely.

## P0 — go-live blockers

- [P0] app/api/portals/[id]/route.ts:143-167 — DELETE has no auth/ownership check; uses admin client directly — any anonymous caller who knows/enumerates a portal UUID permanently deletes another user's portal, images, and fingerprints.
- [P0] app/api/portals/[id]/route.ts:169-204 — POST `toggle_status` has no auth/ownership check — anyone can activate/deactivate (take down) any portal.
- [P0] app/api/portals/scan-history/route.ts:4-21 — GET has no auth and no owner filter; admin client returns scan_events for ALL users (portal titles, confidence, timestamps) to any anonymous caller — cross-tenant analytics leak.
- [P0] app/api/stripe/portal/route.ts:9-38 — no auth; `userId` taken from request body — anyone with a victim's user UUID gets a live Stripe Billing Portal session for that customer (cancel subscription, view invoices/payment details). Chainable: the unauthenticated export route leaks `owner_id` in its signed URL path.
- [P0] app/api/portals/[id]/export/route.ts:4-77 — POST has no auth/ownership check — anyone can export any portal's source image and receive a 24h signed URL (path embeds `owner_id`, leaking user UUIDs).
- [P0] app/api/scan/route.ts:132-144 + supabase/migrations/20260519052523_match_rpc.sql:12-19 — `best?.c.owner_id` is always undefined because `match_fingerprints` does not return `owner_id`; `checkScanLimit`/`increment_scan_usage` never run — Free/Indie/Pro monthly scan limits (200/5000/50000) are never enforced and "Scans this month" is permanently 0. Same bug in app/api/hooks/scan/route.ts:128.

## P1 — correctness / security bugs

- [P1] lib/portal-image.ts:33-37 vs :72-73 — collision check compares new image dhash against stored `dhash` column, but insert writes `phash: dh (dhash)` and `dhash: ah (ahash)` (swapped) — near-duplicate guard compares different hash families, so the spec §6.1 scan-hijack defense and the "near-duplicate blocked" acceptance gate never trigger (even exact re-uploads pass).
- [P1] app/api/portals/external/route.ts:97-106 vs packages/shared/src/contracts.ts:63-74 — external "scan" action posts `{portalId, image, source:"api"}` to /api/scan, which requires `embedding/phash/embeddingModel/embeddingVersion/devicePlatform` and rejects source "api" — the API-key scan feature always returns `matched:false` with a wrapped 400. Feature is dead on arrival.
- [P1] app/api/scan/route.ts:105-127 — matched scans never call `increment_scans`/update `total_scans` (only /p/[slug]/go does) — dashboard (app/dashboard/[id]/PortalDetailClient.tsx:233), gallery (app/gallery/page.tsx:166), and share-card scan counts stay at 0 for image scans.
- [P1] supabase/migrations/20260519052523_match_rpc.sql:31 + app/p/[slug]/go/route.ts:21 + app/p/[slug]/page.tsx:19 — `visibility='private'` (sold as "hide from gallery" to Indie+, PortalDetailClient gallery toggle) also excludes the portal from scan matching AND 404s its slug page/redirect — the paid privacy feature silently bricks the product's core function.
- [P1] app/auth/callback/route.ts:13,39 — open redirect: `next` query param is passed to `new URL(next, origin)`; an absolute URL (`?next=https://evil.com`) wins over the base — post-auth redirect to attacker site (phishing after a legitimate Supabase confirm link).
- [P1] app/api/stripe/create-checkout/route.ts:9-50 — no auth; client-supplied `userId` and arbitrary `priceId` accepted — attacker can create checkout sessions bound to any user (subscription metadata attaches to victim's account) and select any price in the Stripe account.
- [P1] app/api/stripe/portal/route.ts:37 — `return_url: ${appUrl}/settings` — no `/settings` route exists (page is `/dashboard/settings`); users returning from the billing portal land on a 404.
- [P1] app/dashboard/scan-history/page.tsx:48-50 vs app/api/portals/scan-history/route.ts:21 — page reads `data.events`/`data.total` but the API returns a bare array (and omits `device_platform/source/source_type` the page renders) — Scan History page always shows empty even for legitimate owners.
- [P1] app/api/hooks/scan/route.ts:48 — server-side fetch of caller-supplied `imageUrl` with no scheme/IP/domain restrictions — SSRF (internal endpoints, cloud metadata) for any API-key holder; violates spec §7 SSRF posture.
- [P1] app/api/scan/route.ts:13-28, app/api/embed/query/route.ts:7-22 — rate limiting is an in-process `Map`; on Vercel serverless each instance has its own map and cold starts reset it — the spec §7 "hard rate-limit" on the unauthenticated scan path is best-effort only. (UNVERIFIED: deployment topology; confirmed hosted at rub.pub/Vercel per lib/supabase-admin.ts:12.)
- [P1] lib/portal-image.ts:101-109 — `portal_fingerprints` insert result never checked; on failure the portal is still activated (line 111-116) with no fingerprint — portal appears live but can never match a scan, silently.
- [P1] app/api/embed/query/route.ts:74 + lib/embedding.ts:40-45 — web query embeddings always use the grid fallback, but catalog embeddings use `CATALOG_EMBED_ENDPOINT` when configured — configuring the warm endpoint silently splits query/catalog embedding spaces (the exact Law-4 invariant violation the model/version check is meant to prevent, undetected because both sides still report `dinov2_vitb14`).

## P2 — consistency / quality gaps

- [P2] app/api/portals/[id]/route.ts:66-96 — PATCH body has no Zod validation (spec §7 "Zod-validate every input"): `title` unbounded/untyped, `status` passed raw to DB (only the check constraint catches bad values, surfacing a raw 500).
- [P2] app/api/portals/[id]/route.ts:154-155 — DELETE removes from table `fingerprints`, which does not exist (schema: `portal_fingerprints`); error is unchecked and silently swallowed — works only because of FK CASCADE, code is misleading.
- [P2] app/api/portals/[id]/events/route.ts:12-42 — SSE route is triple-broken: `head:true` returns no rows so `count` is always 0 and the real `count` field is never read; the cleanup function returned from `start()` is not a ReadableStream cancel hook, so the 5s poll loop never stops after disconnect (edge resource leak); and no client references it (no EventSource usage in app/) — broken, leaking, dead, and unauthenticated.
- [P2] app/api/portals/[id]/takedown/route.ts:6-42 — unauthenticated, no Zod, no rate limit, no portal-existence check; spec §7 requires owner notification + auto-suspend-pending-review on credible claim — none implemented; table is spam-floodable.
- [P2] app/api/abuse/route.ts:5-47 — no rate limit (anonymous spam floods abuse_reports); nonexistent portalId surfaces raw Postgres FK error text as a 500.
- [P2] app/api/portals/lookup/route.ts:4-24 — unauthenticated; returns title/status/visibility for private and suspended portals by slug — metadata disclosure inconsistent with p/[slug] gating.
- [P2] app/api/portals/external/route.ts:62-86 — any API-key holder can fetch ANY portal by slug (`info` returns full `destination_url` of private/suspended portals; no ownership check) — cross-tenant read + violates spec §6 "domain only pre-tap".
- [P2] app/api/images/[id]/route.ts:4-35 and app/api/portals/[id]/share-card/route.ts:9-24 — unauthenticated admin-client reads serve private/inactive portals' images/titles by UUID with public cache headers (soft leak; UUID-gated only).
- [P2] app/api/help/chat/route.ts:4-24 and app/api/url/safety/route.ts:5-9 — unauthenticated, no rate limit; each request burns OpenAI / Google Safe Browsing quota — trivially scriptable cost abuse.
- [P2] app/api/stripe/webhook/route.ts:141-144,186-194 — `checkout.session.completed` and every `invoice.paid` upsert `scan_count: 0, portal_count: 0` for the current calendar month — clobbers accumulated usage mid-month (an over-limit free user upgrading, or any renewal, resets counters).
- [P2] components/UsageSummary.tsx:65-70 vs lib/subscription.ts:90-97 — "Portals created" displays the monthly `subscription_usage.portal_count` (never decremented, resets monthly) while enforcement counts live portal rows — the meter and the gate disagree.
- [P2] app/p/[slug]/page.tsx:44-51 — direct anchor to `destination_url` with no redirect-time re-validation/Safe Browsing/interstitial and no scan_event logging — inconsistent with /p/[slug]/go (route.ts:24-46), so the safety re-check is bypassable by using the page instead of the link.
- [P2] app/api/scan/route.ts:82-99 (same hooks/scan:84-97) — up to 20 sequential storage downloads per scan (N+1, no caching) on the latency-critical path; spec gate is <1.5s end-to-end.
- [P2] lib/portal-image.ts:29-37 — collision check selects the dhash of EVERY active portal image (unbounded full-table scan into memory) on every upload.
- [P2] middleware.ts:31,36-40 — `supabase.auth.getUser()` (network round-trip) runs on every request including /api/scan, /api/embed/query, and all marketing pages — avoidable hot-path latency; matcher should exclude public API routes.
- [P2] lib/portal-workshop.ts:23-25 + app/api/portals/[id]/workshop/route.ts:231-242 — `draftRefName(references.length)` after `remove_reference` reuses an existing index (e.g. [ref-0, ref-2] → next name ref-2), upserting over a still-referenced file and duplicating entries in state.
- [P2] app/api/portals/[id]/workshop/route.ts:212,238,248 — `regenerateEnhanced` throws (e.g. "Reference image missing") are unhandled in chat/remove/regenerate actions → raw Next 500 with no friendly message (the multipart path at 148-165 handles the same failure gracefully).
- [P2] app/dashboard/PortalList.tsx:72-74 + components/PortalCard.tsx:62-67 — `<a>` (edit) and `<button>` (delete) nested inside the card's wrapping `<a>` — invalid HTML; parsers split nested anchors, risking hydration mismatch and misdirected clicks.

## P3 — improvements / cleanups

- [P3] lib/subscription-context.ts + components/SubscriptionProvider.tsx — exported context/provider/`useSubscription` are never mounted or consumed anywhere; dead code.
- [P3] lib/stripe.ts:13-17 — duplicate `mapPriceIdToTier` (webhook imports the lib/stripe-plans.ts copy); one is dead and they can drift.
- [P3] lib/query-embedding.ts — byte-for-byte re-implementation of packages/vision/src/grid-embedding.ts; consolidate to one source so the "same algorithm both sides" comment stays true.
- [P3] app/api/hooks/scan/route.ts:60 — `base64` computed and never used; whole route duplicates the /api/scan pipeline (drift risk — e.g. it has no rate limit while /api/scan does).
- [P3] app/p/[slug]/go/route.ts:41-42 — direct-link opens logged as `match_method:"qr", source:"qr"` though QR is a killed feature; analytics taxonomy is stale (suggest "link").
- [P3] packages/shared/src/contracts.ts:15 + supabase init check constraint — `scan_mode: "hybrid"` still in the enum/DB while product is image-only (lib/types.ts:8 documents it as legacy); plan a migration + enum cleanup.
- [P3] docs/IMAGE_PORTAL_MASTER_SPEC.md §8 lists three export modes (incl. QR corner + poster) but app/api/portals/[id]/export/route.ts:12-16 intentionally supports image-only — spec/product drift; update the canonical doc.
- [P3] app/design-preview/page.tsx — dev-only design snapshot page ships as a public production route (per CLAUDE.md it is "not in nav" but it is reachable).
- [P3] app/api/portals/create/route.ts:83-97 — slug collision loop issues up to 1000 sequential queries; also `checkPortalLimit` (line 62) races concurrent creates past the plan cap (no transactional guard).
- [P3] app/api/scan/route.ts:108-120 — `scan_events` insert and `portals` update results unchecked; a failing insert silently drops analytics (same in hooks/scan:104-116, go route:38-46).
- [P3] app/api/scan/route.ts:146-163 — when the owner is over limit the response still includes the matched portal and only sets `usageBlocked` (clients ignore it) — once the P0 owner_id bug is fixed, decide whether over-limit matches should return the destination at all.

## Counts

| Severity | Count |
|---|---|
| P0 | 6 |
| P1 | 12 |
| P2 | 18 |
| P3 | 11 |
| **Total** | **47** |
