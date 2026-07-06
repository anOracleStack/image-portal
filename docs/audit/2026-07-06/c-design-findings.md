# Audit C — Design / UX / Consistency Findings

Date: 2026-07-06 · Auditor: Agent C · Target: local dev http://127.0.0.1:3004 (Next.js dev)
Method: live browser (preview_eval/inspect/screenshot), viewports 1280×800 & 375×812, light + dark
themes via footer/login theme toggle, plus source reading (globals.css, styles/landing/*, components/*).

## Summary verdict

Desktop, per-page, the design is strong: the cinema dark landing is distinctive and coherent, the
mood system (portal/luminous/signal) reads as one world, marketing pages follow the app's own copy
rules (ALL CAPS centered titles, balanced 2–3 line copy), dark-theme contrast is comfortably AA+,
`prefers-reduced-motion` is genuinely handled (globals.css:5612–5630, cinema.css:276–284), and the
shared `ip-btn`/`ip-card` vocabulary keeps radii/shadows consistent across pages. The bones of a
best-in-class marketing surface are here.

Mobile is where it falls apart, and it falls apart at the front door. On the landing page at 375px
the ScaleShell clamps to scale 0.5 while `overflow-x: hidden` clips the 720px-wide chrome: the logo,
the Menu button, and the theme toggle are all rendered off-screen — a phone visitor has no navigation
at all (P0). Around that sit a cluster of high-impact flow defects: every "GET STARTED" CTA lands new
users on a "WELCOME BACK / SIGN IN" screen, dead portal slugs (`/p/*` — the product's core shareable
artifact) show the unbranded Next.js black 404, and the gallery's error state is a raw lowercase
"failed to fetch portals" string. Fixing the mobile shell + the four P1s below would move this from
"beautiful demo" to "shippable product surface".

## Route matrix

Legend: OK = no route-specific issue found · Fx = see finding · n/c = not captured (dev-server CSS
streaming degraded late in session under parallel-audit load; see F13).

| Route | Desktop light | Desktop dark | Mobile 375 | Notes |
|---|---|---|---|---|
| `/` (landing) | OK (F5, F7, F8) | OK (F5, F7, F8) | **F1, F2** (P0) | Cinema dark in both themes (F6) |
| `/pricing` | OK | OK | OK (F3) | Cleanest page of the set |
| `/gallery` | **F4** | **F4** | F3, F4 | `/api/portals/public` 500 → raw error |
| `/scan` | **F9** | OK | OK (dark) | Placeholder text invisible in light |
| `/login` | OK (F10, F11) | OK (F10, F11) | n/c | No nav/footer chrome (F11) |
| `/login/confirm-email` | n/c | OK (F12) | n/c | Cryptic fallback copy (F12) |
| `/contact` | OK (F14) | n/c | n/c | "and" rule violations (F14) |
| `/privacy` | OK (F15, F16) | n/c | n/c | Stub policy (F15) |
| `/terms` | OK (F15, F16) | n/c | n/c | Stub terms (F15) |
| `/security` | OK (F15) | n/c | n/c | Stub |
| `/p/nonexistent` | **F2b** (P0/P1) | same | same | Raw Next.js 404, no chrome |
| `/design-preview` | **F13** | n/c | n/c | Rendered unstyled (needs re-verify) |

Console hygiene: no app-generated console errors or warnings on any route tested (only React DevTools
notice + Fast Refresh logs). One failed request: `GET /api/portals/public → 500` on /gallery.

---

## P0 — broken page / unusable flow

### F1. Landing at phone width has no reachable navigation (logo, Menu, theme toggle all clipped off-screen)
- **Where:** `/` at ≤ ~719px viewport (tested 375×812, both themes).
- **Evidence (measured live):** `--landing-scale` floors at 0.5, so the 1440px scale root renders
  720px visually, centered inside a 375px viewport with `overflow-x: hidden` — 172.5px amputated on
  each side. Measured rects at 375px: logo `left: -100.5px` (off-screen left), `.ip-mobile-menu`
  `left: 435px` (off-screen right), footer theme toggle D/L/A at `left: 427–473px` (off-screen),
  footer copyright `right: -54px` (off-screen). `document.elementFromPoint` at the logo position
  returns `null`. No horizontal scroll is possible (`overflow-x: hidden`).
- **Root cause (three files disagree):**
  - `lib/scale-shell.ts:4-5` — `MIN_SCALE = 0.5` with comment "Narrower viewports scroll horizontally".
  - `app/globals.css:1837` — `.ip-landing-scale-viewport { overflow-x: hidden }` forbids exactly that.
  - `app/globals.css:5582-5597` — the `@media (max-width: 768px)` mobile-menu rules key off the
    *viewport*, while the nav lays out at the 1440px *reference* width inside the scale root, so the
    Menu button that the media query reveals is positioned at the far edge of a canvas twice the
    viewport width.
- **Impact:** phone visitors cannot reach Gallery/Pricing/Scan/Login/theme; the page is a scroll-only
  brochure. Contrast: `/pricing`, `/gallery`, `/scan` (MarketingPage shell, no ScaleShell) are properly
  responsive at 375px with a working Menu → the landing is the only broken one, and it's the front door.
- **Fix direction:** either drop MIN_SCALE to `viewport/1440` (true proportional scaling, as the
  .cursor rule specifies: "floor at 0.5" was meant *with* horizontal scroll), or keep 0.5 but make nav
  + footer live outside the fixed-width root / size them to `min(100vw / scale, 1440px)`.

### F2. Dead ends with zero brand chrome (blocker for the product's core artifact)
- **F2a — no `not-found.tsx`, `error.tsx`, or `loading.tsx` anywhere** under `apps/web/app`
  (verified by find). Any 404 or runtime error shows the default Next.js black page.
- **F2b — `/p/some-nonexistent-slug`** → raw "404 | This page could not be found." No logo, no nav,
  no "this portal may have moved — search the gallery / scan again" recovery path. `/p/{slug}` is the
  URL printed posters resolve to; an expired/deleted portal is a *guaranteed* real-world state and it
  currently looks like the site is down. This is the single most valuable error page to design.
  (Server log confirms: `GET /p/some-nonexistent-slug 404`.)
- **Severity note:** F2a alone would be P1; F2b elevates the pair to P0 for a scan-to-URL product.

## P1 — clear visual/UX defects

### F3. Help-chat FAB covers the theme toggle on mobile marketing pages
- **Where:** `/pricing`, `/gallery` (and any MarketingPage) at 375px, both themes.
- **Evidence:** FAB `.ip-help-chat-fab` at (307, 744) 52×52 overlaps theme options "L" (296, 770) and
  "A" (323, 770); `elementFromPoint` on those buttons returns `ip-help-chat`/`ip-help-chat-fab` —
  2 of 3 theme buttons are unclickable. Screenshots confirm the "?" disc sitting on the pills.
- **Fix:** lift the footer toggle above the FAB, or move the FAB up (`bottom: calc(footer + 12px)`)
  on <768px, or collapse the toggle into the mobile Menu.

### F4. Gallery error state is a raw string with no recovery
- **Where:** `/gallery` when `GET /api/portals/public` fails (500 in dev; any transient failure in prod).
- **Evidence:** red-bordered box containing lowercase `failed to fetch portals`. No retry button, no
  "try again shortly" tone, no skeleton/empty-state illustration. Sits directly under a polished
  filter bar, so the quality cliff is very visible.
- **Fix:** human copy ("We couldn't load the gallery. Retry"), a Retry action, and a designed empty
  state for the legitimate "no public portals yet" case (currently indistinguishable from failure).

### F5. Every acquisition CTA routes new users to a "WELCOME BACK — SIGN IN" screen
- **Where:** nav `GET STARTED` (MarketingNav.tsx:35 → `/login`), hero `GET STARTED FREE`
  (content.ts:15 → `/login`), CTA section `CREATE FREE ACCOUNT` (content.ts:81 → `/login`).
- **Evidence:** `/login` renders badge "WELCOME BACK", H1 "SIGN IN", subtitle "Pick up where you left
  off." `login/page.tsx:61` — `useState(false)` for `isSignUp`, no `?mode=signup` search-param support.
  A brand-new user who clicked "CREATE FREE ACCOUNT" must spot the small trailing "SIGN UP" link.
- **Fix:** support `/login?mode=signup` (or `/signup`) and point all "get started" CTAs at it; flip
  copy to "CREATE YOUR ACCOUNT / Your first portal is minutes away."

### F9. /scan placeholder text is invisible in light theme
- **Where:** `/scan` light theme, camera panel before start.
- **Evidence:** "Tap capture when ready" — `.ip-muted` resolves to `rgba(12,12,16,0.42)` (dark-on-light
  token) painted over the always-black camera well (`srgb 0 0 0 / 0.45` on black) → ~1.1:1 contrast,
  unreadable (screenshot verified; fine in dark theme). Source: `app/scan/page.tsx:225,233` +
  `.ip-scan-placeholder` (globals.css:4209).
- **Fix:** hard-code a light token inside the camera well (e.g. `rgba(242,242,244,0.72)`) regardless of
  theme — the well is black in both themes. Also applies to "Camera starting" (page.tsx:233).
- **Related copy nit:** "Tap capture when ready" shows *before* the camera starts; the only button
  says "START CAMERA". Sequence the placeholder ("Start the camera to scan") until the stream is live.

## P2 — inconsistencies (between pages or with the app's own rules)

### F6. Landing ignores the theme system that every other page honors
The landing renders the same dark cinema treatment under `data-theme="light"` and `"dark"` (verified:
identical screenshots, `<html data-theme="light">` with black page). Meanwhile /pricing, /gallery,
/scan, /login all flip fully. The landing still *shows* the D/L/A toggle in its footer — a control
that does nothing perceivable on the page you're standing on, then surprises you on the next page.
Either honor light on the landing (a "cinema light" grade) or hide/annotate the toggle there. Also
update CLAUDE.md ("light theme default" guidance vs. cinema redesign drift).

### F7. Landing copy/markup consistency defects
- **F7a — H1 text runs words together:** `HeroHeadline.tsx:28-32` renders headline lines as adjacent
  `<span>`s with no separator → accessible name / copy-paste / SEO text is "Turn any Image**into** a
  Doorway". Add `{" "}` between lines or `display:block` + trailing space.
- **F7b — heading hierarchy jump:** first section after the H1 exposes an `H3` ("Capture", from the
  demo guide) before any `H2` exists (verified in live heading outline). Demote the demo card caption
  to a `<p>` or promote the section structure.
- **F7c — CTA heading breaks the ALL-CAPS rule:** `LandingCtaSection.tsx:33` "Ready to open the
  door?" is the only sentence-case H2 on the landing (all siblings: QUICK GUIDE, HOW IT WORKS, WHY RQ
  PLUS?, USE CASES, PRICING). Intentional or not, it contradicts `.cursor/rules/layout-and-copy.mdc`
  ("Section titles: ALL CAPS, bold, centered") — either exempt CTA banners in the rule or restyle.

### F8. Hero demo poster crops through its own headline
The "SUMMER LAUNCH" sample poster in the hero scan demo is cropped so the text reads "…IVE DEMO. REAL
IMPACT." / "…e the first to experience" (left edge cut, both themes, desktop + mobile). A simulated
phone-photo crop is fine, but cutting *words* mid-glyph on the first screen reads as a rendering bug
to first-time visitors. Re-frame the sample asset (`use-cases/posters-flyers/scan.webp`) or shift
`object-position` so no sentence is truncated.

### F10. Theme control has three different presentations
- Marketing footer: cryptic single letters "D / L / A" (`ThemeToggle.tsx:31`, `compact` mode) with no
  per-button `aria-label` — screen readers hear "D, toggle button". Tiny targets (~14×13px desktop).
- Login/auth pages: full-word "DARK / LIGHT / AUTO" segmented pill, top-right, different size/placement.
- Landing: same D/L/A but bottom of a scaled shell (12.5px tall at mobile — unreachable anyway, F1).
Pick one presentation (recommend the login-style segmented control, compacted), and always emit
`aria-label={opt.label}` when compact.

### F11. Auth pages drop the site chrome entirely
`/login` and `/login/confirm-email` have no `.ip-nav`, no logo, no footer (verified) — just a floating
"Home" text link top-right. Users lose the brand anchor and the Legal/Privacy links at exactly the
moment they're asked for credentials. Add the logo (top-left, links home) and the slim footer.

### F12. Confirm-email fallback copy is cryptic
`/login/confirm-email` without context renders "CHECK YOUR EMAIL / We need your email address to show
inbox shortcuts. / SIGN IN". "Inbox shortcuts" is internal jargon for the Gmail/Outlook deep-links;
a user who lands here (expired session, shared link) gets no explanation of *why* they're checking
email. Reword fallback: "Your confirmation link was sent. Sign in again if it expired."

### F13. /design-preview served with zero styles (needs re-verification)
Both fresh loads rendered raw HTML: `document.styleSheets.length === 1`, `--bg`/`--text` empty, Times
serif, black-on-dark illegible text; `/_next/static/css/app/layout.css?v=…` returned 404. Late in the
session the same CSS 404 began affecting *all* routes (dev-server CSS streaming degraded under
six-agent parallel load), so this may be environmental — but /design-preview was the only route
broken while everything else was styled, twice, minutes apart. Re-verify with `pnpm build && start`;
if it persists, check that `styles/landing/design-preview.css` classes match `design-preview/page.tsx`.

### F14. "&" rule violations on marketing pages (app's own copy rule)
`.cursor` rule + CLAUDE.md: use "&" not "and" on marketing surfaces. Violations (file:line):
- contact/page.tsx:13 "Sales, support, and partnership…", :21 "sign in and use in-app chat"
- privacy/page.tsx:12 "…portals, and scan analytics", :19 "run portals and measure scans"
- terms/page.tsx:12 "…portals, scans, and billing"
- security/page.tsx:12 "…payments, and portal infrastructure"
(Landing itself is clean — content.ts consistently uses "&".)

### F15. Legal/security pages are visible stubs on a paid product
/privacy: "A complete policy will be published here shortly." /terms: "Full terms are being finalized
— check back soon." /security: "Detailed security documentation is on the way." All three are linked
from every footer next to a $19–$79/mo pricing page and a Stripe checkout. Design/trust issue as much
as legal: at minimum restyle as a proper summary + effective-date + contact block, and drop the
"coming soon" phrasing. Also: footer label "Legal" links to a page titled "TERMS OF SERVICE" —
rename the link "Terms" for scent consistency.

### F16. Floating punctuation after mailto links
privacy/page.tsx:24-30 (and terms equivalent): the sentence-final "." sits outside an
`<a className="ip-nav-link">` whose padding pushes it away → renders "privacy@rub.pub &nbsp;." with a
visible gap (screenshot confirmed on /privacy and /terms). Don't reuse `ip-nav-link` (padded nav
affordance) for inline links; add an `ip-inline-link` style without padding.

## P3 — polish & elevation ideas

- **F17. Landing mobile tap targets** (compounding F1): demo guide pills render 36–51×13px, footer
  links ~10px effective — all far below the 44px minimum. Any F1 fix should include a tap-target pass.
- **F18. Landing scroll-snap is aggressive:** `scroll-snap-type: y mandatory` (globals.css:1858) on
  100dvh sections fights fine-grained reading and caused visible scroll fights during testing.
  Consider `proximity`, or `mandatory` only ≥900px tall viewports.
- **F19. Alt-text grammar:** UseCaseDemo.tsx:90 template yields "Phone photo of a event poster" —
  use an article-aware label or rephrase "Phone photo of a poster, at an angle".
- **F20. Button label casing:** nav pill "GET STARTED" vs pricing cards "Get started"/"Subscribe"
  vs landing "GET STARTED FREE". Standardize marketing CTAs to ALL CAPS (matches title rule).
- **F21. Contact/legal card width:** the content card spans ~1400px while copy occupies ~500px —
  huge empty flanks. Cap these single-column pages at ~720px for a more intentional composition.
- **F22. Gallery copy redundancy:** two stacked paragraphs both explain "public portals appear here"
  ("Free portals appear here automatically…" + "Only portals marked public are listed…"). Merge into
  one balanced block; use the freed space to preview 2–3 sample portal cards (sell the feature even
  when the API is empty).
- **F23. Focus-visible coverage:** only three components define custom `:focus-visible` styles
  (globals.css:1643, 4707, 4823); `.ip-input` sets `outline: none` (with a good focus shadow), but
  buttons/links rely on UA defaults that clash with the cinema aesthetic. Define a brand focus ring
  token (`box-shadow: 0 0 0 3px var(--accent-dim)`) and apply to `.ip-btn`, `.ip-nav-link`,
  `.ip-theme-option`.
- **F24. Scan-page dead space:** at mobile, ~500px of empty background between camera panel and
  footer; anchor a "How scanning works" three-step strip there (reuse landing pills).
- **F25. Nav "Scan" → page titled "OPEN LINK":** label the page "SCAN" (or the nav "Open link") so
  the clicked word appears on the destination — basic scent continuity.
- **Positive notes worth keeping:** reduced-motion handling is exemplary (kills sweeps/scanlines and
  the demo autoplay); dark-theme contrast measured 7–18:1 on all sampled text; single H1 per page;
  landmarks (header/nav/main/footer) present on all chromed pages; `aria-pressed` on theme buttons;
  scan-demo step pills expose descriptive `aria-label`s; portals/luminous/signal moods read as one
  coherent system.

## Counts

| Severity | Count | IDs |
|---|---|---|
| P0 | 2 | F1, F2 |
| P1 | 4 | F3, F4, F5, F9 |
| P2 | 11 | F6, F7a-c, F8, F10, F11, F12, F13, F14, F15, F16 |
| P3 | 9 | F17–F25 |

Environment caveat: dev-server CSS streaming (`/_next/static/css/app/layout.css` → 404) degraded
mid-session under six-agent parallel load, blocking a handful of late captures (marked n/c) and
making F13 provisional. All P0/P1 findings were verified *before* the degradation, with DOM
measurements independent of screenshots.
