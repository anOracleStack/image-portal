# IMAGE PORTAL — monorepo

Built & proven by Eunoia (METHOD MOIRAI Stage 3). Canonical authority:
`docs/IMAGE_PORTAL_MASTER_SPEC.md`. Operating rules: `.cursorrules`.
Build playbook: `docs/MANUAL.md`.

## What is already done (real, compiling, tested)

- `packages/shared` — Zod contracts, confidence bands, URL-safety (scheme
  allowlist, private-IP, punycode/homograph, open-redirect). Strict typecheck ✅
- `packages/vision` — preprocessing (sharp), dHash/aHash, the **two-stage
  retrieve-then-verify pipeline**, energy-gated structural verifier, in-memory
  vector index. Strict typecheck ✅ · 4/4 acceptance tests ✅
  - **Thesis proven in code:** an embedding-close-but-different image is
    REJECTED by the verify stage (the CLIP failure mode is defeated).
- `apps/web` — Next.js: `/api/scan` (retrieve→verify→band→log, rate-limited,
  ip-hashed), `/p/[slug]` (URL-safety gate + interstitial), image upload
  (hash + near-dup collision block + catalog embed + persist), Supabase
  clients, embedding provider interface, minimal dashboard.
- `apps/mobile` — Expo scanner: throttled capture, on-device embedding plug
  point, result card with destination domain + explicit tap-to-open.
- `supabase/0001_init.sql` + `0002_match_rpc.sql` — schema, RLS, HNSW,
  SECURITY DEFINER match RPC, scan counter.

Run the proof yourself: `pnpm install && pnpm --filter @ip/vision test`

## What ONLY YOU can do (irreducible — accounts, secrets, devices)

1. Create the Supabase project (cannot be done on your behalf).
2. Run `supabase/0001_init.sql` then `0002_match_rpc.sql`. Create buckets:
   `portal-images`, `portal-cache`, `portal-exports`, `avatars`.
3. Put real keys in `apps/web/.env` (copy `.env.example`). Service-role key
   is server-only — never in the mobile bundle.
4. Canonize the pinned embedding model (DINOv2 ViT-B/14 768 default is set &
   swappable until catalog data exists). Stand up a warm endpoint serving it;
   set `CATALOG_EMBED_ENDPOINT` + key.
5. Bundle the SAME model's on-device export (ONNX/ExecuTorch/TFLite) into
   `apps/mobile` — see `MANUAL.md` TASK 10. Until then the embedder throws by
   design (no fake recognition).
6. `eas build` for device testing (needs your Expo/Apple/Google accounts).
7. Deploy web to Vercel (needs your account).

Everything else — remaining UI, analytics, exports, V2 verifier swap — is
sequenced Claude Code work in `docs/MANUAL.md`, run in your environment.
