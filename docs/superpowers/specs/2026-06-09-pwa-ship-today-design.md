# PWA Ship-Today Design — Approach 1

**Date:** 2026-06-09  
**Scope:** Ship viewer scan loop at `https://rub.pub/scan` today (browser + Add to Home Screen). No App Store, no Google OAuth for viewers.

## Decision

**Approach 1:** Wire the missing server embed endpoint, add PWA manifest icons, verify production env, run T-090 phone E2E. Defer Google OAuth (T-003/T-004), warm ML embed endpoint, native app, and audio memo work.

## What already worked

| Layer | Status |
|-------|--------|
| `/scan` UI | Camera, quality gate, Scan→Match→Open strip, result card |
| `/api/scan` | Two-stage retrieve + verify, rate limit |
| Catalog embed | `CATALOG_EMBED_PROVIDER=grid` on upload |
| PWA manifest | `start_url: /scan`, `display: standalone` |
| Production | T-001/T-002 done (2026-06-08) |

## Blocker fixed

`POST /api/embed/query` was missing. The PWA sends a JPEG frame (`frameBase64` JSON or multipart `file` from mobile); the route returns `{ embedding, phash, embeddingModel, embeddingVersion }` using `computeWebQueryEmbedding` + `preprocess`/`dhash`.

## PWA install

Manifest now includes 192×512 PNG icons under `/icons/` for Chrome install prompt eligibility.

## Out of scope (today)

- Google OAuth (creators can use email signup)
- Warm catalog ML endpoint
- Native Expo app store build
- Audio transcript tasks T-010–T-016

## User verification (T-090)

1. Confirm Vercel env: `CATALOG_EMBED_PROVIDER=grid`, Supabase keys, `IP_HASH_SALT`.
2. Deploy latest `main`.
3. Creator: sign up → create portal → upload/export image.
4. Viewer phone: open `https://rub.pub/scan` → capture same image → confirm URL popup.
5. Optional: Add to Home Screen → repeat scan from installed PWA.
