# Use Case Modal Demos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add six interactive use-case cards with lazy-loaded modal demos sharing a parameterized `UseCaseDemo` extracted from `ScanDemo`.

**Architecture:** Central config in `lib/use-cases.ts`; `UseCaseDemo` owns step state and auto-advance modes; `ScanDemo` becomes a thin hero wrapper; `UseCasesSection` + `UseCaseModal` handle dialog a11y and dynamic import; WebP assets under `public/demo/{slug}/` generated via a one-off Sharp script.

**Tech Stack:** Next.js 15 App Router, React 18, next/image, TypeScript, Sharp (asset script only)

---

### Task 1: Demo asset generation

**Files:**
- Create: `apps/web/scripts/generate-demo-assets.mjs`
- Create: `apps/web/public/demo/{slug}/reference.webp`, `scan.webp`, `thumb.webp` (×6 slugs)

- [ ] **Step 1:** Add Node script that converts existing poster PNGs for `posters-flyers` and renders category-specific SVG print mocks for other slugs via Sharp → WebP (400×500 reference, 400×500 scan with skew, 280×350 thumb).

Run: `node apps/web/scripts/generate-demo-assets.mjs`  
Expected: 18 WebP files under `apps/web/public/demo/`

- [ ] **Step 2:** Verify file sizes & paths match slug list in spec.

---

### Task 2: Shared config & demo component

**Files:**
- Create: `apps/web/lib/use-cases.ts`
- Create: `apps/web/components/landing/UseCaseDemo.tsx`
- Modify: `apps/web/components/landing/ScanDemo.tsx`

- [ ] **Step 1:** Define `UseCaseSlug`, `USE_CASES` array (slug, title, lines, destination, categoryLabel).

- [ ] **Step 2:** Implement `UseCaseDemo` with props:

```typescript
type UseCaseDemoProps = {
  slug: UseCaseSlug;
  autoAdvance?: "immediate" | "after-interaction";
  className?: string;
};
```

Export `buildDemoSteps(slug)` using `/demo/${slug}/reference.webp` and `scan.webp`.

- [ ] **Step 3:** Auto-advance: `immediate` → `setInterval` 6500ms on mount; `after-interaction` → wait for `onPointerDown` / `onKeyDown` on root, then start interval.

- [ ] **Step 4:** Replace `ScanDemo` body with:

```tsx
export function ScanDemo() {
  return (
    <UseCaseDemo slug="posters-flyers" autoAdvance="immediate" className="ip-demo ip-animate-in ip-animate-in-delay-2" />
  );
}
```

---

### Task 3: Modal & use cases section

**Files:**
- Create: `apps/web/components/landing/UseCaseModal.tsx`
- Create: `apps/web/components/landing/UseCasesSection.tsx`
- Modify: `apps/web/app/page.tsx`

- [ ] **Step 1:** `UseCaseModal` — portal-less fixed overlay, focus trap effect, scroll lock, dynamic import:

```tsx
const UseCaseDemo = dynamic(() => import("./UseCaseDemo").then((m) => m.UseCaseDemo), { ssr: false });
```

- [ ] **Step 2:** `UseCasesSection` — map `USE_CASES`, button cards with thumb image, `openSlug` state, pass to modal.

- [ ] **Step 3:** `page.tsx` — remove inline `useCases` array; render `<UseCasesSection />` in use cases section.

---

### Task 4: Styles

**Files:**
- Modify: `apps/web/app/globals.css`

- [ ] **Step 1:** Add `.ip-use-case-card`, `.ip-use-case-card-thumb`, `.ip-use-case-card-title`, `.ip-use-case-modal-overlay`, `.ip-use-case-modal-panel`, `.ip-use-case-modal-close`, `.ip-use-case-modal-header`.

Follow existing `ip-modal-overlay` blur and `ip-demo` spacing; panel wider than 400px dashboard modals.

---

### Task 5: Verify & commit

**Files:**
- Modify: `docs/PROJECT-TASKS.md` (work log note, optional)

- [ ] **Step 1:** Run typecheck

```bash
cd apps/web && pnpm typecheck
```

Expected: exit 0

- [ ] **Step 2:** Commit spec, plan, code, assets

```bash
git add docs/superpowers apps/web
git commit -m "$(cat <<'EOF'
feat(landing): use-case modal demos with shared UseCaseDemo

User-approved design: six editorial cards open lazy-loaded modal demos
per category without hurting LCP; hero ScanDemo shares extracted component.
EOF
)"
```
