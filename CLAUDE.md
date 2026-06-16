# Image Portal (RQ Plus) — Claude Code context

## Dev

| Item | Value |
|------|--------|
| Web app | `apps/web/` (Next.js 15) |
| Dev server | `pnpm dev` → **http://127.0.0.1:3004** |
| Typecheck | `pnpm typecheck` (from repo root) |
| Tests | `pnpm test` (vitest, from repo root) |
| Production | https://rub.pub |

```bash
cd /Users/oraclevision/Developer/applications/RQ/image-portal
pnpm dev
```

## Layout: LandingScaleShell

- Reference width **1440px**; entire landing chrome scales via CSS `transform: scale()`.
- `LandingScaleShell` sets `--landing-scale` and wraps nav, sections, footer, and help chat.
- Section height: `var(--landing-section-height)` = `100dvh - nav - footer`.
- Nav inside scale root uses **sticky**, not viewport-fixed.
- `HelpChat` with `inScale` is absolutely positioned above the footer.

## Landing mood system

Sections use `data-section-mood` on `<section>`:

| Section | Mood | File |
|---------|------|------|
| Hero, Pricing, CTA | `portal` | `styles/landing/portal.css` |
| Quick Guide / Scan demo | `luminous` | `styles/landing/luminous.css` |
| How / Why / Use cases | `signal` | `styles/landing/signal.css` |

Shared tokens: `styles/tokens.css`, imported from `app/globals.css`.

Design preview (dev): `/design-preview` — four mood snapshots, not in nav.

## Copy rules

- Center-align marketing copy unless a control must be left-aligned.
- Section titles: **ALL CAPS**, bold, centered.
- Use `BalancedText` with 2–3 balanced lines (±20% length).
- Use `&` not "and" on marketing pages.
- Voice-memo source: `docs/notes/landing-voice-memo-transcript.txt`
- Layout rule file: `.cursor/rules/layout-and-copy.mdc`

## Key landing files

- `app/page.tsx` — landing composition
- `components/landing/*` — sections + `content.ts` copy
- `components/LandingScaleShell.tsx` — scale wrapper
- `components/ui/GlowBackground.tsx` — portal mesh + grid
- `app/globals.css` — base styles (no Tailwind)

## Scope notes

- Custom CSS only — no Tailwind/shadcn on marketing surfaces.
- Do not change vision/auth/dashboard unless explicitly requested.
