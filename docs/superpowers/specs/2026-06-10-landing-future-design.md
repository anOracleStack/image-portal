# RQ Plus — Next-Gen Landing & Surface Design

**Date:** 2026-06-10  
**Product:** RQ Plus (visual scan · programmable links)  
**Production:** https://rub.pub  
**Status:** Design spec — authoritative direction for landing + related surfaces  
**Supersedes:** Partial/in-progress landing implementation; follow this spec when conflicts arise  
**Reference screenshots:** P1–P8 in workspace assets (`p1-…` through `p8-…`)

---

## 1. Current state audit

### Visual system (existing tokens)

| Layer | Current choice | Notes |
|-------|----------------|-------|
| Display | **Syne** (`--font-display`) | Heavy, editorial caps headlines |
| Body | **DM Sans** (`--font-body`) | UI, paragraphs, buttons |
| Meta / labels | **JetBrains Mono** (`--font-mono`) | Badges, step pills, scan UI |
| Dark accent | `#5eead4` teal + indigo mesh (`--hero-mesh-2`) | Glow, grid, CTA fill |
| Light accent | `#0d9488` teal | Darker for contrast on white |
| Background | Near-black `#060608` (dark) / `#f6f7f9` (light) | `GlowBackground` + noise overlay |
| Texture | 48px scan grid, radial mesh drift, card borders | Already “scan lab” coded in CSS |
| Motion | `ip-fade-up`, reticle pulse, mesh drift 18s, scan flow 2.5s | Respects `prefers-reduced-motion` |

### Layout rules (`.cursor/rules/layout-and-copy.mdc`)

- **1440px** design reference; proportional scale via single transform root (dashboard uses `DashboardScaleShell`; landing needs `LandingScaleShell`).
- **Center-align** marketing copy, headings, CTAs.
- **Section titles:** ALL CAPS, bold, centered.
- **Balanced lines:** `BalancedText` or manual breaks; no orphan long/short pairs.
- Marketing copy uses **`&`** not “and”.

### Implementation gaps (code vs target)

| Gap | Today | Target |
|-----|-------|--------|
| Scale shell | Nav/main/footer scale with viewport only via CSS clamp | `LandingScaleShell` at 1440px logical width |
| Hero copy | 2-line lead; CTAs “GET STARTED” / “SEE HOW IT WORKS” (no ↓) | 3-line voice-memo lead; **GET STARTED FREE** + **SEE HOW IT WORKS ↓** |
| Hero viewport | Body & CTAs can sit below fold on some laptops | P2: full first viewport at 1440×900 |
| Scan demo | Verbose stage copy + “How it works” chrome overflows | P3: flow strip + frame + one step row only |
| Luminous tokens | Standard `ip-card` borders | `--portal-glass`, `--portal-rim`, scan-sweep on QR watermark |
| Gallery CTA | Generic “Ready to open the door?” card | Dual-path: explore use cases + create account |

### Screenshot gap analysis (P1 → P8)

| Ref | Surface | Problem today | Target |
|-----|---------|---------------|--------|
| **P1** | Hero (partial) | Headline only; body & CTAs below fold | Match **P2** — full first viewport |
| **P2** | Hero (target) | — | Badge + headline + 3-line lead + both CTAs visible without scroll |
| **P3** | Quick guide / scan demo | Demo + step chrome overflows one screen | Entire demo + flow labels fit **one viewport** |
| **P4** | How it works | Steps stack vertically on narrow / overflow | **3 columns horizontal** in one viewport at reference scale |
| **P5** | Use cases | Card bottoms cut off | **3 cards**, thumbs + titles + 2 lines each, one viewport |
| **P6** | Why RQ Plus | Large vertical stack | **3 compact cards in one row**, one viewport |
| **P7** | Confirm email / welcome | Card feels oversized | **Tighter** card, centered, no stray copy |
| **P8** | Dashboard onboarding | Checklist layout loose, left-weighted | **Centered** wizard, pills + step card balanced |

### Code surfaces in scope

| Area | Files |
|------|-------|
| Landing | `apps/web/app/page.tsx`, `globals.css` (`.ip-landing-*`) |
| Scale shell | `components/landing/LandingScaleShell.tsx` *(new)* |
| Hero | `components/landing/HeroHeadline.tsx` |
| Scan demo | `components/landing/ScanDemo.tsx`, `UseCaseDemo.tsx` |
| Use cases | `components/landing/UseCasesSection.tsx` |
| Confirm email | `apps/web/app/login/confirm-email/page.tsx` |
| Dashboard onboarding | `components/OnboardingStrip.tsx` |
| Chrome | `MarketingNav`, `MarketingFooter`, `GlowBackground`, `HelpChat`, `AuthShell` |

---

## 2. Three aesthetic directions

### A. **Luminous Portal** *(chosen)*

**Concept:** The printed image is a glowing threshold — frosted glass panels, teal aurora, scan reticle, and a horizontal scan-line that “activates” the hero QR watermark. Feels like aiming a phone at a poster and the world opens behind it.

| Strength | Trade-off |
|----------|-----------|
| Extends existing `GlowBackground`, accent glow, reticle — low token churn | Easy to over-glass; cap blur layers |
| Best match for “next gen **visual scan**” product story | Motion must stay CSS-first & subtle |
| Works in **light (default marketing)** and dark theme | Needs discipline so it doesn’t read as generic fintech |

**Signature moves:** Frosted section panels with `--portal-rim` accent light; active demo step = glow ring + mono tick; hero QR watermark with `@keyframes ip-scan-sweep`; section-scoped grid boost in scan demo only.

**Next-gen lift (v2 refinements):**

1. **Threshold hero** — headline sits in front of a radial “doorway” bloom; QR watermark masked with radial fade + slow scan bar (4s loop).
2. **Instrument flow strip** — `SCAN → MATCH → OPEN` with corner bracket ticks (Orbital borrow) at 13px mono.
3. **Glass cards without slop** — one `backdrop-filter` per card; inner highlight inset; hover rim intensifies 18% → 35% accent mix.
4. **Scroll choreography** — existing `scroll-snap` + staggered `ip-fade-up` per section inner; no scroll-jacking libraries.

---

### B. **Editorial Tech**

**Concept:** High-end magazine meets terminal — giant Syne headlines, monospace metadata rails, minimal chrome, print-quality photography. QR is typographic, not luminous.

| Strength | Trade-off |
|----------|-----------|
| Distinctive, premium, fast (few effects) | Less overtly “futuristic” / next-gen |
| Typography-led; aligns with current Syne hero | Scan demo may feel static without motion accents |
| Excellent readability | Horizontal instrument grids feel weaker |

**Signature moves:** Oversized caps headlines, thin hairline rules between sections, step numbers as margin labels, demo framed like an editorial spread.

**Rejected as primary** because RQ Plus’s differentiation is *visual scan magic*, not print editorial alone. Mine for: Syne scale, balanced copy rhythm, ALL CAPS section titles.

---

### C. **Orbital Minimal**

**Concept:** Dark instrument panel — precision grid, hairline borders, chrome bezels, numeric step readouts. NASA dashboard meets QR lab.

| Strength | Trade-off |
|----------|-----------|
| Very “next gen” / technical | Light theme becomes second-class unless reworked |
| Grid & mono labels already in codebase | Can feel cold for SMB/marketing audiences |
| Strong scan UI cohesion | Higher contrast accessibility care on dark |

**Signature moves:** Dark-default landing, 1px chrome borders, corner brackets on demo frame, dot-matrix step indicators.

**Rejected as primary** because marketing defaults to light (P2) and SMB visitors need warmth. Mine for: flow-strip brackets, reticle density, corner ticks on demo frame only.

---

### Recommendation

**Ship Luminous Portal (A)** as the primary skin.

**Rationale:** RQ Plus already codes glow, grid, and teal accent on rub.pub. The product promise is *visual scan* — luminance + glass + reticle sells that better than pure editorial or pure dark chrome, while staying performant and on-brand in light mode. Editorial Tech supplies typography discipline; Orbital supplies precision in the scan demo instrument only.

---

## 3. Visual identity — Luminous Portal (chosen direction)

### Typography

| Role | Font | Treatment |
|------|------|-----------|
| Hero grabber | Syne 800 | 3 lines max; line 3 accent gradient (`--text` → `--accent`) on **CODES** |
| Section titles | Syne 800 | ALL CAPS, `letter-spacing: 0.04em`, centered |
| Card titles | Syne 700 | ALL CAPS, smaller than section title |
| Body | DM Sans | 15–17px, `--text-muted`, `BalancedText` 2–3 lines |
| Labels / steps | JetBrains Mono | 11–13px, uppercase, `letter-spacing: 0.08em` |
| CTAs | DM Sans 700 | ALL CAPS, `letter-spacing: 0.06em`, bold |

**Do not** add Inter, Space Grotesk, or purple gradients. Indigo mesh stays at ≤8% opacity.

### Color (extend tokens, don’t replace)

```text
--portal-glass:     color-mix(in srgb, var(--bg-card) 72%, transparent)
--portal-rim:       color-mix(in srgb, var(--accent) 22%, var(--border))
--portal-rim-active: color-mix(in srgb, var(--accent) 38%, var(--border))
--portal-aurora-a:  var(--hero-mesh-1)
--portal-aurora-b:  var(--hero-mesh-2)
--portal-scan-line: color-mix(in srgb, var(--accent) 35%, transparent)
--portal-threshold: radial-gradient(ellipse 70% 60% at 50% 35%, var(--hero-mesh-1), transparent 72%)
```

**Dark theme:** Deep void bg, teal glow CTAs, glass cards at 72% opacity + `backdrop-filter: blur(12px)` (single layer per card).

**Light theme:** P2 reference — white/off-white base, teal accent, soft lavender corner aurora. Cards: white fill + faint teal rim on hover.

### Texture & depth

1. **Global:** Keep `GlowBackground` + `ip-scan-grid`; increase grid visibility **10%** in scan-demo section only via `.ip-landing-scan`.
2. **Cards:** `border: 1px solid var(--portal-rim)`; inner highlight `box-shadow: inset 0 1px 0 color-mix(white 6%, transparent)`.
3. **Hero QR watermark:** Server SVG in `HeroHeadline`; CSS `mask-image` radial fade + `@keyframes ip-scan-sweep` (2px horizontal gradient bar, 4s, disabled under `prefers-reduced-motion`).
4. **Noise:** Keep existing SVG noise at `--noise-opacity`; no new image assets.

### Motion (CSS-first)

| Element | Animation | Duration |
|---------|-----------|----------|
| Section enter | `ip-fade-up` (existing) | 0.7s, stagger 0.1s children |
| Hero mesh | `ip-mesh-drift` (existing) | 18s |
| QR scan sweep | `ip-scan-sweep` *(new)* | 4s loop |
| Scan flow labels | Opacity + `text-shadow` glow on active | 0.28s |
| Reticle | `ip-reticle-pulse` (existing) | 2s |
| CTA hover | `translateY(-1px)` + `--shadow-glow` | 0.15s |
| Scroll | `scroll-snap-type: y mandatory` on landing (existing) | — |

**No** Lottie, Three.js, Framer Motion, GSAP, or video backgrounds on landing.

---

## 4. Landing architecture — full-viewport sections

### Scale wrapper (required)

Mirror dashboard pattern:

- Wrap **nav + main + footer + HelpChat** in `LandingScaleShell` (1440px logical width).
- Formula: `scale = min(1, max(0.5, viewportWidth / 1440))`, `transform-origin: top center`.
- Nav sticky **inside** scale root.
- HelpChat FAB inside scale root (bottom-right of canvas, not `position: fixed` to viewport).

### Section map (one screen each)

Vertical scroll between sections; **no internal scroll** within a section at 1440×900 and typical laptop viewports.

| # | ID | Title (ALL CAPS) | Viewport budget |
|---|-----|------------------|-----------------|
| 1 | `hero` | *(headline, not section title)* | 100vh — P2 content fully visible |
| 2 | `scan-demo` | QUICK GUIDE | 100vh — flow + demo + one step row |
| 3 | `how-it-works` | HOW IT WORKS | 100vh — 3 horizontal step cards |
| 4 | `why` | WHY RQ PLUS? | 100vh — 3 compact cards |
| 5 | `use-cases` | USE CASES | 100vh — 3 cards, nothing clipped |
| 6 | `pricing` | PRICING | 100vh — 2 lines + link (compact) |
| 7 | `gallery-cta` | *(card headline)* | 100vh — gallery teaser + dual CTAs |

Footer: attached below §7 without its own snap section; height ≤ 120px at scale 1.0.

---

## 5. Per-section design & acceptance criteria

### §1 Hero (P1 → P2)

**Layout**

```
┌──────────────────────────────────────────────┐
│  [VISUAL SCAN · PROGRAMMABLE LINKS]  badge   │
│         THE NEXT GENERATION                  │
│            OF QR                           │
│           CODES ← gradient accent            │
│    Turn any image into a doorway.            │
│    Upload it, link it anywhere —             │
│    the image is the key.                     │
│    Anyone with a camera phone can open       │
│    your link in seconds.                     │
│   [GET STARTED FREE]  [SEE HOW IT WORKS ↓]   │
└──────────────────────────────────────────────┘
```

- Max content width: **720px**; vertical gap: `clamp(8px, 1.5vh, 16px)`.
- QR watermark: max **280px** behind headline; opacity 0.12 light / 0.14 dark; scan-sweep overlay.
- Section background: `--portal-threshold` on `.ip-landing-hero`.

**Acceptance criteria**

- [ ] At 1440×900 scale 1.0, badge + 3-line headline + 3-line lead + both CTAs visible with **no scroll**.
- [ ] Headline line 3: `OF QR` + accent **CODES** per `HeroHeadline` structure.
- [ ] Lead line 3 is one balanced line: “Anyone with a camera phone…” (not “phone camera”).
- [ ] Primary CTA: **GET STARTED FREE** → `/login`; secondary: **SEE HOW IT WORKS ↓** → `#scan-demo`.
- [ ] Both CTAs ALL CAPS, bold (`ip-btn-hero-cta`).
- [ ] QR watermark has radial mask + scan-sweep (motion off when reduced-motion).
- [ ] Copy centered; `BalancedText` on all lead lines.

---

### §2 Quick guide / scan demo (P3)

- Title: **QUICK GUIDE** (ALL CAPS).
- Top: `SCAN → MATCH → OPEN` flow strip with corner bracket ticks; **13px** mono.
- Demo card max-width: **480px**; image frame max **240px** height at 1440 scale.
- Step pills: single row; horizontal scroll **only below 0.65 scale**.
- Landing mode: **stage word + 2 balanced lines + frame** only — hide duplicate “How it works” label and verbose 3-line descriptions.
- Controls row: compact; max 7 pills at 11px mono.
- Demo frame: corner bracket ticks (Orbital borrow); active step pill = `--portal-rim-active` glow ring.
- Section grid visibility +10% vs global.

**Acceptance criteria**

- [ ] Entire section (title + flow + demo card + pill row) fits **one viewport** at 1440×900.
- [ ] Flow strip reads `SCAN → MATCH → OPEN` centered.
- [ ] No inner scroll inside demo card at reference scale.
- [ ] Reticle visible on capture/scan steps when applicable.
- [ ] Auto-advance demo still sole JS interval on landing.

---

## Scan Demo Architecture

**Scope:** §2 Quick guide (`#scan-demo`) — behavior, boundaries, and relationship to `/scan` + `/api/scan`.  
**Principle:** Landing sells the *feeling* of visual scan; `/scan` delivers the *real* pipeline.

### Current state (as of 2026-06-10)

| Layer | What exists | API / camera? |
|-------|-------------|---------------|
| `ScanDemo.tsx` | Thin wrapper → `UseCaseDemo` (`slug="posters-flyers"`, `autoAdvance="immediate"`, `priorityFrames`) | **No** |
| `UseCaseDemo.tsx` | 6-step carousel; static `next/image` assets from `lib/use-cases`; sole JS loop = `setInterval` @ 6.5s | **No** |
| CSS | `.ip-demo-*` frames, reticle pulse, variant borders; `.ip-scan-demo-flow` strip **defined but not rendered** | N/A |
| `/scan` page | `getUserMedia` → canvas → `assessFrameQuality` → `/api/embed/query` → `/api/scan` | **Yes** |
| `/api/scan` | Retrieve-then-verify: pgvector HNSW + structural verifier + phash fuse → `ScanResponse`; rate-limited; logs `scan_events` | **Yes** |
| `/api/embed/query` | Referenced by web + mobile scan clients | **Not in `apps/web/app/api/`** — live scan blocked until shipped |

**Landing is 100% simulated today** — correct for performance and privacy. Gaps are *presentation*: flow strip unwired, verbose duplicate copy, weaker “match” moment vs `/scan`.

### Recommendation: simulated primary, live only on `/scan`

| Approach | Landing? | Rationale |
|----------|----------|-----------|
| **Enhanced simulated demo** (`UseCaseDemo` + shared UI primitives) | **Yes — default** | No camera permission, no embed model weight, no rate limits, no `scan_events` / billing noise; fits §7 CSS-first budget |
| **Live mini-scanner** (camera + APIs) | **No** | Permission friction, embed latency, cost per impression, analytics pollution |
| **“Try a real scan” CTA** | **Yes — secondary** | Below demo → `/scan`. Honest handoff without landing camera |

Do **not** call `/api/scan` from landing auto-play or scroll — even one match logs events and may consume owner scan quota.

### Target UX flow (marketing)

```text
┌─────────────────────────────────────────────────────────┐
│  SCAN  →  MATCH  →  OPEN     ← flow strip (CSS sync)    │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐                                │
│  │  static frame       │  reticle on Capture / Scan     │
│  │  + variant styling  │  optional scan-line sweep (CSS) │
│  └─────────────────────┘                                │
│  [Upload]…[Scan & Open]  ← compact pill row              │
│  Stage word + 2 balanced lines (landing compact mode)   │
├─────────────────────────────────────────────────────────┤
│  Step “Scan & Open”: simulated match card               │
│  domain · title · ~94% match · “Demo” label             │
├─────────────────────────────────────────────────────────┤
│  Privacy note (1–2 balanced lines)                      │
│  [ TRY A REAL SCAN → ]  secondary CTA to `/scan`         │
└─────────────────────────────────────────────────────────┘
```

**Flow strip mapping** (wire `.ip-scan-demo-flow`):

| Active demo steps | Highlight |
|-------------------|-----------|
| Upload, Capture, Enhance | **SCAN** |
| Link, Approve | Hold **SCAN** or dim middle phase |
| Scan & Open (step 5) | **MATCH** (0–2s) then **OPEN** + result card (2–4s) |

Sync via step index + `data-active`. Prefer CSS `animation-delay` on step 5 over a second JS timer.

### Match result UX on marketing (simulated)

Mirror `/scan` success **visually**, not with live data:

| Element | `/scan` (live) | Landing (simulated) |
|---------|----------------|---------------------|
| Card | `.ip-scan-result-card`, domain, title, confidence %, CTA `/p/{slug}/go` | Same **classes**; CTA **demo-only** or disabled unless marketing portal slug |
| Confidence | `ScanResponse.confidence` | **Canned** (~94%) from `UseCaseConfig.destination` |
| Motion | `.ip-scan-motion-in`, badge **MATCHED** | Reuse on step 5; badge **MATCHED** / **OPEN** |
| Retry / bands | `matchRetryMessage` | **Hidden** on landing — auto-demo stays happy path |

**Next-gen cues (CSS-only):** accent rim on `.ip-demo-frame-matched`, reticle pulse, scan sweep, flow strip glow on **OPEN**, mono `94% · high` readout.

### Privacy copy placement

| Location | Role |
|----------|------|
| **Below demo**, above `/scan` CTA | Primary — short; no camera on this page |
| **Not in hero** | Avoid permission anxiety before value prop |
| **Static block** | Must not flicker with step auto-advance |
| **Footer / legal** | No duplicate long policy |

Suggested balanced lines:

1. This guide uses sample images — no camera on this page.  
2. On `/scan`, one photo is checked on device first; frames are not stored unless a match is logged.

Shared `ScanPrivacyNote` with `variant="landing" | "scan"` (copy only).

### Component sharing with `/scan`

**Share (presentational, props-driven):**

| Component | Role |
|-----------|------|
| `ScanFlowStrip` | `activePhase: 'scan' \| 'match' \| 'open'` |
| `ScanReticleOverlay` | Wraps `.ip-demo-reticle` |
| `ScanMatchCard` | `mode: 'demo' \| 'live'` |
| `ScanPrivacyNote` | Variant copy |

**Keep separate:**

| Surface | Why |
|---------|-----|
| Camera / canvas hook | Landing must not import `getUserMedia` |
| `assessFrameQuality` + embed | Live-only (`/scan`, mobile) |
| Phase state machine | Landing = carousel; borrow visuals only on step 5 |

**Orchestration:** `UseCaseDemo` (landing + modal) vs `ScanPage` (camera + API); both consume dumb UI primitives; styles in `globals.css`.

### Optional interactivity (still simulated)

1. **Tap-to-advance** — pause interval on interaction (`autoAdvance="after-interaction"` pattern from modal).
2. **“Simulate scan”** on step 5 — plays MATCH → OPEN once; no API.
3. **File upload on landing** — **reject v1** (implies real processing, adds JS).

### Guardrails

- One `setInterval` on landing (or CSS-only step-5 sub-phase).
- No `fetch` to `/api/scan` or `/api/embed/query` from landing.
- No `scan_events` / `scan_usage` from marketing demo.
- Lazy-load demo below fold if LCP regresses; `priorityFrames` for first two assets only.

### Pre-reqs (live `/scan`, not landing)

1. Ship `/api/embed/query` before pushing “Try real scan.”
2. Optional future: dedicated marketing portal slug for controlled live demo — still not on auto-play landing.

### Scan demo acceptance (adds to §2)

- [ ] Flow strip synced to step / step-5 sub-phase.
- [ ] Step 5 match card with demo label; no silent navigation to real portals.
- [ ] Privacy note + CTA to `/scan` below demo.
- [ ] Zero camera prompts on landing.
- [ ] §7 perf rules unchanged (single JS loop, CSS motion).

---

### §3 How it works (P4)

- **3-column grid** at scale ≥1.0: `repeat(3, 1fr)`, gap 20px, max-width 1000px.
- Each card: step num (40px), title (Syne ALL CAPS), 2 `BalancedText` lines.
- Optional: faint connecting line behind cards (1px `--grid-line` pseudo).
- Below 0.65 scale: stack to 1 column; section still `min-height: 100vh`.

**Acceptance criteria**

- [ ] Three cards abreast at 1440×900 reference scale.
- [ ] Section title **HOW IT WORKS** ALL CAPS centered.
- [ ] All card copy centered; no card taller than **36vh**.
- [ ] Glass rim tokens applied to step cards.

---

### §4 Why RQ Plus (P6)

- Same 3-column grid as §3; cards **shorter** than legacy vertical stack.
- Titles: **NO QR CODES NEEDED**, **UPDATE ANY TIME, NEVER REPRINT**, **RELIABLE SCANNING** (voice-memo capitalization).
- Card padding: 14–18px; title 13px ALL CAPS; body 13px muted.
- “The link does not move” ends line 2 of Update card (not orphaned line 3).

**Acceptance criteria**

- [ ] Three compact cards in one row at reference scale.
- [ ] Each card body is exactly **2 balanced lines**, centered.
- [ ] No card taller than **32vh** at scale 1.0.
- [ ] Section fits one viewport with title.

---

### §5 Use cases (P5)

- Show **3 cards** on landing (`UseCasesSection` `compact` + `limit={3}`).
- Thumb aspect **4:3**; thumb height cap **22vh**.
- Title ALL CAPS + **2 balanced lines** always visible.
- Modal unchanged; landing row is preview only.
- Voice-memo line breaks for card copy (implement in `use-cases` data when transcript lands):

| Card | Line 1 | Line 2 |
|------|--------|--------|
| Posters & flyers | Printed materials that change with your content | Update the link without reprinting |
| Menus | The menu image itself is scannable | Change prices & bring up items instantly |
| Event tickets | Real-time — schedule, venue, & refunds | *(single line if needed)* |
| Product packaging | Packaging becomes a channel to your brand | Manual, offers, & unboxing |

**Acceptance criteria**

- [ ] Three cards visible without clipped thumbs or copy at 1440×900.
- [ ] Click opens existing `UseCaseModal`.
- [ ] Card hover: rim intensify + subtle glow (no layout shift).
- [ ] Thumbs `loading="lazy"`; aspect 4:3 enforced.

---

### §6 Pricing preview

- Title: **PRICING** (ALL CAPS).
- Two balanced lines centered:

  1. Free for 3 portals & 200 scans/month.  
  2. Pro plans start at $19 per month.

- Secondary button: **VIEW FULL PRICING →** → `/pricing`.
- Vertically centered in viewport; **no** pricing table on landing.

**Acceptance criteria**

- [ ] Copy & button centered.
- [ ] Section fits one viewport with comfortable vertical centering.
- [ ] No extra marketing paragraphs.

---

### §7 Gallery CTA (final conversion)

**Concept:** Last viewport is a **gallery threshold** — visitor sees they're joining a living library of scannable images, not just signing up.

**Layout**

```
┌──────────────────────────────────────────────┐
│     ┌────┐  ┌────┐  ┌────┐   ← 3 thumb tiles │
│     │    │  │    │  │    │     (use-case thumbs, dimmed) │
│     └────┘  └────┘  └────┘                   │
│   Ready to open the door?                    │
│   Create your first portal in under a minute.│
│   Explore examples — dark or light theme.    │
│   [CREATE FREE ACCOUNT]  [BROWSE USE CASES]  │
└──────────────────────────────────────────────┘
```

- Glowing glass card (`.ip-card-glow`); max width **520px**.
- Headline: “Ready to **open the door**?” with accent span on “open the door”.
- Thumb strip: 3 small 4:3 tiles from first use cases, 48px tall, 8px gap, opacity 0.85, decorative (`aria-hidden`).
- Primary: **CREATE FREE ACCOUNT** → `/login`.
- Secondary: **BROWSE USE CASES** → scroll to `#use-cases` or open first modal *(implementation: hash link preferred)*.

**Acceptance criteria**

- [ ] Card + thumb strip + 2 CTAs fit one viewport at 1440×900.
- [ ] Glass rim + glow match Luminous tokens.
- [ ] Both CTAs ALL CAPS; primary uses accent fill.
- [ ] Thumb strip does not intercept clicks (decorative only).

---

## 6. Auth & dashboard surfaces

### Confirm email (P7)

- Max card width: **360px** (`.ip-auth-card-confirm`).
- Reduce vertical padding **15%**; tighten step list to 3 short lines centered.
- Badge: **ALMOST THERE** (mono accent pill).
- Title: **CONFIRM YOUR EMAIL** (ALL CAPS).
- Remove stray/debug copy.
- Buttons: full-width stack — inbox shortcut (if detected), resend, confirm check.
- Card glass rim in Luminous style.

**Acceptance criteria**

- [ ] Card ≤ 360px wide, vertically compact (≤ 55vh at reference scale).
- [ ] All copy centered.

### Email confirmed / welcome (P7 variant)

- Badge: **EMAIL CONFIRMED**; title: **YOU ARE IN**.
- Two balanced lines + single **DASHBOARD** CTA.

### Dashboard first-run checklist (P8)

- Section title: **FIRST-RUN CHECKLIST** (ALL CAPS).
- Lead: 2 balanced lines, centered.
- **Got it** dismiss: centered below title (symmetry).
- Step pills: horizontal, centered; active = teal ring + glow.
- Step card: max-width **420px**, centered.
- Back / Next: centered pair below card.

**Acceptance criteria**

- [ ] Wizard horizontally centered on dashboard canvas.
- [ ] Rim/glass tokens consistent with landing.

---

## 7. Performance & implementation constraints

| Rule | Detail |
|------|--------|
| CSS-first | Animations via CSS only on landing; `ScanDemo` interval stays sole JS loop |
| Images | `loading="lazy"` except first demo frame |
| Blur | Max **one** `backdrop-filter` layer per visible card |
| Fonts | Continue `next/font` for Syne, DM Sans, JetBrains — no extra families |
| QR SVG | Server-render once in `HeroHeadline` — no client QR lib on landing |
| Reduced motion | All new animations gated by existing `prefers-reduced-motion` block |
| No new deps | No Framer Motion, GSAP, canvas particles |

### Global acceptance checklist

- [ ] `LandingScaleShell` wraps nav, main, footer, HelpChat.
- [ ] At 1440×900, sections 1–7 show primary content without inner scroll.
- [ ] Section titles ALL CAPS, centered, Syne.
- [ ] Copy uses `BalancedText` — no orphan line lengths.
- [ ] Light theme default on marketing; dark toggle works with Luminous tokens.
- [ ] Lighthouse: no regression from glass (blur used sparingly).

---

## 8. Copy reference (authoritative semantics)

Hero lead (balanced, voice-memo aligned):

1. Turn any image into a doorway.  
2. Upload it, link it anywhere — the image is the key.  
3. Anyone with a camera phone can open your link in seconds.

Primary CTA: **GET STARTED FREE**  
Secondary CTA: **SEE HOW IT WORKS ↓**

Flow strip: **SCAN → MATCH → OPEN**

---

## 9. Out of scope

- Full pricing page redesign, workshop layout, scan page motion (separate specs).
- New use-case demo assets (transcript line-break tweaks only).
- Voice memo segments 54–57 (wait for transcript).
- Git commit / deploy — user initiates.

---

## 10. Spec self-review

| Check | Result |
|-------|--------|
| Placeholders / TBD | None — scale thresholds, sizes, tokens, and per-section AC specified |
| Brand naming | **RQ Plus** throughout; rub.pub as production URL |
| Internal consistency | Luminous Portal chosen; B/C mined for typography & instrument patterns only |
| Scope | `LandingScaleShell` + section CSS + Luminous tokens + auth/onboarding polish |
| Ambiguity | Gallery CTA = §7 final section (teaser thumbs + dual CTAs); footer non-snapping |
| Conflicts with layout rules | Landing scale shell matches `layout-and-copy.mdc` 1440 formula |
| P1–P8 coverage | All eight references mapped in §1 and §5–6 |
| Code alignment | Hero copy & CTA labels updated to match voice memo vs current `page.tsx` |

**Authoritative rule:** If implementation in `page.tsx` / `globals.css` conflicts with this document, **this spec wins**.

---

## Implementation Blueprint

Full file-by-file plan, component decomposition, CSS/motion/performance strategy, build sequence, and risk register:

→ [`2026-06-10-landing-future-design-blueprint.md`](./2026-06-10-landing-future-design-blueprint.md)
