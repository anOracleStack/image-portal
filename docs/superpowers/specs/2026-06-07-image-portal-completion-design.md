# Image Portal completion design spec

**Date:** 2026-06-07  
**Scope:** Close all “still missing” inventory items for Image Portal (rub.pub)  
**Baseline commit:** `71c9d96` (dashboard shell, workshop, help chat rule-based)

---

## Goals

1. Document every env var & manual setup step so the user only adds keys/secrets.
2. Upgrade Help & Workshop chat to OpenAI when `OPENAI_API_KEY` is set; keep rule-based fallback.
3. Polish landing per voice memo 53 (T-030–T-035 subset).
4. Fix Supabase project ref (`duydupyyembdttmjvsxm`), local port `3004`.
5. Ship deploy docs, E2E checklist, env checker script.
6. Small safe cleanup (`scan_mode` UI types; stale copy audit).

---

## Architecture

### Assistant layer

```
apps/web/lib/assistant-fallback.ts   # Client-safe rule-based replies
apps/web/lib/assistant.ts            # Server OpenAI + fallbacks
apps/web/app/api/help/chat/route.ts  # Help chat API
apps/web/app/api/portals/[id]/workshop/route.ts  # Uses workshopAssistantReply()
```

**Behavior:**

| Key present | Help chat | Workshop chat |
|-------------|-----------|---------------|
| `OPENAI_API_KEY` | GPT via `/api/help/chat` | GPT JSON adjust + creative feedback |
| Absent | `helpReplyFallback` | `workshopReplyFallback` (regex + enhance opts) |

OpenAI called via `fetch` to Chat Completions API (no new npm deps). Model default: `gpt-4o-mini`.

Workshop LLM returns JSON: `{ reply, adjust?, wantsApprove? }` parsed server-side; invalid JSON falls back to plain text or rule-based.

### Environment

- `apps/web/.env.example` — all keys commented
- `scripts/check-env.mjs` — prints set/missing (no values)
- `pnpm check:env` root script

### Auth automation

- `scripts/supabase-auth-rub-pub.sh` — project ref `duydupyyembdttmjvsxm`, redirects include `localhost:3004`
- USER_SETUP documents Google Cloud + Supabase dashboard clicks

### Landing (memo 53)

| Item | Implementation |
|------|----------------|
| T-030 Hero | `HeroHeadline.tsx`: Image/Doorway caps, “Next generation QR code” |
| T-031 Body | `page.tsx`: key line, camera phone line, uppercase CTAs |
| T-032 Demo | `ScanDemo.tsx`: Scan → Match → Open strip + `UseCaseDemo` |
| T-033 Use cases | `lib/use-cases.ts` (already aligned) |
| T-034 Why | Centered cards, title casing, merged “link does not move” line |
| T-035 Pricing | Centered section on landing |

### Code cleanup

- `scan_mode` UI types → `"image"` only (`types.ts`, dashboard page); DB column unchanged
- `qrcode` **kept** — decorative hero background in `HeroHeadline.tsx`
- Stale strings grep: no `choose how visitors scan` or `Enter a valid URL (http/https)`

---

## Documentation map

| File | Purpose |
|------|---------|
| [USER_SETUP.md](../../USER_SETUP.md) | User key-only setup |
| [ENV_KEYS.md](../../ENV_KEYS.md) | Full env table |
| [DEPLOY.md](../../DEPLOY.md) | Vercel GitHub + CLI |
| [E2E_CHECKLIST.md](../../E2E_CHECKLIST.md) | Verification steps |
| [PROJECT-TASKS.md](../../PROJECT-TASKS.md) | Agent task log |

---

## Deferred (requires user / out of scope)

| Item | Reason |
|------|--------|
| T-010–T-016 Audio transcription 54–57, clip 3 | User machine audio not in repo |
| T-020–T-022 Full memo checklist + sign-off | Depends on untranscribed audio |
| T-002–T-004 Production Google login verification | Needs user OAuth credentials |
| T-090 Production browser pass | User verification |
| Warm ML embed endpoint | User infrastructure |
| Stripe live billing | User Stripe keys |
| Stock iPhone Camera integration | OS-level; documented as impossible today |

---

## Deploy

- `vercel.json` at repo root (unchanged): monorepo build from `apps/web`
- CI gate: `pnpm --filter @ip/web build` + `typecheck`
- Production deploy: `vercel deploy --prod` when CLI authenticated

---

## Success criteria

- [x] All docs listed above exist & accurate ref/port
- [x] Env example + check script
- [x] LLM chat with fallback
- [x] Landing polish from memo 53
- [x] Build & typecheck pass
- [ ] User adds keys & verifies E2E on rub.pub (manual)
