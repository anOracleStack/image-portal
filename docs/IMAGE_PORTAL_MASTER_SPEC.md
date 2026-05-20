# IMAGE PORTAL — MASTER SPEC (CANONICAL)

> METHOD MOIRAI · Stage 3 EUNOIA Pre-Final Master · delivered to Oracle for canonization
> Supersedes: RQ_Claude_2. Reconciles all six prior documents. This file is the single
> source of truth. If any other doc disagrees with this one, this one wins.

---

## 0. ONE-LINE NORTH STAR

Image Portal lets anyone turn any image into a programmable, owner-controlled doorway.
The image is the key, not the destination. The destination can change forever; the
printed image never does.

---

## 1. PLATFORM TRUTH (NON-NEGOTIABLE)

- Native iPhone/Android cameras cannot scan arbitrary user images as private links.
  Native cameras decode standardized math locally (QR, barcode, App Clip Code, NFC).
  They do not query your database.
- Therefore the product is hybrid by design:
  - **Native Expo scanner** — full magic.
  - **PWA scanner** — no-download entry.
  - **QR / short-link fallback** — native-camera compatibility.
- This is not a weakness to hide. It is shipped in-product as honest guidance.

---

## 2. THE THREE TRUTHS THAT WERE STILL UNRESOLVED (EUNOIA CORRECTIONS)

### 2.1 The embedding was wrong (R1 — highest leverage)

All six prior drafts defaulted to **CLIP**. CLIP encodes *semantic* similarity:
"a person in neon light" maps near "a different person in neon light." This product
must answer **"is this the SAME image"** — an instance / near-duplicate retrieval
problem. CLIP false-positives scale with portal count.

**Canonical decision:** primary embedding is a **copy-detection / self-supervised
instance-retrieval model**:

- **Default:** SSCD (self-supervised copy-detection descriptor) OR DINOv2 ViT
  global features. Both are built for "same image under photographic distortion."
- CLIP is permitted only as an optional *secondary* semantic signal for fuzzy
  discovery features later. It is never the primary matcher.

### 2.2 Verification cannot wait for V2 (R2)

Embedding ANN alone returns *something* for every frame. Nearest-neighbor is a
recall stage, not a decision. A geometric verification gate is what makes this a
product instead of a demo.

**Canonical pipeline — two-stage retrieve-then-verify (V1 CORE):**

```
SCAN FRAME
  -> preprocess (brightness norm -> perspective correct -> deblur -> center crop)
  -> pHash/dHash prefilter (cheap candidate narrowing)
  -> STAGE A: copy-detection embedding -> pgvector HNSW ANN -> top-K = 20
  -> STAGE B: local-feature geometric verification on top-K
        MVP : ORB + BFMatcher + homography RANSAC, count inliers
        V2  : SuperPoint + LightGlue (upgrade, same interface)
  -> confidence = f(embedding distance, inlier count, inlier ratio)
  -> tiered band decision (see 6.3)
```

Stage B is **not optional** in V1. ORB is light enough to ship now.

### 2.3 The cold-start hot path was unaddressed (R3)

A managed embedding API (Replicate/Together) on the *scan* path adds cold starts
and a network round-trip to the one moment latency is fatal.

**Canonical decision — split the embedding by lifecycle:**

| Path | When | Where | Latency budget |
|---|---|---|---|
| Catalog embedding | On upload | Any managed API or batch job | Tolerant (seconds OK) |
| Query embedding | On scan | **On-device** (Expo: ONNX / ExecuTorch / TFLite) | Hard real-time |

On-device query embedding is *simpler* than running a Python vision server **and**
removes the single largest latency + ops risk. PWA fallback: ONNX-web/WASM or a
warm dedicated endpoint with min-replicas. There is **no Python FastAPI service at
MVP**.

### 2.4 The invariant that silently kills everything (R4)

Query and catalog embeddings MUST be produced by the **same model** with
**identical preprocessing**. A mismatch produces total silent failure with no
error. Enforced by:

- One model id, pinned, both sides.
- `embedding_version` column on every fingerprint row.
- `/api/scan` rejects any catalog row whose `embedding_version` != active version.
- Model change ⇒ scheduled re-embed job before cutover. Never hot-swap.

---

## 3. WHAT WAS REVERTED, CONFIRMED, AND KILLED

| Item | Source of error | Final ruling |
|---|---|---|
| 16:9 / 9:16 aspect lock | Gemini 1 + Gemini 2 reinstated | **KILLED.** Quality score only. Posters/covers/cards/murals all differ. |
| transformers.js CLIP in edge fn | Gemini 2 | **KILLED.** Model size blows edge memory/cold start. |
| Python FastAPI at MVP | ChatGPT 2 retained | **KILLED at MVP.** On-device query + managed catalog. Reintroduce only at scale. |
| AWS Rekognition as brain | Gemini 1 | **KILLED.** Label/object detector, not instance router. |
| Vuforia as default | Gemini 1 / ChatGPT 1 | **KILLED at MVP.** Enterprise/AR path, V3+. |
| Auto-open URL on scan | Gemini 1 WebView | **KILLED.** Result card + destination domain + tap-to-open. Auto-open = later opt-in setting only. |
| Continuous video to backend | Gemini 1 | **KILLED.** Throttled capture 800–1500ms or tap-to-scan. |
| MindAR as cloud engine | Gemini 2 over-credit | **REVISED.** MindAR = bounded compiled campaign packs + AR feel only. Cloud recognition path is server retrieve-then-verify, identical for native & PWA. |
| Steganographic watermark in MVP | conflated everywhere | **DEFERRED to V3.** |
| Cosmetic "NoK\|OfF / IMAGE PORTAL" mark | Gemini 2 pushed as core | **CONFIRMED as V1 export option only** — creator-controlled, cosmetic, never functional. |
| CLIP as primary matcher | all six | **REVISED to copy-detection embedding.** |
| Geometric verification | parked at V2 | **PROMOTED to V1 core.** |

---

## 4. FINAL STACK

| Layer | Choice |
|---|---|
| Web dashboard | Next.js App Router, TypeScript, Tailwind |
| Web API | Next.js Route Handlers |
| Mobile | Expo React Native, expo-camera |
| On-device embedding | ONNX Runtime React Native / ExecuTorch / TFLite (pinned model) |
| PWA scanner | Next.js PWA, getUserMedia throttled capture, ONNX-web fallback |
| Campaign AR (optional) | MindAR, bounded `.mind` packs only |
| Auth / DB / Storage | Supabase Auth, Postgres, Storage, RLS |
| Vector search | pgvector, HNSW index, cosine ops |
| Catalog embedding | Together.ai (predictable) or warm dedicated endpoint; Replicate only for batch |
| Verification | ORB+RANSAC (MVP) → SuperPoint+LightGlue (V2) |
| Hosting | Vercel (web/API) + Expo EAS (mobile) |

---

## 5. CANONICAL DATA MODEL (authoritative — see schema.sql)

- `profiles` — id, handle, display_name, avatar_url, website_url, created_at, updated_at
- `portals` — id, owner_id, title, slug, destination_url, status, scan_mode,
  visibility, total_scans, last_scanned_at, created_at, updated_at
- `portal_images` — id, portal_id, owner_id, storage_path, public_url, width,
  height, file_size, mime_type, sha256, phash, dhash, quality_score, created_at
- `portal_fingerprints` — id, portal_id, portal_image_id, phash, dhash,
  **embedding vector(N)**, **embedding_model**, **embedding_version**, created_at
- `scan_events` — id, portal_id, matched, confidence, match_method,
  embedding_distance, inlier_count, device_platform, source, source_type,
  ip_hash, opened_url, created_at
- `portal_exports` — id, portal_id, export_type, file_url, created_at
- `abuse_reports` — id, portal_id, reporter_id, reason, details, status, created_at
- `takedowns` — id, portal_id, claimant_id, claim_type, evidence_url, status,
  created_at  *(ownership/DMCA/trademark dispute path)*

`vector(N)`: N is fixed to the chosen model (e.g., 768 DINOv2, 512 SSCD). Pinned.

---

## 6. RECOGNITION CONTRACT

### 6.1 Upload
validate MIME + size → normalize → SHA256 (dedup) → pHash/dHash → quality score →
**near-duplicate collision check** (embedding vs active portals; block/flag if a
near-identical active portal exists — scan-hijack defense) → catalog embedding
(managed/batch) → persist with embedding_model + embedding_version.

### 6.2 Scan
on-device preprocess → on-device query embedding → POST vector (NOT raw image
where possible) + pHash → server prefilter → ANN top-20 → ORB verify → confidence
→ band decision → log scan_event (ip hashed).

### 6.3 Tiered confidence (binary is forbidden)
| Band | Condition | Action |
|---|---|---|
| High | conf > 0.90 AND inliers ≥ T_high | Confirm — show result card |
| Medium | 0.70–0.90 OR inliers in mid range | "Possible match — rescan" |
| Low | < 0.70 | No match — show tips |

`source_type` ∈ {screen, print, unknown}. Screen scans use a stricter band than
print (print tolerates lighting/perspective drift; screen should be near-exact).

### 6.4 Honest scope (shipped in-app)
V1 reliably handles: screen captures, clean frontal print, decent lighting.
Hard angle / occlusion / glare → "rescan" guidance until LightGlue lands. State
this in the no-match screen tips. Truth-first.

---

## 7. SECURITY SURFACE (ADDITIONS BEYOND CLAUDE 2)

- URL scheme allowlist: https only (http only in dev). Reject javascript:, data:,
  file:, localhost, 127.0.0.1, private/link-local IP ranges, malformed.
- Open-redirect & homograph guard: reject/flag destinations that are themselves
  open redirectors; punycode-decode and flag mixed-script/lookalike domains.
- Safe Browsing check on destination at set-time and on a periodic re-check job;
  auto-suspend on positive.
- No server-side fetch of destination on the hot path. If unfurling metadata
  later: domain allowlist + IP-pin + refuse redirects into private ranges (SSRF).
- `/api/scan` is unauthenticated by design → hard rate-limit by IP + device id;
  fingerprints/embeddings are NEVER client-selectable (RLS + scan is the only
  read path); never return inactive/suspended portals.
- Near-duplicate collision block at upload (6.1) prevents scan hijacking.
- scan_events: store `ip_hash` not raw IP; set retention; CCPA posture (operator
  in California) — document data handling, support deletion requests.
- `takedowns` table + workflow: first-claim-wins but disputable; DMCA/trademark
  path; owner notification; auto-suspend pending review on credible claim.
- Never expose service role key to clients. Zod-validate every input.

---

## 8. EXPORT MODES (V1)

1. Image only — for app/PWA magic.
2. Image + corner QR → `/p/[slug]` — native-camera compatibility.
3. Poster template with QR + scan instructions — physical deployment.
   Optional cosmetic "NoK\|OfF / IMAGE PORTAL" mark, creator toggle, never functional.

---

## 9. MONOREPO

```
apps/web        Next.js dashboard + API routes + PWA scanner
apps/mobile     Expo RN scanner (on-device embedding)
packages/shared types, Zod schemas, constants, confidence bands
packages/vision pHash/dHash, quality score, preprocessing, ORB verify, ANN client
supabase        migrations, RLS, pgvector HNSW
docs            this spec + ADRs
```

---

## 10. BUILD SEQUENCE (LOCKED — see MANUAL.md for task prompts)

1. Monorepo scaffold + pnpm workspaces + TS/ESLint/Prettier
2. Supabase schema + RLS + pgvector HNSW + storage buckets
3. Web auth (login/signup/profile autocreate, protected layout)
4. Portal CRUD (create/edit/delete/toggle, slug gen)
5. Image upload → preprocess → SHA256/pHash/dHash → quality → collision check →
   catalog embedding → persist (embedding_model + version)
6. `/p/[slug]` redirect + URL safety + Safe Browsing hook
7. QR fallback generator + three export modes
8. `packages/vision`: preprocessing + ORB verify + confidence banding
9. `/api/scan`: prefilter → ANN top-20 → ORB verify → bands → log (rate-limited)
10. Expo scanner: permissions, throttled capture, **on-device embedding**,
    result card, no-match tips, report
11. PWA scanner: getUserMedia throttled + ONNX-web embedding fallback
12. Analytics dashboard (scans over time, matched vs QR, confidence dist.)
13. Security pass: rate limits, homograph/open-redirect guard, SSRF posture,
    abuse + takedown workflow, ip hashing/retention
14. (V2) SuperPoint+LightGlue verification swap; MindAR campaign packs

---

## 11. ACCEPTANCE GATES (definition of done per phase)

- A clean screen capture of a registered image returns High band with the correct
  portal in < 1.5s end-to-end on a mid-tier phone.
- Two visually-similar-but-different posters do NOT cross-match (verification gate
  proven with a deliberate semantic-collision test pair).
- Uploading a near-duplicate of an existing active portal is blocked/flagged.
- A `javascript:` / private-IP / punycode-lookalike destination is rejected.
- Embedding model swap path: re-embed job runs, version flips atomically, no
  mixed-version reads.
