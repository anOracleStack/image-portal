# Image Portal — project task list & work log

**Purpose:** Single source of truth for agents resuming work on Image Portal (https://rub.pub).  
**Repo:** `/Users/oraclevision/Developer/applications/RQ/image-portal`  
**Branch:** `main` · **Remote:** `anOracleStack/image-portal`  
**Vercel:** root `apps/web` · **Supabase ref:** `ybqmvxuvaldfzmkbucqc`

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

- [x] **T-001** Redeploy Vercel **production** from latest `main` — **done 2026-05-20** (`vercel deploy --prod`, deployment `dpl_5gLGrcJXZBLMXnxUP2ruSNWqbQq1`, aliased https://rub.pub).
- [ ] **T-002** Verify **https://rub.pub/login** shows: “Continue with Google”, Create Account flow, centered fields, keep-signed-in behavior. Record evidence in log (screenshot note or HTML grep for `Continue with Google`).
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

- [ ] **T-030** Landing hero: “Image” / “Doorway” capitalization; subtitle “Next generation QR code”; line breaks per 53 transcript.
- [ ] **T-031** Hero body: “the image is the key — not the destination” on one line; “Anyone with a camera phone…” on one line; **GET STARTED FREE** / **SEE HOW IT WORKS** all caps bold.
- [ ] **T-032** Scan demo: SCAN / MATCH / OPEN; fix or explain live preview if empty; copy per memo.
- [ ] **T-033** Use cases section: line breaks for posters/flyers, menus, event tickets, product packaging (per 53).
- [ ] **T-034** “Why Image Portal”: center-aligned block; capitalization on Reliable scanning, Update any time, Never reprint, No QR codes needed; line merges per memo.
- [ ] **T-035** Pricing section on landing: center-aligned (per memo).
- [ ] **T-036** Remaining landing items from **T-020 checklist** not covered above.

### Implementation — auth / login (code exists; verify live)

- [ ] **T-040** Re-verify `apps/web/app/login/page.tsx` matches product intent after T-002.
- [ ] **T-041** Re-verify `apps/web/app/login/confirm-email/page.tsx` copy and layout.
- [ ] **T-042** Auth callback / welcome flow smoke test on production after T-001–T-003.

### Implementation — sitewide polish

- [ ] **T-050** Pricing page (`apps/web/app/pricing/page.tsx`): center alignment, `&`, BalancedText — per user text rules.
- [ ] **T-051** Other marketing pages: gallery, features, etc. — audit center/`&`/balanced lines from checklist.
- [ ] **T-052** Any dashboard/portal items from memos 54–57 (fill from T-020 checklist).

### Verification — do last, every time

- [ ] **T-090** Production browser pass: `/`, `/login`, `/pricing`, `/signup` (or routes in checklist). Hard refresh / incognito.
- [ ] **T-091** `pnpm build` and `pnpm test` in `image-portal` — record pass/fail in log.
- [ ] **T-092** Update this file: all Pending done or explicitly deferred with reason; final log entry “ready for user review” only if T-090 + audio scope complete.

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
