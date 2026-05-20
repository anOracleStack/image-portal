# IMAGE PORTAL — BUILD MANUAL (CURSOR + CLAUDE CODE)

> How to drive this build. Workflow split per Oracle canon:
> **Cursor** = planning, quick edits, review. **Claude Code** = autonomous
> multi-file execution. Feed the master prompt once, then run task prompts in
> order. Every task must respect `.cursorrules` and `docs/IMAGE_PORTAL_MASTER_SPEC.md`.

---

## SETUP (do this first, by hand)

1. Place these files at repo root:
   - `.cursorrules`
   - `docs/IMAGE_PORTAL_MASTER_SPEC.md`
   - `docs/MANUAL.md` (this file)
   - `supabase/0001_init.sql` (rename of `schema.sql`)
2. Create Supabase project. Open `schema.sql`, set `vector(768)` to the pinned
   model's dimension, run it. Create the three storage buckets (see schema tail).
3. Decide the pinned embedding model BEFORE coding (this is irreversible-ish):
   - Recommended: DINOv2 ViT-B/14 (768) or SSCD (512). Pick one. Pin it.
   - Confirm an on-device export exists (ONNX / CoreML / TFLite) for Expo.
4. Env vars (web): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`, `EMBED_MODEL_ID`,
   `EMBED_VERSION`, `SAFE_BROWSING_API_KEY`, `MAX_IMAGE_UPLOAD_MB=10`.

---

## MASTER PROMPT — paste into Claude Code once at the start

```
You are building a production-minded MVP called IMAGE PORTAL inside this repo.

Authority order: .cursorrules > docs/IMAGE_PORTAL_MASTER_SPEC.md > this prompt.
If you are about to contradict the master spec, STOP and re-read it. Do not
redesign the architecture. Execute it. Build in the locked task order; produce
real files, not stubs; explain each local setup command.

NON-NEGOTIABLE ARCHITECTURE LAWS:
1. Recognition is two-stage retrieve-then-verify and BOTH stages ship in V1.
   Stage A: copy-detection embedding ANN over pgvector HNSW, top-K 20.
   Stage B: ORB + RANSAC homography inlier verification on the candidates.
   Nearest-neighbor alone is never a match decision.
2. Primary embedding is a copy-detection / instance-retrieval model
   (SSCD or DINOv2). NOT CLIP. Build it behind a swappable interface.
3. Query embedding runs ON-DEVICE in the Expo app. Catalog embedding runs at
   upload time server-side/batch. No Python vision microservice at MVP.
4. One pinned model, identical preprocessing both sides. Every fingerprint row
   stores embedding_model + embedding_version. /api/scan refuses wrong-version
   rows. Never hot-swap a model.
5. No aspect-ratio enforcement. No auto-open (result card + tap). No continuous
   video to backend (throttled capture or tap-to-scan). MindAR is campaign-pack
   only, never the cloud engine.
6. Enforce the full security surface from master spec section 7 in code.

STACK: pnpm monorepo, Next.js App Router + TS + Tailwind (apps/web, includes
PWA scanner + API routes), Expo RN + expo-camera (apps/mobile, on-device
embedding), Supabase Auth/Postgres/Storage/RLS + pgvector, Vercel + EAS.

Use Zod for all input. Server-only Supabase admin client, never client-side.
Reusable components with explicit loading/empty/error states. Small commits
named to the task numbers in docs/MANUAL.md.

Acknowledge the laws, confirm the monorepo plan, then wait for TASK 1.
```

---

## TASK PROMPTS — run in sequence, one at a time

**TASK 1 — Scaffold.** Create the pnpm-workspace monorepo: `apps/web`,
`apps/mobile`, `packages/shared`, `packages/vision`, `supabase`, `docs`.
TS strict, ESLint, Prettier, shared path aliases. No app code yet.

**TASK 2 — Supabase wiring.** Confirm `supabase/0001_init.sql` matches the
canonical schema. Add server-only admin client + browser client in `apps/web`.
Wire env vars. Add a tiny script that asserts `EMBED_VERSION` is set.

**TASK 3 — Auth.** Web login/signup/logout, protected dashboard layout,
auto-create `profiles` row on signup.

**TASK 4 — Portal CRUD.** Create/edit/delete/toggle status; slug generation;
destination URL field. Wire RLS-respecting queries only.

**TASK 5 — Upload pipeline.** `/api/portals/[id]/image`: validate MIME+size →
normalize → SHA256 (dedup) → pHash/dHash → quality score (warn only) →
near-duplicate collision check vs active portals (block/flag) → request catalog
embedding (swappable provider interface) → persist `portal_images` +
`portal_fingerprints` with `embedding_model` + `embedding_version`.

**TASK 6 — Redirect + URL safety.** `/p/[slug]`: look up active portal,
increment scans, log scan_event, redirect. Enforce scheme allowlist, private-IP
block, punycode/homograph flag, open-redirect flag, Safe Browsing check. Safe
interstitial for flagged destinations. Never redirect inactive/suspended.

**TASK 7 — QR + exports.** QR generator pointing to `/p/[slug]`. Three export
modes (image only / image+corner QR / poster template). Cosmetic mark toggle.

**TASK 8 — Vision package.** `packages/vision`: preprocessing (brightness norm,
perspective correct, deblur, center crop), ORB+RANSAC verifier, confidence
banding function, ANN query helper. Pure, unit-tested, provider-agnostic.

**TASK 9 — Scan API.** `/api/scan`: accept query embedding + pHash (+ optional
frame). Prefilter → pgvector HNSW top-20 (active + correct embedding_version
only) → ORB verify → tiered bands (screen vs print thresholds via source_type)
→ log scan_event (ip hashed). Hard rate-limit by IP + device id. Never leak
embeddings/fingerprints.

**TASK 10 — Expo scanner.** expo-camera permissions, throttled capture
(800-1500ms) or tap-to-scan, ON-DEVICE embedding (ONNX/ExecuTorch/TFLite,
identical preprocessing to server), POST to `/api/scan`, result card with
destination domain + tap-to-open, no-match screen with honest tips, report.

**TASK 11 — PWA scanner.** getUserMedia throttled capture, ONNX-web embedding
fallback, same `/api/scan`, installable manifest, mobile-first.

**TASK 12 — Analytics.** Scans over time, matched vs QR vs app vs PWA,
confidence distribution, last scanned, recent events. Owner-scoped.

**TASK 13 — Security pass.** Rate limits, abuse + takedown workflows,
auto-suspend hooks, ip hashing + retention, CCPA deletion path, error
boundaries, empty states. Run the master spec section 11 acceptance gates.

**TASK 14 (V2) — Verification upgrade.** Swap ORB → SuperPoint+LightGlue
behind the existing verifier interface. Add MindAR bounded campaign packs.

---

## FINAL BUILD COMMAND (after a task completes and you want continuation)

```
Continue. Do not skip files. When a file is long, continue file by file until
the task is complete. After the task, run its acceptance gate from master spec
section 11 and report pass/fail before moving on. Do not start the next task
until I say so.
```

---

## REVIEW CADENCE (Cursor side)

After each task: open the diff in Cursor, verify against the matching
acceptance gate and the relevant `.cursorrules` law, fix small issues inline in
Cursor, hand structural changes back to Claude Code. The recognition correctness
gate (TASK 9: two similar-but-different posters must NOT cross-match) is the one
that proves the whole product — do not wave it through.
