# Audit D — Vision / ML Pipeline Findings

Auditor: Agent D · Date: 2026-07-06 · Scope: packages/vision, /api/scan, /api/embed/query,
web+mobile embedding libs, match RPC. Spec: docs/IMAGE_PORTAL_MASTER_SPEC.md (§2, 4, 5, 6, 10, 11).
Tests run: `pnpm test` → 4/4 pass (packages/vision/test/recognition.test.ts only).

## Summary

The two-stage retrieve-then-verify *shape* is present and the codebase is unusually honest in its
comments, but three of the spec's V1-core guarantees are not actually delivered. **Stage B is not
local-feature geometric verification** — it is a positionally-aligned 16×16 block-statistics
comparator (no keypoints, no descriptor matching, no homography, no RANSAC). **The native mobile
app can never produce a match** because it never sends the frame that Stage B requires, capping
every scan at band "low". **The embedding-version invariant is mechanically enforced but
semantically vacuous**: grid vectors are stamped `dinov2_vitb14 v1`, so the first real ML endpoint
configured will silently mix vector spaces — the exact Law-4 "total silent failure" the spec exists
to prevent. The near-duplicate upload gate is dead due to a dHash-vs-aHash column swap. Retrieval
does use pgvector HNSW correctly, and confidence banding is genuinely tiered with source-type-aware
thresholds. Production today runs the grid embedding, which docs correctly label demo-grade; it is
adequate for screen captures only and will not survive print/angle/lighting.

## Spec-compliance table

| # | Question | Verdict | Evidence |
|---|---|---|---|
| 1 | Stage B geometric verification (ORB+BFMatcher+RANSAC MVP) | **NON-COMPLIANT** | `packages/vision/src/verify.ts:19-112` — aligned block-grid gradient/energy agreement; no keypoints/homography/RANSAC. Test pair not visually similar (`test/recognition.test.ts:17-45`). |
| 2 | Embedding version invariant (§2.4) | **PARTIAL** | Column exists (`init.sql:76-78`); `/api/scan` rejects request mismatch (`scan/route.ts:51-58`); RPC filters rows (`match_rpc.sql:32-33`). But labels are constants that lie (F-03) → invariant cannot detect the failure it exists for. |
| 3 | Preprocessing parity catalog vs query | **PARTIAL** | Hash/verify path shares one `preprocess()` (`portal-image.ts:23`, `scan/route.ts:74`, `embed/query/route.ts:72`). Embedding path parity is by duplicated code, not shared (F-09), breaks silently if warm endpoint set (F-03), and EXIF handling diverges from `preprocess()` (F-08). |
| 4 | Tiered confidence bands (§6.3) | **PARTIAL (near-compliant)** | `packages/shared/src/contracts.ts:40-58` — high/medium/low, screen stricter than print, medium→rescan message (`capture-quality.ts:142-151`). Deviations: medium is AND not OR; print high floor 0.82 vs spec 0.90 (documented recalibration, contracts.ts:36-39). |
| 5 | pHash prefilter + ANN top-20 via HNSW | **PARTIAL** | HNSW index exists (`init.sql:156-158`); RPC `order by <=> limit 20` uses it (`match_rpc.sql:34-35`); no in-process scan of all rows. But the §6.2 pHash *prefilter* stage is absent (F-10) and per-candidate storage downloads negate the cheapness (F-06). |
| 6 | Grid fallback honesty | **PARTIAL** | Demo-grade by design (analysis in F-11). Docs say so (`docs/ENV_KEYS.md:24,30`, `DEPLOY.md:106`); in-app §6.4 honesty screens do not mention degraded matcher. |
| 7 | On-device query embedding (§2.3) | **NON-COMPLIANT** | Mobile embedder is a throwing stub, never called (`apps/mobile/lib/embedding.ts:20-34`); App.tsx posts the raw frame to server `/api/embed/query` (`App.tsx:52`); PWA likewise (`scan/page.tsx:117`). No ONNX-web/WASM. Spec §6.2 "POST vector NOT raw image" violated on both clients. |
| 8 | Near-duplicate collision check at upload (§6.1) | **NON-COMPLIANT (broken)** | Exists (`portal-image.ts:29-37`) but compares dHash to stored aHash → never fires (F-04). Also hash-based, not embedding-based as §6.1 specifies. |
| 9 | <1.5s scan latency (§11) | **NON-COMPLIANT (at risk)** | Up to 20 sequential storage downloads inside the verify loop, double frame upload, serial bookkeeping awaits (F-06). No cold model load (grid), but network structure alone can exceed budget. |

## P0 findings (V1-core missing/broken, silent-failure risk)

### F-01 · Stage B is a block-statistics proxy, not geometric verification
`packages/vision/src/verify.ts:19-112`. Algorithm: split both 256×256 preprocessed grayscale
buffers into an aligned 16×16 grid; per block compute mean gradient (gx, gy) and contrast energy;
"inlier" = block textured in both images AND gradient-orientation cosine > 0.62 AND energy
agreement > 0.6 **at the same grid position** (`verify.ts:107`). There are no keypoints, no
descriptors, no matching across positions, no homography estimation, no RANSAC — "inliers" is a
label on a translation/rotation/perspective-*intolerant* patch comparison. Spec §2.2 mandates
"ORB + BFMatcher + homography RANSAC, count inliers" as MVP and says "Stage B is not optional."
Failure scenarios: (a) real print scan at any camera angle → all blocks misalign (preprocess has
no perspective correction, see F-05) → 0 inliers → false negative on a *true* match; (b) two
different posters sharing a global layout (dark vignette, centered bright title) have correlated
per-position gradients → inliers accumulate → the semantic-collision false positive the gate must
defeat. The swap interface (`GeometricVerifier`) is genuinely clean; the shipped default does not
satisfy the spec's intent. `test/recognition.test.ts:86-142` does not prove §11's gate: posters A/B
(diagonal gradient + square vs vertical gradient + circle, `test:17-45`) are grossly different
compositions, not a "visually-similar-but-different" pair; the semantic collision is simulated only
in embedding space by giving both rows the same vector.

### F-02 · Native mobile scans are mathematically incapable of matching
`apps/mobile/App.tsx:66-78` posts `{embedding, phash, sourceType, source, devicePlatform,
model, version}` — **no `frameBase64`**. In `/api/scan` (`apps/web/app/api/scan/route.ts:73-75,
90-92`) a missing frame yields `structuralScore: 0, inliers: 0` for every candidate, so
`fused = 0.3·embSim + 0.15·hashSim ≤ 0.45`, below every medium floor (0.68–0.75) and with 0
inliers below every inlier floor (`contracts.ts:40-44`). Band is always "low", `matched` always
false. Every Expo-app scan fails with "capture again" regardless of image. Root enabler:
`ScanRequest.frameBase64` is optional (`packages/shared/src/contracts.ts:70`) — the V1-core Stage B
input can be silently omitted with no error, no log distinction (see F-16). The PWA sends the frame
(`scan/page.tsx:141`) and is unaffected.

### F-03 · Embedding-space labels lie: grid vectors stamped "dinov2_vitb14"; parity breaks silently when a real endpoint is configured
`packages/shared/src/contracts.ts:7` pins `EMBED_MODEL = "dinov2_vitb14"`. The grid provider
claims it (`apps/web/lib/embedding.ts:33-38`), and `persistPortalImage` stamps the constant while
ignoring `provider.model` entirely (`apps/web/lib/portal-image.ts:107-108`). Consequences:
(a) every catalog row says dinov2 v1 but contains a 16×16 RGB grid; (b) the query side
(`/api/embed/query/route.ts:74`) *always* computes the grid via `computeWebQueryEmbedding` — there
is no branch for `CATALOG_EMBED_ENDPOINT`, despite its own comment "when no warm catalog endpoint"
(`apps/web/lib/query-embedding.ts:4`). The moment production sets `CATALOG_EMBED_ENDPOINT` (the
documented upgrade, ENV_KEYS.md:24), new uploads embed with the real model, queries stay grid, both
carry identical model/version labels, the §2.4 checks in `scan/route.ts:51-58` and
`match_rpc.sql:32-33` all pass — and matching degrades to noise with **zero errors**: the exact
"total silent failure" Law 4 exists to prevent. The invariant is enforced syntactically and
defeated semantically. Fix shape: distinct model id for grid (e.g. `grid_16x16_rgb`), persist
`provider.model`, and make the query path select the same provider family as catalog or refuse.

### F-04 · Near-duplicate collision gate never fires (dHash compared to aHash)
`apps/web/lib/portal-image.ts`: insert writes `phash: dh` (a dHash) and `dhash: ah` (an aHash)
(lines 72-73) — the columns are semantically swapped. The collision check (lines 29-37) reads the
`dhash` column (aHash values) and computes `hashSimilarity(dh, e.dhash)` — Hamming distance between
two *different hash algorithms*, ≈ random ~0.5 similarity, never ≥ the 0.93 threshold. Even an
exact re-upload of an existing active portal image is not blocked. Acceptance gate §11 ("uploading
a near-duplicate of an existing active portal is blocked/flagged") fails; the §7 scan-hijack
defense is inoperative. Additionally §6.1 specifies an **embedding** collision check; this is
hash-only, and it fetches every active image row into process (unbounded scan) — but the
cross-algorithm bug is the P0. No test covers this path.

## P1 findings (correctness / performance)

### F-05 · No perspective correction in preprocessing
Spec §2.2/§6.2 pipeline includes "perspective correct". `packages/vision/src/preprocess.ts:10-30`
does EXIF-rotate → center-crop square → resize 256 → grayscale → normalize → 0.4px blur. Nothing
estimates or removes perspective anywhere in the repo. Combined with the alignment-dependent
verifier (F-01), any off-axis capture of print fails Stage B → systematic false negatives for the
primary physical use case.

### F-06 · Scan hot path cannot meet the <1.5s gate under real conditions
`apps/web/app/api/scan/route.ts:82-99`: for up to 20 candidates, a **sequential** `await
db.storage.from("portal-cache").download(...)` per candidate (65 KB each) — 20 network RTTs on the
hot path; `pipeline.ts:34` promises a cache ("cached") but none exists. Then serial awaited
bookkeeping before responding: `scan_events` insert (108), `portals` update (123),
`checkScanLimit`+usage RPC (134-140). Client side doubles the pain: the PWA uploads the same JPEG
frame twice (`scan/page.tsx:117-147`, embed then scan), and mobile does two sequential HTTP round
trips with a full-resolution 0.88-quality camera JPEG (`App.tsx:28,52,66`) — multi-MB uploads on
cellular. Fixes: parallelize downloads (`Promise.all`), cache candidate pixels in-memory/edge, fire
bookkeeping after response (`waitUntil`), single scan endpoint, client-side downscale.

### F-07 · Scan usage metering is dead code (RPC contract mismatch)
`match_fingerprints` returns only `portal_id, portal_image_id, title, slug, destination_domain,
similarity` (`supabase/migrations/20260519052523_match_rpc.sql:12-19`), but the scan route reads
`best?.c.owner_id` (`scan/route.ts:132`) — always `undefined` → `checkScanLimit` /
`increment_scan_usage` never execute, `usageBlocked` never true. Same bug in
`apps/web/app/api/hooks/scan/route.ts:128`. Plan limits on scans are silently unenforced; no error
is ever raised. Also `total_scans` is only incremented by the QR path (`p/[slug]/go/route.ts:46`)
— image-scan matches never count.

### F-08 · EXIF orientation divergence between embedding and hash/verify inputs
`preprocess()` honors EXIF (`preprocess.ts:11` `.rotate()`); the grid embedding paths do not
(`packages/vision/src/grid-embedding.ts:6-9`, `apps/web/lib/query-embedding.ts:8-11`). A phone JPEG
with EXIF orientation (the common case for `takePictureAsync`) embeds sideways while its
phash/verify pixels are upright, and vs an upright catalog image the query embedding is rotated 90°
→ Stage A recall collapses precisely on the mobile camera path. Silent, per-device.

### F-09 · Grid embedding implemented twice; drift risk on the one algorithm that must be identical
`packages/vision/src/grid-embedding.ts` (catalog) vs `apps/web/lib/query-embedding.ts` (query) are
copy-pasted near-twins that must stay bit-identical (Law 4). They already differ in edge behavior
(throw on dim mismatch vs pad-with-zeros-and-slice, grid-embedding.ts:31-33 vs
query-embedding.ts:33-34). One edit to one file = silent total failure. Must be a single exported
function.

### F-10 · pHash/dHash prefilter stage absent from scan path
Spec §2.2/§6.2: "pHash/dHash prefilter (cheap candidate narrowing)" → then ANN. `/api/scan` goes
straight to the ANN RPC (`scan/route.ts:64`); phash participates only as 0.15 of the fusion score
(line 95). No SQL or in-process prefilter exists (the RPC takes no hash argument,
`match_rpc.sql:6-11`).

### F-11 · Grid embedding failure modes (Q6 honest assessment)
`computeGridEmbedding` point-samples **256 single pixels** (no block averaging) of a
256px fit-inside resize, raw RGB/255, unnormalized. (a) All-positive vectors crowd the positive
orthant → cosine similarity between *any* two natural images is high → top-20 recall degrades as
the catalog grows; (b) zero invariance to crop/framing — catalog embeds the clean uploaded artwork,
query embeds the full camera frame including background; (c) point-sampling is maximally sensitive
to noise, moiré, glare, white balance, angle; (d) EXIF issue (F-08). Net: works for screen captures
and re-uploaded files; will not work for print, angle, or lighting variation. Production on
`CATALOG_EMBED_PROVIDER=grid` is running demo-grade matching. Communicated: yes in
`docs/ENV_KEYS.md:24,30` ("built-in demo matcher… not production-scale ML") and `DEPLOY.md:106`;
**not** communicated in-app (§6.4 no-match tips talk about glare/centering, not matcher capability).

## P2 findings (quality gaps)

- **F-12** `recognize()` in `packages/vision/src/pipeline.ts:38-104` is dead code — `/api/scan`
  and `/api/hooks/scan` re-implement the fusion loop inline; drift already exists (pipeline
  tie-breaks equal fused scores by inliers, `pipeline.ts:68`; routes don't, `scan/route.ts:97`).
  The tested code (`recognition.test.ts` exercises `recognize()`) is not the shipped code.
- **F-13** §11 semantic-collision acceptance unproven: no hard visually-similar pair (real image
  fixtures) in tests; verifier false-positive mode (same layout, different content) untested; no
  tests at all for `/api/scan`, preprocessing parity, EXIF, or the collision gate (which would have
  caught F-04).
- **F-14** Band deviations vs §6.3 table: medium requires score AND inliers
  (`contracts.ts:56-57`; spec says "0.70–0.90 OR inliers in mid range" — code is stricter, fine,
  but undocumented); print high floor 0.82 vs spec's 0.90 (documented as verifier-specific
  recalibration, `contracts.ts:36-39`). Screen stricter than print: implemented (0.90/8 vs
  0.82/7).
- **F-15** HNSW post-filter under-recall: `match_rpc.sql:28-35` filters model/version/status after
  the index ordering; with pgvector's default `ef_search=40`, once old-version or inactive rows
  accumulate (e.g. after the §2.4 re-embed migration), the RPC can return < 20 or zero candidates
  even though matches exist. Needs iterative scan config or version-partitioned index.
- **F-16** Observability lies: `match_method` logged as `embedding+structural-v1` even when no
  frame was sent and verification never ran (`scan/route.ts:114`) — masks F-02 in analytics;
  mobile hardcodes `devicePlatform: "ios"` on Android (`App.tsx:74`); hooks route logs
  `ip_hash: "webhook"` (`hooks/scan/route.ts:114`).
- **F-17** In-memory rate-limit `Map`s (`scan/route.ts:13`, `embed/query/route.ts:7`) are
  per-serverless-instance — §7's "hard rate-limit" resets on every cold start and doesn't span
  instances; no device-id component despite spec.

## P3 findings (upgrade opportunities)

- **F-18** The `GeometricVerifier` interface (`verify.ts:14-17`) is the right seam: ship ORB+RANSAC
  via opencv-wasm/opencv4nodejs behind it now (satisfies §2.2 MVP verbatim), then
  SuperPoint+LightGlue per §2.2 V2. Recalibrate `THRESHOLDS` inlier floors per verifier as
  contracts.ts:36-39 already anticipates.
- **F-19** Real embedding path per §2.1: SSCD or DINOv2 via warm endpoint for catalog + ONNX
  export on-device/ONNX-web for query (MANUAL Task 10 plug points already exist in
  `apps/mobile/lib/embedding.ts`). If grid must remain interim: mean-center + L2-normalize and
  average blocks instead of point-sampling — one-line-ish changes that materially improve cosine
  discrimination — and rename its model id (see F-03).

## Counts

| Severity | Count | IDs |
|---|---|---|
| P0 | 4 | F-01, F-02, F-03, F-04 |
| P1 | 7 | F-05 … F-11 |
| P2 | 6 | F-12 … F-17 |
| P3 | 2 | F-18, F-19 |

Test suite status: `pnpm test` 4/4 pass — but tests exercise the unused `recognize()` pipeline with
soft synthetic fixtures; passing tests do not certify the shipped scan route (F-02, F-04, F-12).
