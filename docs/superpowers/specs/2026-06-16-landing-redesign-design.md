# RQ Plus Landing Redesign — Design Summary

**Date:** 2026-06-16  
**Status:** Implemented locally (not deployed)

## Goal

Fix landing layout overlap bugs and apply a hybrid mood system — one design world, distinct section atmospheres — while honoring owner voice-memo copy and layout rules.

## Hybrid mood map

| Scroll section | Mood | Visual language |
|----------------|------|-----------------|
| Hero | Portal Dark | Dark mesh, glass, QR sweep, scan aperture ring |
| Quick Guide / Scan demo | Luminous Demo | Elevated white card, SCAN→MATCH→OPEN strip, live preview card |
| How it works | Signal Brutalist | Hairline grid, mono step labels, square cards |
| Why RQ Plus? | Signal Brutalist | Centered copy, caps titles, balanced two-line cards |
| Use cases | Signal Brutalist | Compact grid, mono titles |
| Pricing | Portal Dark return | Glass panel, centered copy, glow CTA |
| Gallery CTA | Portal Dark return | Glass card, thumb strip, accent headline |

## Layout fixes

- Removed `min/max-height: 100vh` override on scaled landing sections.
- Sections use `--landing-section-height` = `calc(100dvh - nav - footer)`.
- Hero: `overflow: hidden`; scan section: `overflow-y: auto`.
- Nav stays **sticky** inside `LandingScaleShell` (not viewport-fixed bleed).
- `GlowBackground` is `position: absolute` inside scale root.
- `HelpChat` (`inScale`) sits above footer with lower z-index and pointer-events isolation.

## Copy (voice memo)

- Headline: **Turn any Image** / **into a Doorway**
- Subtitle: **NEXT GENERATION QR CODE**
- Lead: key-not-destination on one line; camera phone phrasing
- CTAs: **GET STARTED FREE**, **SEE HOW IT WORKS ↓** (caps + bold)
- Why / use-case cards: centered, balanced two-line blocks, caps titles
- Pricing block: center-aligned

## New / updated files

### Styles

- `apps/web/styles/tokens.css` — shared mood + section height tokens
- `apps/web/styles/landing/portal.css`
- `apps/web/styles/landing/luminous.css`
- `apps/web/styles/landing/signal.css`
- `apps/web/styles/landing/design-preview.css`
- `apps/web/app/globals.css` — imports, glow portal, skeleton, layout fixes

### Components

- `HeroHeadline.tsx` — aperture + QR sweep + voice-memo headline
- `GlowBackground.tsx` — `variant="portal"` mesh/sweep
- `LandingScanSection.tsx` — `dynamic()` lazy `ScanDemo`, luminous mood
- All landing sections — `data-section-mood` attributes
- `UseCaseDemo.tsx` — live preview card from Approve step onward

### Pages

- `app/design-preview/page.tsx` — dev-only mood comparison (not in nav)
- `app/page.tsx` — portal glow on landing

### Docs

- `image-portal/CLAUDE.md` — agent entry (port 3004, moods, copy rules)

## Performance

- Fonts: `display: swap` on Syne, DM Sans, JetBrains Mono (`app/layout.tsx`)
- `ScanDemo` lazy-loaded via `next/dynamic` with skeleton placeholder
- `prefers-reduced-motion` disables QR sweep, portal sweep, skeleton shimmer
- `LandingScaleShell` ResizeObserver + slot height sync reduces CLS from scale shell

## Marketing parity

- `MarketingPage` panels use portal glass/rim tokens for `/gallery`, `/pricing`, `/scan`
- Section titles remain centered ALL CAPS

## Verify locally

```bash
cd /Users/oraclevision/Developer/applications/RQ/image-portal
pnpm typecheck && pnpm test
pnpm dev
```

| URL | What to check |
|-----|----------------|
| http://127.0.0.1:3004/ | Full hybrid scroll; no hero/scan overlap; moods per section |
| http://127.0.0.1:3004/design-preview | Four mood snapshots |
| http://127.0.0.1:3004/#scan-demo | Luminous card, SCAN→MATCH→OPEN, live preview on later steps |
| http://127.0.0.1:3004/pricing | Portal-styled panels, centered copy |
| http://127.0.0.1:3004/gallery | Marketing shell tokens |

## Out of scope (unchanged)

- Tailwind / shadcn migration
- Vision, auth, dashboard routes
- Git commit / production deploy
