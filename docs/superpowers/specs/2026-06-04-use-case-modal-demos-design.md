# Use Case Modal Demos — Design Spec

**Date:** 2026-06-04  
**Status:** Approved  
**Scope:** Landing page use cases section + shared demo component

## Problem

The landing page lists six use cases as static cards with icon glyphs only. Visitors cannot see how RQ Plus works for their category without scrolling to the hero `ScanDemo`, which only illustrates posters. Product feedback (T-033 voice memo) also requires tighter two-line copy per card.

## Goals

1. Six editorial use-case cards with category thumbnails and ALL CAPS bold titles.
2. Clicking a card opens a centered modal on the same page with the full 7-step interactive demo (same flow as hero).
3. Preserve landing LCP: lazy-load modal shell, demo JS bundle, and per-slug `reference.webp` / `scan.webp` on first modal open; card `thumb.webp` loads lazily via `next/image`.
4. Shared `UseCaseDemo` component used by hero `ScanDemo` and modals — no duplicated step logic.
5. Accessible modal: `role="dialog"`, focus trap, `aria-labelledby`, Esc / backdrop / close dismiss, focus return, `body` scroll lock.

## Non-goals

- Replacing hero `ScanDemo` placement or auto-advance behavior (hero always cycles at 6.5s).
- Loading all six full demo asset sets on initial page load.
- New backend or portal flows.

## Use cases (slugs)

| Slug | Card title | Demo destination example |
|------|------------|--------------------------|
| `posters-flyers` | POSTERS & FLYERS | `rub.pub/summer-launch` |
| `restaurant-menus` | RESTAURANT MENUS | `rub.pub/menu` |
| `event-tickets` | EVENT TICKETS | `rub.pub/tickets` |
| `product-packaging` | PRODUCT PACKAGING | `rub.pub/unbox` |
| `art-photography` | ART & PHOTOGRAPHY | `rub.pub/gallery` |
| `business-cards` | BUSINESS CARDS | `rub.pub/card` |

## Card copy (voice memo T-033)

Each card: two `BalancedText` lines, centered, `&` not “and”.

- **Posters & Flyers:** “Printed materials that change with your content.” / “Update the link anytime — no reprinting needed.”
- **Restaurant Menus:** “The menu image itself is scannable.” / “Change prices & items instantly from your dashboard.”
- **Event Tickets:** “Link tickets in real time from one image.” / “Update schedule, venue, & refunds on the fly.”
- **Product Packaging:** “Packaging becomes a channel to your brand.” / “Manuals, offers, & unboxing — one scan away.”
- **Art & Photography:** “Every physical print becomes a gallery link.” / “Collectors scan to view, buy, or learn more.”
- **Business Cards:** “Your card design is the key to your link.” / “No separate QR block required on the card.”

## UI — use case cards

- Grid: existing `ip-grid-3`.
- Element: `<button type="button">` (not `<div>`) with `ip-use-case-card`, `ip-card`, `ip-card-interactive`, `ip-card-glow`.
- Thumbnail: `next/image` `thumb.webp`, aspect ~4:5, editorial crop, `loading="lazy"`, fixed dimensions for CLS.
- Title: `ip-use-case-card-title` — Syne, ALL CAPS, bold.
- Hover: subtle lift + accent border (match `ip-card-interactive`).

## UI — modal

- Overlay: `ip-use-case-modal-overlay` (reuse blur pattern from `ip-modal-overlay`, wider content).
- Panel: `ip-use-case-modal-panel` — max-width ~960px, scrollable body, close button top-right.
- Header: category title (`aria-labelledby` target) + one-line subtitle.
- Body: dynamically imported `UseCaseDemo` with `autoAdvance="after-interaction"` (paused until first pointer/keyboard interaction inside demo, then 6.5s step interval like hero).
- Dismiss: × button, backdrop click, Escape.
- On open: `document.body.style.overflow = hidden`; on close restore + return focus to triggering card.

## UI — shared demo (`UseCaseDemo`)

Seven steps (unchanged labels): Upload → Capture → Enhance → Link → Approve → Scan → Open.

Per slug, asset paths:

```
/public/demo/{slug}/reference.webp  — clean / enhanced / linked / approve frames
/public/demo/{slug}/scan.webp       — capture / scan frames (reticle)
/public/demo/{slug}/thumb.webp      — card thumbnail only
```

Legacy hero paths `/demo/poster-reference.png` and `/demo/scan-photo.png` remain until migrated; hero uses `posters-flyers` slug paths.

Step copy: base strings from current `ScanDemo`; `example` lines parameterized by category label (e.g. “Example: trifold menu file (.PNG)”).

## Performance

- `UseCasesSection` and `UseCaseModal`: client components; modal content `next/dynamic` with `ssr: false`.
- Demo images inside modal: `priority={false}`, load when modal mounts.
- Card thumbs: lazy, explicit width/height, WebP.
- No prefetch of non-active slug full assets.

## Accessibility

- Cards: `aria-haspopup="dialog"`, `aria-expanded` when modal open.
- Modal: `role="dialog"`, `aria-modal="true"`, labelled by title id.
- Focus trap: Tab cycles within modal; Shift+Tab from first focuses last.
- Close control: `aria-label="Close demo"`.

## Visual direction

Editorial print realism: Syne display, DM Sans body, teal accent (`--accent`), dark/light tokens. Category placeholders use distinct typography/color palettes per slug (not generic purple gradients). Posters slug reuses existing poster photography; other slugs use generated print-mock WebP until real photography is supplied.

## Success criteria

- [ ] All six cards show thumbnails and open correct modal demo.
- [ ] Hero `ScanDemo` behavior unchanged (auto-advance 6.5s).
- [ ] Modal demos pause until interaction, then auto-advance.
- [ ] `tsc --noEmit` passes in `apps/web`.
- [ ] No regression to landing layout centering.
