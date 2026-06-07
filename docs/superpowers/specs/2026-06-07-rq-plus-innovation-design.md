# RQ Plus Innovation Design — Phase A + Phase B

**Date:** 2026-06-07  
**Production:** https://rub.pub  
**Supabase ref:** `duydupyyembdttmjvsxm`  
**Local port:** `3004`  
**Baseline:** `ca3badb` (security v1 applied, 6 Security Advisor warnings remain)

---

## Goals

1. **Phase A — Harden & ship:** Close remaining Security Advisor warnings, fix workshop API gaps, polish upload/scan UX, deploy.
2. **Phase B — Innovation:** Visual Workshop 2.0, Scan Snap motion UX, first-run onboarding, animated landing demo, optional OpenAI vision for workshop chat.

**Aesthetic:** Print studio meets scan lab — industrial/utilitarian. Syne + DM Sans, glow grid, existing CSS vars. No purple gradients, no Inter.

---

## Phase A — Security migration v2

**File:** `supabase/migrations/20260607190000_security_hardening_v2.sql`

| Warning | Fix |
|---------|-----|
| `handle_new_user()` executable by public/anon/authenticated | `REVOKE EXECUTE` from public, anon, authenticated (trigger-only; guarded with `IF EXISTS`) |
| `match_fingerprints(...)` executable by clients | `REVOKE` from public, anon, authenticated; `GRANT` to `service_role` only |
| `portal-images` bucket public | `UPDATE storage.buckets SET public = false`; drop `Public Select portal-images`; add owner-scoped SELECT policy |

**Image serving (unchanged path, verified):**

- Live portal images: `GET /api/images/[id]` (service role download)
- Workshop drafts: `GET /api/portals/[id]/image/draft?file=…` (owner auth + service role) — **new route**
- No direct Supabase public URLs in UI

**Expected Security Advisor:** 6 → 1–2 (vector extension warning remains; optional pgvector schema note)

---

## Phase A — Workshop API gaps

Two routes referenced by `PortalWorkshop.tsx` but missing from repo:

| Route | Method | Behavior |
|-------|--------|----------|
| `/api/portals/[id]/image/draft` | GET | Owner-only; `?file=` under `{ownerId}/{portalId}/`; streams JPEG from `portal-images` via service role |
| `/api/portals/[id]/image/approve` | POST | Body `{ useEnhanced?: boolean }`; loads workshop state; picks enhanced or first reference; calls `persistPortalImage({ activatePortal: true })`; returns success message |

---

## Phase A — Workshop UX fixes

Enhance `PortalWorkshop.tsx` (no full rewrite):

- Persistent upload progress bar + status text during multipart upload
- Mobile: `capture="environment"` prominent; auto-focus upload on narrow viewports
- Clear error/success banners (existing pattern, strengthened)
- Split layout prep for Phase B slider (refs strip | preview | chat)

---

## Phase B — Visual Workshop 2.0

**Component:** `PortalWorkshop.tsx` + `globals.css`

### Layout (desktop ≥900px)

```
┌─────────────┬──────────────────────┬─────────────┐
│ References  │  Before/after slider │ Workshop    │
│ strip       │  + Approve CTA       │ chat panel  │
│ (vertical)  │  (enhanced preview)  │             │
└─────────────┴──────────────────────┴─────────────┘
```

### Before/after slider

- Compares first reference (before) vs enhanced output (after)
- Range input 0–100%; CSS clip on after image
- Hidden when no enhanced preview yet

### Approve CTA

- Full-width primary on mobile; `ip-workshop-approve-pulse` success animation after approve
- Checkbox: “Use enhanced version when going live” (existing)

### Chat

- Existing `/api/portals/[id]/workshop` chat action
- When `OPENAI_API_KEY` set: optional vision — server downloads primary reference, sends base64 to OpenAI for creative feedback

---

## Phase B — Scan Snap

**File:** `apps/web/app/scan/page.tsx` + `globals.css`

| Change | Detail |
|--------|--------|
| Single Capture | Keep one-shot capture (no continuous loop) — already implemented |
| Mobile camera-first | Auto-start `getUserMedia` on mount when `(max-width: 768px)` |
| Match result card | Inline card: portal title, domain, Open link — enhance with motion |
| Scan → Match → Open motion | CSS keyframes on overlay badge + result card entrance (`ip-scan-motion-*`) |

---

## Phase B — First-run onboarding

**Component:** `OnboardingStrip.tsx` → wizard variant

- **Trigger:** Dashboard visit when `localStorage.getItem('ip_onboarding_done') !== '1'`
- **Steps (3):** Create portal → Upload visual → Test scan on phone
- **Dismiss:** “Got it” sets `ip_onboarding_done=1`
- **No QR product codes** in copy
- Show for all dashboard users until dismissed (not only empty portal list)

---

## Phase B — Landing hero demo

**Component:** `ScanDemo.tsx`

- Animated **Scan → Match → Open** strip: active step cycles every 2.5s (CSS)
- `UseCaseDemo` continues auto-advance on bundled `posters-flyers` assets (offline-capable)
- Flow labels sync with demo step indices 5–6 (Scan/Open) where possible

---

## AI layer

### Workshop vision (`lib/assistant.ts`)

- New `workshopAssistantReply(message, refCount, history, { referenceImageBase64? })`
- When `OPENAI_API_KEY` + base64 present: multimodal Chat Completions (`gpt-4o-mini` default)
- Workshop route downloads primary reference before chat when refs exist
- Fallback unchanged when key absent or vision fails

### Help chat

- Unchanged: `/api/help/chat` + `helpAssistantReply` + rule fallback

### Documentation

- `ENV_KEYS.md`: note vision uses same `OPENAI_API_KEY`; optional `OPENAI_MODEL`

---

## Out of scope

- QR codes as product feature
- Native iOS/Android apps
- Voice memo transcription 54–57
- Output SDK eval suite
- Stripe live billing (user keys)

---

## Deploy & verification

1. `pnpm --filter @ip/web typecheck && pnpm --filter @ip/web build`
2. Commit + push `image-portal` `main`
3. Bump parent RQ submodule pointer
4. `vercel deploy --prod` if CLI authenticated
5. User applies `20260607190000_security_hardening_v2.sql` via SQL Editor (see USER_SETUP.md)
6. Manual E2E per `E2E_CHECKLIST.md`

---

## Success criteria

- [ ] Spec committed (this file)
- [ ] Security v2 migration committed
- [ ] Draft + approve API routes working
- [ ] Workshop 2.0 layout + before/after slider + approve animation
- [ ] Scan Snap motion + mobile auto-camera
- [ ] Onboarding wizard with localStorage
- [ ] ScanDemo animated flow strip
- [ ] Workshop vision when OpenAI key set
- [ ] Build + typecheck pass
- [ ] Pushed to origin/main; RQ submodule updated
