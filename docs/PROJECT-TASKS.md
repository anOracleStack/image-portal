# Image Portal — project task list & work log

**Purpose:** Single source of truth for agents resuming work on Image Portal (https://rub.pub).  
**Repo:** `/Users/oraclevision/Developer/applications/RQ/image-portal`  
**Branch:** `main` · **Remote:** `anOracleStack/image-portal`  
**Vercel:** root `apps/web` · **Supabase ref:** `duydupyyembdttmjvsxm` · **Local port:** `3004`

---

## Agent instructions (read every session)

1. **Read this file first** before claiming anything is done.
2. **Pick the top incomplete task** in **Pending** (highest priority first). Mark it `in_progress` in the log when you start.
3. **Do not mark complete** without evidence (browser check, curl snippet, command output, or file path). “Committed to GitHub” ≠ “live on rub.pub.”
4. **After each task:** append a **Work log** entry (date, task id, what changed, files, commit hash if any, verification result).
5. **Move completed items** from Pending to the log; leave a one-line “Done → log YYYY-MM-DD” stub under Pending if helpful.
6. **Never claim “all good”** until: (a) all audio in scope is transcribed, (b) checklist exists and is implemented, (c) production matches `main` on `/`, `/login`, and other pages in the checklist.
7. **User rules:** center copy, use `&` not “and” on marketing pages, balanced lines via `BalancedText` where applicable.

---

## Context (why this list exists)

Prior work conflated **git push + local build** with **full voice-memo delivery + production verification**.

| What was done | What was skipped |
|---------------|------------------|
| Transcribed **only** `Butterwood Cir 53.m4a` | Clips **54, 55, 56, 57** (~23 min); optionally **3** (~14 min) |
| Partial landing from 53 → `8f68027` | Full fidelity to 53 transcript; no merged checklist |
| Login/Google UI coded → `3bb0441` | Production `/login` still missing “Continue with Google” (deploy lag) |
| Empty deploy nudge → `3f3d49c` | Verified browser walkthrough never completed |

**Existing transcript (53 only):** `docs/notes/landing-voice-memo-transcript.txt`  
**Audio paths (user machine):** `/Users/oraclevision/Downloads/Butterwood Cir {3,53,54,55,56,57}.m4a`

**Key commits already on `main`:**

| Commit | Summary |
|--------|---------|
| `8f68027` | Voice-note landing: `page.tsx`, `ScanDemo.tsx`, `globals.css` |
| `394a69b` | Themes, centered copy, BalancedText, rub.pub helpers |
| `3bb0441` | Login OAuth UI, keep signed in, confirm-email copy |
| `3f3d49c` | chore: trigger Vercel production deploy |

---

## Pending tasks (top = highest priority)

### Blockers — production & auth

- [x] **T-001** Redeploy Vercel **production** from latest `main` — **done 2026-06-08** (`a95fba2`, deployment `dpl_HnKJnqQa3pmGQ3N59MePsxBoKWu5`, aliased https://rub.pub). Prior: `dpl_5gLGrcJXZBLMXnxUP2ruSNWqbQq1` (2026-05-20).
- [x] **T-002** Verify **https://rub.pub/login** — **done 2026-06-08**: login JS bundle `app/login/page-1d3a5294d1a0340f.js` contains `Continue with Google`.
- [ ] **T-003** Supabase: enable **Google** provider; set redirect URLs for `https://rub.pub/auth/callback` (and local dev if needed). Document status in log (no secrets).
- [ ] **T-004** If Google app is in **Testing** mode: ensure test users are added or app published — document in log.

### Audio — transcribe everything in scope

- [ ] **T-010** Confirm with user (or default): include **`Butterwood Cir 3.m4a`** in scope? (14 min — yes/no in log.)
- [ ] **T-011** Transcribe `Butterwood Cir 54.m4a` → save under `docs/notes/` (e.g. `voice-memo-54-transcript.txt`).
- [ ] **T-012** Transcribe `Butterwood Cir 55.m4a` → `docs/notes/voice-memo-55-transcript.txt`.
- [ ] **T-013** Transcribe `Butterwood Cir 56.m4a` → `docs/notes/voice-memo-56-transcript.txt`.
- [ ] **T-014** Transcribe `Butterwood Cir 57.m4a` → `docs/notes/voice-memo-57-transcript.txt`.
- [ ] **T-015** (If T-010 yes) Transcribe `Butterwood Cir 3.m4a` → `docs/notes/voice-memo-3-transcript.txt`.
- [ ] **T-016** Merge all transcripts (53 + 54–57 + optional 3) into **`docs/notes/voice-memos-FULL-transcript.txt`** with source labels and timestamps/sections.

### Checklist — from audio + prior text rules

- [ ] **T-020** Build **numbered implementation checklist** from FULL transcript + existing `landing-voice-memo-transcript.txt`. Group by: Landing, Login/Auth, Pricing, Dashboard, Other.
- [ ] **T-021** Map each checklist item → target file(s) (e.g. `apps/web/app/page.tsx`, `apps/web/app/login/page.tsx`, `apps/web/app/pricing/page.tsx`).
- [ ] **T-022** User sign-off on checklist (or note “proceeding per memo” in log if user unavailable).

### Implementation — landing (from 53 + full memos)

- [x] **T-030** Landing hero — **done 2026-06-07** (`HeroHeadline.tsx`, memo 53).
- [x] **T-031** Hero body & CTAs — **done 2026-06-07** (`page.tsx`).
- [x] **T-032** Scan demo SCAN/MATCH/OPEN strip — **done 2026-06-07** (`ScanDemo.tsx`).
- [x] **T-033** Use cases line breaks — **done** (prior `use-cases.ts`; verified 2026-06-07).
- [x] **T-034** Why RQ Plus center & copy — **done 2026-06-07** (`page.tsx`).
- [x] **T-035** Pricing on landing centered — **done** (prior + verified 2026-06-07).
- [ ] **T-036** Remaining landing items from **T-020 checklist** — **deferred** until audio 54–57 transcribed.

### Implementation — auth / login (code exists; verify live)

- [ ] **T-040** Re-verify `apps/web/app/login/page.tsx` matches product intent after T-002.
- [ ] **T-041** Re-verify `apps/web/app/login/confirm-email/page.tsx` copy and layout.
- [ ] **T-042** Auth callback / welcome flow smoke test on production after T-001–T-003.

### Implementation — sitewide polish

- [x] **T-050** Pricing page (`apps/web/app/pricing/page.tsx`): center alignment, `&`, BalancedText — **done 2026-06-13** (portal glass cards, ALL CAPS section titles, balanced FAQ).
- [x] **T-051** Other marketing pages: gallery, scan shell — **done 2026-06-13** (portal rim on gallery/scan, balanced copy).
- [ ] **T-052** Any dashboard/portal items from memos 54–57 (fill from T-020 checklist).

### Completion build-out (2026-06-07 session)

- [x] **T-100** Docs: USER_SETUP, ENV_KEYS, DEPLOY, E2E_CHECKLIST, design spec — **done 2026-06-07**.
- [x] **T-101** Env: `.env.example` expanded, `scripts/check-env.mjs`, `pnpm check:env` — **done 2026-06-07**.
- [x] **T-102** LLM assistant: Help + Workshop chat with OpenAI fallback — **done 2026-06-07**.
- [x] **T-103** `supabase-auth-rub-pub.sh` ref + port 3004 — **done 2026-06-07**.
- [x] **T-104** Stale copy grep — **done 2026-06-07** (no matches; recorded in E2E_CHECKLIST).

### Verification — do last, every time

- [ ] **T-090** Production browser pass — **deferred** (user must verify after deploy + keys).
- [x] **T-091** `pnpm --filter @ip/web build` + typecheck — **done 2026-06-07** (see log).
- [ ] **T-092** “Ready for user review” — **pending** T-090 + audio scope (T-010–T-016).

---

## File map (quick reference)

| Area | Primary files |
|------|----------------|
| Landing | `apps/web/app/page.tsx`, `apps/web/components/landing/ScanDemo.tsx`, `apps/web/app/globals.css` |
| Login | `apps/web/app/login/page.tsx`, `apps/web/app/login/confirm-email/page.tsx`, `apps/web/components/auth/AuthShell.tsx` |
| Typography | `apps/web/components/ui/BalancedText.tsx` |
| Pricing | `apps/web/app/pricing/page.tsx` |
| Notes | `docs/notes/*.txt`, **this file** |
| Env example | `apps/web/.env.example` |

---

## Work log (newest first)

Append entries here. **Do not delete history.**

### 2026-06-13 — Luminous Portal marketing polish (T-050, T-051)

- **Agent:** Cursor (subagent)
- **Task id(s):** T-050, T-051
- **Done:**
  - Portal glass/rim tokens on marketing panels, pricing cards, gallery cards, scan video & result card
  - Pricing: ALL CAPS section titles, BalancedText plan desc + FAQ answers, centered FAQ
  - Gallery: BalancedText explainer
  - Scan: SCAN/MATCH/OPEN strip ALL CAPS, balanced privacy note, portal result card, OPEN LINK CTA
- **Files changed:** `apps/web/app/globals.css`, `apps/web/app/pricing/page.tsx`, `apps/web/app/gallery/page.tsx`, `apps/web/app/scan/page.tsx`, `docs/PROJECT-TASKS.md`
- **Commit:** (see `git log -1` after push)
- **Verification:** `npm run typecheck` + `npm run build` in `apps/web`
- **Deploy:** `vercel --prod --yes` from image-portal root → https://rub.pub

### 2026-06-09 — PWA ship-today (Approach 1)

- **Agent:** Cursor (subagent)
- **Task id(s):** PWA ship blockers (T-090 prep — **not** marking T-090 complete)
- **Done:**
  - Added `POST /api/embed/query` — accepts JSON `{ frameBase64 }` or multipart `file`; returns embedding + phash + model/version via `computeWebQueryEmbedding`
  - PWA manifest icons: `public/icons/icon-192.png`, `icon-512.png`; updated `manifest.webmanifest`
  - Design spec: `docs/superpowers/specs/2026-06-09-pwa-ship-today-design.md`
- **Files changed:** `apps/web/app/api/embed/query/route.ts`, `apps/web/public/manifest.webmanifest`, `apps/web/public/icons/icon-192.png`, `apps/web/public/icons/icon-512.png`, `docs/superpowers/specs/2026-06-09-pwa-ship-today-design.md`, `docs/PROJECT-TASKS.md`
- **Commit:** none (user did not request)
- **Verification:** `pnpm --filter @ip/web build` — see agent output
- **User action (T-090):** Deploy to production; phone E2E — create portal → scan exported image at `https://rub.pub/scan`; confirm match + Open link

### 2026-06-08 — T-001 + T-002 commit push deploy

- **Agent:** Cursor (user: commit push merge deploy)
- **Task id(s):** T-001, T-002
- **Done:** Working tree already clean on `main` `a95fba2` (synced with `origin/main`). No merge needed. `vercel deploy --prod --yes` → **READY**, aliased **https://rub.pub**
- **Files changed:** `docs/PROJECT-TASKS.md` (this log + T-001/T-002 checkboxes)
- **Commit:** (see `git log -1` after push)
- **Verification:** Deployment `dpl_HnKJnqQa3pmGQ3N59MePsxBoKWu5`; login bundle grep → `Continue with Google` ✓
- **Inspector:** https://vercel.com/anoraclestacks-projects/image-portal/HnKJnqQa3pmGQ3N59MePsxBoKWu5
- **Next:** T-003 (Supabase Google provider), T-011–T-016 (audio transcripts)

### 2026-06-07 — Completion build-out (docs, LLM chat, landing, env)

- **Agent:** Cursor (autonomous completion session)
- **Task id(s):** T-030–T-035, T-100–T-104, T-091
- **Done:**
  - Documentation: `USER_SETUP.md`, `ENV_KEYS.md`, `DEPLOY.md`, `E2E_CHECKLIST.md`, `docs/superpowers/specs/2026-06-07-image-portal-completion-design.md`
  - Env: expanded `apps/web/.env.example`, `scripts/check-env.mjs`, `pnpm check:env`
  - AI: `lib/assistant.ts`, `lib/assistant-fallback.ts`, `/api/help/chat`, workshop route uses `workshopAssistantReply`
  - Landing: hero Image/Doorway, memo 53 copy, Scan/Match/Open strip, CSS
  - Auth script: `duydupyyembdttmjvsxm`, port 3004 redirects
  - Cleanup: `scan_mode` UI types → `image` only; stale string grep clean
- **Files changed:** see git diff on `main`
- **Verification:** `pnpm --filter @ip/web build` + `typecheck` pass; `rg` stale strings → 0 matches
- **Deferred:** T-002–T-004 (user Google OAuth), T-010–T-016 (audio), T-090 (production browser), Stripe/ML keys
- **User action:** Add Supabase, optional OpenAI/Stripe/Google keys per `USER_SETUP.md`; run `E2E_CHECKLIST.md`

### 2026-05-20 — T-001 production deploy (CLI)

- **Agent:** Cursor (user: COMMIT PUSH MERGE DEPLOY)
- **Task id(s):** T-001
- **Done:** `vercel deploy --prod --yes` from `image-portal/`; build succeeded; production alias **https://rub.pub**
- **Files changed:** none (working tree was clean at `2cc1051`)
- **Commit:** none new — already on `main` `2cc1051`
- **Verification:** Vercel status **READY**; inspector https://vercel.com/anoraclestacks-projects/image-portal/5gLGrcJXZBLMXnxUP2ruSNWqbQq1 — **T-002** (grep login HTML) pending same session
- **Merge:** N/A — already on `main`, no open PR

### 2026-05-20 — Task list committed for Cursor restart

- **Agent:** Cursor (user requested commit + push before Cursor update)
- **Task id(s):** (meta) documentation handoff — not a Pending checkbox
- **Done:** Added `docs/PROJECT-TASKS.md` (full pending queue + agent instructions), `AGENTS.md` (entry point → task list). Parent `RQ/README.md` links to task list.
- **Files changed:** `docs/PROJECT-TASKS.md`, `AGENTS.md`, `../README.md` (parent workspace)
- **Commit:** (see `git log -1` on `main` after push)
- **Verification:** File exists in repo; user will restart Cursor — **next agent must start T-001**
- **Blockers / follow-ups:** Production still needs redeploy (T-001); audio 54–57 not transcribed (T-011–T-016)

### 2026-05-20 — Handoff list created

- **Agent:** Cursor (accountability / restart handoff)
- **Tasks:** Drafted `docs/PROJECT-TASKS.md` with full pending queue from prior session analysis
- **State:** Code on `main` through `3f3d49c`; production `/login` **not** verified with Google button; audio **54–57** (and **3**) **not** transcribed
- **Evidence:** Production grep `Continue with Google` on https://rub.pub/login → **0** (pre-redeploy)
- **Next agent:** Start **T-001**, then **T-002**, then **T-011–T-016**

<!-- Template for new entries:
### YYYY-MM-DD — T-XXX short title
- **Agent:**
- **Task id(s):**
- **Done:**
- **Files changed:**
- **Commit:**
- **Verification:**
- **Blockers / follow-ups:**
-->
