# Audit B — Security Surface Findings

Date: 2026-07-06 · Auditor: Agent B (Security) · Scope: Master Spec §7 + §11
Repo: image-portal · Prod: https://rub.pub · Method: read-only code audit

## Summary

The URL-safety core (`packages/shared/src/url-safety.ts`) is solid and well
tested, service-role key isolation is clean, the scan RPC correctly hides
inactive/suspended/private portals and embeddings, Stripe webhook signature
verification is correct, and the near-duplicate collision block exists. However
the audit found **three P0s**: two unauthenticated IDOR sinks on
`/api/portals/[id]` (any anonymous caller can **delete** or **disable** any
portal by UUID via the service-role client) and a classic **SSRF** on
`/api/hooks/scan` (server-side `fetch()` of a user-supplied `imageUrl` with no
allowlist / IP-pin — a direct §7 violation). Rate-limiting is in-memory and
ineffective on serverless, the Safe Browsing periodic re-check + auto-suspend
job does not exist, and several read routes leak cross-tenant / private data.

## Spec §7 Compliance Table

| §7 Requirement | Status | Where |
|---|---|---|
| URL scheme allowlist (https only; reject js/data/file/localhost/private IP/malformed) | IMPLEMENTED | `packages/shared/src/url-safety.ts:5-17,83-125` |
| Open-redirect & homograph/punycode guard | PARTIAL | `url-safety.ts:19-24,75-81` — flags only (correct), but IPv6 `::ffff:` mapped & decimal/octal IP forms not covered |
| Safe Browsing at set-time | IMPLEMENTED | `create/route.ts:53`, `[id]/route.ts`, `p/[slug]/go/route.ts:31` |
| Safe Browsing periodic re-check + auto-suspend | **MISSING** | no cron/job anywhere (grep: none) |
| No server-side fetch of destination on hot path (SSRF) | **VIOLATED** | `api/hooks/scan/route.ts:48` fetches user URL |
| /api/scan unauthenticated → hard rate-limit by IP + device id | PARTIAL | `api/scan/route.ts:13-28` in-memory Map, per-instance, uses `devicePlatform` not device id |
| Fingerprints/embeddings never client-selectable; scan only read path | PARTIAL | RPC OK (`match_rpc.sql`); but `portal_fingerprints` RLS `for all` lets owner SELECT own embeddings (`init.sql:188`) |
| Never return inactive/suspended portals from scan | IMPLEMENTED | `20260519052523_match_rpc.sql` `where status='active' and visibility='public'` |
| Near-duplicate collision block at upload (§6.1) | IMPLEMENTED | `lib/portal-image.ts:29-37` |
| scan_events store ip_hash not raw IP | IMPLEMENTED | `api/scan/route.ts:30-38,118` |
| scan_events retention set | **MISSING** | no TTL/retention policy in any migration |
| Never expose service role key to clients | IMPLEMENTED | `lib/supabase-admin.ts:1` `server-only`; no NEXT_PUBLIC leak |
| Zod-validate every input | PARTIAL | scan/create/external use Zod; abuse/takedown/url-safety/lookup/[id] hand-rolled |
| takedowns table + workflow + auto-suspend on credible claim | PARTIAL | table + insert route exist; no notification, **no auto-suspend** |
| No hardcoded secrets | IMPLEMENTED | grep clean (only `sbp_...` placeholder in a script comment) |

## Findings

### P0

- [P0] apps/web/app/api/portals/[id]/route.ts:143-166 — `DELETE` has **no auth and no ownership check** and runs on the service-role client (RLS bypassed) — exploit: unauthenticated `DELETE /api/portals/<uuid>` permanently deletes any user's portal, its `portal_images` and fingerprints. Portal UUIDs leak via `/api/portals/public`, `/api/portals/scan-history`, and share links, so mass destruction of the whole gallery is trivial. (Contrast: GET/PATCH in the same file correctly check `owner_id`.)
- [P0] apps/web/app/api/portals/[id]/route.ts:168-207 — `POST {action:"toggle_status"}` has **no auth and no ownership check** (service-role client) — exploit: unauthenticated caller flips any portal `active`↔`inactive` by UUID; can disable every live portal (DoS of the scan product) or re-activate a portal an admin set to `inactive`.
- [P0] apps/web/app/api/hooks/scan/route.ts:48 — `fetch(body.imageUrl, …)` performs a server-side request to a fully user-controlled URL with **no scheme/host allowlist, no private-IP block, no redirect refusal, no IP-pin** — direct §7 SSRF violation. Exploit: any signed-in user mints a free API key (`/api/keys`), then POSTs `{imageUrl:"http://169.254.169.254/latest/meta-data/iam/security-credentials/…"}` or `http://localhost:<port>/…` to reach cloud metadata / internal services; success/error/timing differences leak internal network topology and can exfiltrate credentials the server can reach.

### P1

- [P1] apps/web/app/api/portals/scan-history/route.ts:4-24 — **unauthenticated**, service-role client, **no owner filter** — exploit: anonymous `GET /api/portals/scan-history?limit=100&offset=…` pages through every user's scan events (portal_id, title, confidence, timestamps) across all tenants; full cross-tenant analytics disclosure.
- [P1] apps/web/app/api/scan/route.ts:13-28 — rate limit is a module-level in-memory `Map`; on Vercel serverless each lambda instance has its own memory and instances are ephemeral/parallel, so the limit resets on cold start and is not shared — effectively bypassable by fanning requests across instances. Also keyed by `devicePlatform` (3 values), not the spec-required per-device id. Spec §7 mandates a *hard* rate-limit for the unauthenticated `/api/scan`; this is soft. Move to a shared store (Upstash/Postgres/Vercel KV).
- [P1] Safe Browsing periodic re-check + auto-suspend — **MISSING** (no cron, edge function, or scheduled job anywhere; grep for cron/recheck/auto-suspend returns nothing) — exploit: a destination that passes at set-time and later turns malicious (domain re-registration, compromised host) is never re-scanned and never auto-suspended, so the portal keeps redirecting scanners to a now-malicious site. §7 explicitly requires this.

### P2

- [P2] apps/web/app/api/images/[id]/route.ts:5-40 — serves any `portal_images` row by UUID via service-role client with **no auth and no visibility/status check**; the bucket was made private in `20260607190000_...v2.sql` specifically to force access through this route, but the route re-exposes every image — including images of `private` and `suspended` portals — to anyone with the image UUID.
- [P2] apps/web/app/api/portals/lookup/route.ts:4-27 — unauthenticated; returns `id,title,slug,visibility,status` for **any** slug including `private`/`suspended` portals — enables existence/status enumeration of non-public portals by slug guessing.
- [P2] apps/web/app/api/portals/external/route.ts:75-86 — `action:"info"` returns full `destination_url` + `status` for **any** slug with no `active`/`public` filter (needs only a free API key) — leaks destinations of inactive/suspended/private portals.
- [P2] apps/web/app/api/portals/[id]/takedown/route.ts & api/abuse/route.ts — no rate limiting; takedown route has **no auth** at all — exploit: unauthenticated attacker floods `takedowns`/`abuse_reports` for arbitrary portal IDs. Combined with the missing auto-suspend workflow, §7 "auto-suspend pending review on credible claim" is unmet.
- [P2] apps/web/app/api/scan/route.ts:35 — `ipHash` default salt is the literal `"ip"` when `IP_HASH_SALT` is unset; IPv4 space is tiny, so an unset-salt deployment yields trivially reversible hashes. Fail closed (throw) if the salt env var is missing.
- [P2] supabase/migrations/* — `scan_events` has **no retention/TTL** policy despite §7 "set retention; CCPA posture"; rows accumulate indefinitely with `ip_hash`.
- [P2] supabase/migrations/20260519052511_init.sql:188-192 — `portal_fingerprints` policy is `for all ... using(owner)`, which grants owners **SELECT on their own embeddings** via the anon/authenticated client; §7 says embeddings are "NEVER client-selectable (… scan is the only read path)". Restrict to insert/update/delete only (no select policy).

### P3

- [P3] apps/web/app/p/[slug]/go/route.ts:52-61 — interstitial HTML interpolates `verdict.domain` and `verdict.normalized` unescaped into markup/`href`; host+URL are validated (https, hostname charset) so exploitability is low, but HTML-encode before rendering as defense-in-depth.
- [P3] apps/web/app/api/help/chat/route.ts — no rate limiting on an endpoint that calls OpenAI when `OPENAI_API_KEY` is set — unauthenticated cost-abuse / bill-run-up vector.
- [P3] apps/web/app/api/portals/[id]/events/route.ts — unauthenticated SSE that polls the DB every 5s forever via service-role client (leaks per-portal scan counts; mild connection-exhaustion DoS). Add auth + connection cap.
- [P3] apps/web/app/api/portals/[id]/image/prepare/route.ts:26-32 — accepts any `Blob` and hard-codes `contentType:"image/jpeg"`; no magic-byte/MIME sniff. Size is capped (good). Validate actual image type.
- [P3] packages/shared/src/url-safety.ts:6-17 — private-host regex misses decimal/octal/hex IPv4 (`http://2130706433/`), `0x7f.0.0.1`, and IPv4-mapped IPv6 (`::ffff:127.0.0.1`); low impact today because SSRF is not on the destination hot path, but tighten before any unfurl feature ships.

## Count Table

| Severity | Count |
|---|---|
| P0 | 3 |
| P1 | 3 |
| P2 | 7 |
| P3 | 5 |
| **Total** | **18** |

## §11 Acceptance Gate (security-relevant)

- "`javascript:` / private-IP / punycode-lookalike destination is rejected" —
  PASS for the destination validator (`url-safety.ts` + tests), but the SSRF and
  IDOR sinks above are outside that validator and remain exploitable.
