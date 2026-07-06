# Audit Agent E — Supabase / Data Domain

Scope: `supabase/` (migrations, config) + `apps/web`/`packages` consumption. Spec: `docs/IMAGE_PORTAL_MASTER_SPEC.md` §5, §7.
No dashboard access — DB state inferred from migration files only. Live-state items are flagged explicitly below.

## Summary

Core schema (8 tables, spec §5) is present and mostly matches the canonical model, including the pinned
`vector(768)` + `embedding_model` + `embedding_version` columns and an HNSW cosine index. The two
`security_hardening` migrations correctly lock down `match_fingerprints`, `increment_*` RPCs, and flip
`portal-images`/`portal-exports` to private buckets — **if** they were actually applied to the live project in
order (unverifiable from files alone).

However, three P0s were found in application code (not the SQL files) that defeat the schema's intent:
an **unauthenticated endpoint that dumps all users' scan history**, an **unauthenticated image-proxy that
serves any portal's images regardless of visibility/status**, and the storage-bucket migration history shows
`portal-images`/`portal-exports` were briefly created **public** before being hardened — anyone who queried
between those migrations, or any deployment that never ran the hardening migrations, is exposed. There is also
a project-ref mismatch between the two `.temp/linked-project.json` files in this repo and the ref given for this
audit, which needs dashboard confirmation. The `avatars` bucket has zero storage policies. `sha256` dedup exists
in the column but has no unique constraint and no app-level check. A phash/dhash/ahash mislabeling bug means
the `phash` column never actually stores a pHash.

## Table Matrix (spec §5)

| Table | In spec? | In migrations? | RLS enabled? | Policy summary | Referenced by app code? |
|---|---|---|---|---|---|
| `profiles` | Yes | Yes (0001) | Yes | select: public; insert/update: self only (`auth.uid()=id`) | Yes — settings, callback, ensure-profile |
| `portals` | Yes | Yes (0001) | Yes | select: public+active OR owner; insert/update/delete: owner only | Yes — extensively |
| `portal_images` | Yes | Yes (0001) | Yes | all: owner only (`auth.uid()=owner_id`) | Yes |
| `portal_fingerprints` | Yes | Yes (0001) | Yes | all: owner only via portals join; **no client select policy** (correct per spec) | Yes — write path (`portal-image.ts`), read via `match_fingerprints` RPC only |
| `scan_events` | Yes | Yes (0001) | Yes | select: owner only via portals join; insert: was `true`, **dropped** in hardening migration (server now uses service role) | Yes — but see P0-1 |
| `portal_exports` | Yes | Yes (0001) | Yes | all: owner only via portals join | Yes |
| `abuse_reports` | Yes | Yes (0001) | Yes | select: owner only; insert: was `true`, dropped (server uses service role) | Yes |
| `takedowns` | Yes | Yes (0001) | Yes | select: owner only; insert: was `true`, dropped (server uses service role) | Yes |
| `subscriptions` | Not in §5 (billing) | Yes (0003) | Yes | select: self; permissive write policy dropped in hardening | Yes |
| `subscription_usage` | Not in §5 | Yes (0003) | Yes | select: self; permissive write policy dropped in hardening | Yes (via RPCs) |
| `user_api_keys` | Not in §5 | Yes (`0004_api_keys.sql`, root — **not** `supabase/migrations/`) | Yes | all: owner only | Yes |

## §5 Schema Deviations

- **`portal_images`**: spec column order/name matches (`sha256, phash, dhash, quality_score`); actual table
  additionally has `is_primary` (undocumented in spec but harmless addition).
- **`portal_fingerprints.embedding`**: `vector(768)` pinned, matches `EMBED_DIM=768` in
  `packages/shared/src/contracts.ts:9` and `EMBED_MODEL="dinov2_vitb14"` — consistent with spec §2.1/§2.4. Good.
- No deviations in column names/types beyond the above.

## Findings

### P0 — Data exposure / RLS hole / schema-code mismatch on live path

**P0-1. `/api/portals/scan-history` is completely unauthenticated and returns every user's scan events.**
`apps/web/app/api/portals/scan-history/route.ts:1-22`. Handler calls `createAdminClient()` (service role,
bypasses RLS) and queries `scan_events` with **no `auth.getUser()` check and no filter by owner/portal** —
only `order`+`range`. Any anonymous caller can page through `id, portal_id, matched, confidence,
inlier_count, created_at, portals.title` for the entire platform. Compare with the correctly-scoped sibling
`apps/web/app/api/portals/analytics/route.ts:6-24`, which does check `auth.getUser()` and filters
`portalIds` to the caller's own portals — proving the omission in `scan-history` is a bug, not an
intentional public endpoint. Failure scenario: competitor or scraper enumerates all portal titles + scan
volumes + match rates platform-wide, a business-sensitive dataset the spec's owner-only `scan_events`
select RLS policy was explicitly designed to prevent (defeated because the route uses service role and
never re-implements the check).

**P0-2. `/api/images/[id]` serves any portal image with no auth/ownership/visibility check.**
`apps/web/app/api/images/[id]/route.ts:4-40`. Looks up `portal_images` by bare `id` and streams the blob
from the now-private `portal-images` bucket via service role — no check that the owning portal is
`visibility='public' AND status='active'`, nor that the requester owns it. This re-opens exactly the
exposure that migration `20260607190000_security_hardening_v2.sql:29-44` intended to close by making
`portal-images` private: the bucket-level RLS is irrelevant because this route always uses the service
role and applies no equivalent authorization logic itself. Failure scenario: private/suspended portal
image files (potentially subject to takedown/abuse review) remain fetchable by anyone who obtains the
`portal_images.id` UUID (e.g., leaked via `/dashboard` HTML, referrer headers, or brute-forced given the
sequential-feeling nature of upload flows).

**P0-3. Storage buckets `portal-images` and `portal-exports` were created `public=true` before being hardened, and depend on ordered migration application that cannot be verified from files alone.**
`supabase/migrations/20260519052611_storage_policies.sql:4-9` creates both buckets `public=true` with an
open `for select using (bucket_id = '...')` policy (no auth check at all — even more permissive than
"authenticated"). This is only corrected two migrations later by
`20260607180000_security_hardening.sql:67-69` (portal-exports) and
`20260607190000_security_hardening_v2.sql:31-33` (portal-images). If the hardening migrations were never
applied to the live `duydupyyembdttmjvsxm` project (unverifiable without dashboard access), both buckets
are still fully public today, meaning `/api/images/[id]`'s issue above would be compounded by direct
`storage.objects` public reads of every uploaded file, including files belonging to private/suspended
portals. **Requires dashboard verification.**

### P1 — Integrity / correctness

**P1-1. phash/dhash/ahash column mislabeling in the write path.**
`apps/web/lib/portal-image.ts:22-25` computes `dh = dhash(px)` and `ah = ahash(px)`, but then persists
`phash: dh, dhash: ah` at both the `portal_images` insert (`portal-image.ts:72-73`) and the
`portal_fingerprints` insert (`portal-image.ts:104-105`). The column named `phash` actually stores a
dHash value, and the column named `dhash` actually stores an aHash value; no true perceptual hash (pHash)
is ever computed or stored, despite spec §5/§6.1 requiring `phash, dhash` explicitly (as distinct
algorithms) on both tables. Any future code that trusts `portal_images.phash` to be pHash-comparable will
get wrong results.

**P1-2. `sha256` dedup is schema-only, not enforced.**
`supabase/migrations/20260519052511_init.sql:58,149` — `sha256 text` with only a non-unique index
(`portal_images_sha256_idx`), no `unique` constraint. Spec §6.1 requires "SHA256 (dedup)" as an upload
step; `apps/web/lib/portal-image.ts` computes `sha256` (line 22) only to build the storage path
(`storagePath = ownerId/portalId/sha256`, line 41) — no query against existing `sha256` values, no dedup
check performed anywhere before insert. Duplicate images (even byte-identical) can be uploaded repeatedly
under different portals with no collision surfaced via this column; the only collision defense is the
dHash-similarity loop (line 29-37), which is a different, weaker signal than SHA256 exact-match dedup.

**P1-3. No `updated_at` trigger; column silently goes stale.**
`profiles.updated_at`, `portals.updated_at`, `subscriptions.updated_at` all have
`default now()` but no `BEFORE UPDATE` trigger anywhere in `supabase/migrations/`. Only a few call sites
manually set it (`apps/web/lib/portal-image.ts:114`, `apps/web/app/api/stripe/webhook/route.ts` x4); the
general portal PATCH handler (`apps/web/app/api/portals/[id]/route.ts:125-130`) and the profile
referral-code update (`apps/web/app/dashboard/settings/page.tsx:55-58`) do **not** set it, so
`updated_at` under-reports the true last-modified time for most portal/profile edits.

**P1-4. Dead/broken cleanup call on portal deletion.**
`apps/web/app/api/portals/[id]/route.ts:155` — `await db.from("fingerprints").delete()...` references a
table that does not exist (the real table is `portal_fingerprints`). The call's error is never checked
(no `error` destructured), so it fails silently on every portal deletion. Functionally masked today only
because `portal_fingerprints.portal_id` has `ON DELETE CASCADE` from `portals` (confirmed in
`20260519052511_init.sql:72`), so the subsequent `db.from("portals").delete()` at line 157 still cleans up
fingerprints correctly via the FK — but the explicit line is dead code that would mislead a future reader
into thinking cascade isn't trusted, and would break silently-differently if the FK cascade were ever
changed.

### P2 — Hygiene / drift

**P2-1. Two different linked Supabase project refs in-repo, neither matching the audit's stated ref.**
`supabase/.temp/linked-project.json` and `apps/web/supabase/.temp/linked-project.json` both point to
`ref: ybqmvxuvaldfzmkbucqc` ("Image Portal"), but the project ref given for this audit is
`duydupyyembdttmjvsxm`. Either the repo's local CLI link is stale/wrong, or the audit is targeting a
different (possibly newer) project than what migrations were last pushed to. **Requires dashboard/user
verification** of which ref is actually production.

**P2-2. Duplicate non-canonical SQL files at `supabase/` root, one of which is never applied.**
`supabase/0001_init.sql`, `0002_match_rpc.sql`, `0003_subscriptions.sql` are byte-identical duplicates of
their `supabase/migrations/2026...` counterparts (confirmed via `diff`) — harmless but confusing. However
`supabase/0004_api_keys.sql` and `supabase/0004_innovation.sql` (also identical to each other) define
`public.user_api_keys` and its RLS policy but have **no corresponding file under `supabase/migrations/`** —
`supabase db push`/CLI migration flow will never apply them. Since `apps/web/app/api/keys/route.ts` and
`apps/web/app/api/hooks/scan/route.ts` depend on `user_api_keys` existing, this table's presence in
production depends entirely on someone having pasted `0004_*.sql` into the SQL editor by hand — undocumented
in `docs/DEPLOY.md`'s migration instructions. **Requires dashboard verification** that `user_api_keys`
actually exists in production.

**P2-3. `avatars` bucket has zero storage.objects policies.**
`avatars` is created (public, in `20260609120000_ensure_storage_buckets.sql:27-33`) but no migration ever
adds a `storage.objects` policy scoped to `bucket_id = 'avatars'`. With RLS enabled on `storage.objects`
(Supabase default) and no matching policy, **no client-side (anon/authenticated) select/insert/update/delete
will succeed** for this bucket at all — only service-role calls work. If any user-facing avatar upload
flow relies on the browser/authenticated client rather than an API route with service role, it will fail.
(`grep` found no `avatars` upload code path in `apps/web` at all, so this may currently be inert/unused —
worth confirming it's not a silently-broken planned feature.)

**P2-4. `portal-cache` bucket policies are not owner-scoped.**
`supabase/migrations/20260519052611_storage_policies.sql:49-62` — "Auth Select portal-cache" and "Auth
Insert portal-cache" allow **any authenticated user** to read/write **any** object in `portal-cache`
(`using (bucket_id = 'portal-cache' and auth.role() = 'authenticated')`, no owner/foldername check). Only
delete is owner-scoped (line 59-62, checks `owner = auth.uid()`, but Storage's `owner` column is only set
for uploads done via the authenticated client — service-role uploads, which is what `portal-image.ts:85`
actually uses, leave `owner` null, making that delete policy unreachable for the app's real upload path
too). Since `/api/scan` (service role) is the only intended reader of this bucket
(`apps/web/app/api/scan/route.ts:85`), this is lower severity than P0-1/P0-2, but any authenticated end
user could `list`/`download` other users' cached preprocessed pixel dumps (`{portal_image_id}.raw`) if they
called the Storage API directly with their own session token — a minor content-privacy leak of
pre-processed image bytes for images they don't own.

**P2-5. Historical: `increment_scans`/`increment_scan_usage`/`increment_portal_count` originally shipped without `search_path` pinning.**
`supabase/migrations/20260519052523_match_rpc.sql:38-41` and `20260520031051_usage_rpcs.sql:10-33` define
these with no `SET search_path` and no explicit `SECURITY` mode. This was corrected by
`20260607180000_security_hardening.sql:6-51` (`create or replace` with identical signatures, so it cleanly
overwrites — verified no dangling overloads). End state is safe; flagging only because the vulnerable
window exists in migration history and would recur if `20260607180000` were ever skipped during a partial
`db push`.

### P3 — Improvement

**P3-1.** `match_fingerprints` (spec's HNSW retrieval RPC) is correctly `security definer set search_path =
public`, and `20260607190000_security_hardening_v2.sql:23-27` restricts `EXECUTE` to `service_role` only —
this matches spec §7 ("fingerprints/embeddings are NEVER client-selectable... SECURITY DEFINER function is
the only read path"). No issue; noted as confirmed-correct since it was explicitly in scope.

**P3-2.** `match_fingerprints` (`20260519052523_match_rpc.sql:30-31`) filters
`p.status = 'active' and p.visibility = 'public'` — meaning **private portals can never be matched by
`/api/scan`** at all. If "private" is meant to mean "not listed in the public gallery" but still
scannable by whoever has the physical image (the core product promise per spec §0), this filter silently
defeats scanning for private portals. Worth confirming against product intent — may be intentional (private
= owner-only preview) or may be a gap that makes "private" portals functionally non-scannable, which would
contradict the north-star pitch. Flagged as improvement/clarification since it's ambiguous from schema
alone.

**P3-3.** No pg_cron job or documented retention/deletion mechanism for `scan_events.ip_hash` exists in any
migration, despite spec §7 requiring "set retention... CCPA posture... support deletion requests."
`docs/MANUAL.md:120` lists it as a planned task only. `scan_events.portal_id` correctly uses
`ON DELETE SET NULL` (`20260519052511_init.sql:87`) so events aren't lost when a portal is deleted, but
nothing ever prunes old rows or fulfills a CCPA deletion request tied to an IP hash. Needs either a
pg_cron job, an Edge Function on a schedule, or a documented manual SOP.

## Requires Dashboard Verification (user action — no CLI/dashboard access from this audit)

1. Confirm which Supabase project ref is actually production: `duydupyyembdttmjvsxm` (given for this
   audit) vs `ybqmvxuvaldfzmkbucqc` (linked in both `supabase/.temp/` and `apps/web/supabase/.temp/`).
2. Confirm all 9 migrations under `supabase/migrations/` have been applied, in order, via
   Dashboard → Database → Migrations (or `supabase migration list --linked`) — especially
   `20260607180000_security_hardening.sql` and `20260607190000_security_hardening_v2.sql`, since P0-3
   depends on them having actually run.
3. Confirm current `public` flag on `storage.buckets` for `portal-images` and `portal-exports`
   (Dashboard → Storage → bucket settings) — should both be `false`.
4. Confirm `public.user_api_keys` exists (P2-2) — it has no file under `supabase/migrations/`.
5. Confirm whether any `storage.objects` policies exist for the `avatars` bucket beyond what's in these
   migration files (P2-3) — none were found in the repo.
6. Confirm no pg_cron extension/jobs are configured for `scan_events` retention (P3-3) — cannot see cron
   jobs from SQL migration files alone.

## Finding Count

| Severity | Count |
|---|---|
| P0 | 3 |
| P1 | 4 |
| P2 | 5 |
| P3 | 3 |
| **Total** | **15** |
