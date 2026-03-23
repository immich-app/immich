# Collapsible SpaceHero Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the SpaceHero collapsible from 450px to a 56px compact bar, with auto-collapse when filters activate.

**Architecture:** Two-file change. SpaceHero gets `collapsed`/`onToggleCollapse` props and renders either expanded or collapsed content via `{#if}`. The space page owns the collapsed state and wires auto-collapse via a `$effect` watching filter count.

**Tech Stack:** Svelte 5 (runes), Tailwind CSS 4, @immich/ui, @mdi/js icons, Vitest + @testing-library/svelte

**Design doc:** `docs/plans/2026-03-23-collapsible-space-hero-design.md`

---

### Task 1: Write failing tests for collapsed state

**Files:**

- Modify: `web/src/lib/components/spaces/space-hero.spec.ts`

**Step 1: Add collapse toggle and collapsed bar tests**

Add these tests at the end of the existing `describe` block:

```typescript
// --- Collapse toggle in expanded mode ---

it('should show collapse toggle button when onToggleCollapse is provided', () => {
  render(SpaceHero, {
    space: makeSpace(),
    memberCount: 3,
    assetCount: 42,
    onToggleCollapse: vi.fn(),
  });
  expect(screen.getByTestId('hero-collapse-toggle')).toBeInTheDocument();
});

it('should not show collapse toggle when onToggleCollapse is not provided', () => {
  render(SpaceHero, {
    space: makeSpace(),
    memberCount: 3,
    assetCount: 42,
  });
  expect(screen.queryByTestId('hero-collapse-toggle')).not.toBeInTheDocument();
});

it('should call onToggleCollapse when collapse button is clicked', () => {
  const onToggleCollapse = vi.fn();
  render(SpaceHero, {
    space: makeSpace(),
    memberCount: 3,
    assetCount: 42,
    onToggleCollapse,
  });
  screen.getByTestId('hero-collapse-toggle').click();
  expect(onToggleCollapse).toHaveBeenCalled();
});

it('should have correct aria-expanded on collapse toggle', () => {
  render(SpaceHero, {
    space: makeSpace(),
    memberCount: 3,
    assetCount: 42,
    collapsed: false,
    onToggleCollapse: vi.fn(),
  });
  expect(screen.getByTestId('hero-collapse-toggle')).toHaveAttribute('aria-expanded', 'true');
});

it('should not show collapse toggle during repositioning', () => {
  render(SpaceHero, {
    space: makeSpace({ thumbnailAssetId: 'asset-1' }),
    memberCount: 1,
    assetCount: 0,
    onToggleCollapse: vi.fn(),
    repositioning: true,
    onSavePosition: vi.fn(),
    onCancelReposition: vi.fn(),
  });
  expect(screen.queryByTestId('hero-collapse-toggle')).not.toBeInTheDocument();
});

// --- Collapsed bar rendering ---

it('should render collapsed bar when collapsed is true', () => {
  render(SpaceHero, {
    space: makeSpace({ name: 'Family Trip' }),
    memberCount: 3,
    assetCount: 42,
    collapsed: true,
    onToggleCollapse: vi.fn(),
  });
  expect(screen.getByTestId('hero-collapsed-bar')).toBeInTheDocument();
  expect(screen.getByTestId('hero-collapsed-name')).toHaveTextContent('Family Trip');
  expect(screen.getByTestId('hero-collapsed-photo-count')).toHaveTextContent('42');
  expect(screen.getByTestId('hero-collapsed-member-count')).toHaveTextContent('3');
  // Expanded content should not be present
  expect(screen.queryByTestId('hero-title')).not.toBeInTheDocument();
  expect(screen.queryByTestId('hero-photo-count')).not.toBeInTheDocument();
  expect(screen.queryByTestId('hero-description')).not.toBeInTheDocument();
});

it('should set container height to 56px when collapsed', () => {
  render(SpaceHero, {
    space: makeSpace(),
    memberCount: 3,
    assetCount: 42,
    collapsed: true,
    onToggleCollapse: vi.fn(),
  });
  const hero = screen.getByTestId('space-hero');
  expect(hero.style.height).toBe('56px');
});

it('should set container height to 450px when expanded', () => {
  render(SpaceHero, {
    space: makeSpace(),
    memberCount: 3,
    assetCount: 42,
    collapsed: false,
  });
  const hero = screen.getByTestId('space-hero');
  expect(hero.style.height).toBe('450px');
});

it('should show role badge in collapsed bar', () => {
  render(SpaceHero, {
    space: makeSpace(),
    memberCount: 3,
    assetCount: 42,
    collapsed: true,
    onToggleCollapse: vi.fn(),
    currentRole: 'editor',
  });
  expect(screen.getByTestId('hero-collapsed-role')).toHaveTextContent('Editor');
});

it('should show people count as plain text in collapsed bar', () => {
  render(SpaceHero, {
    space: makeSpace(),
    memberCount: 3,
    assetCount: 42,
    collapsed: true,
    onToggleCollapse: vi.fn(),
    faceRecognitionEnabled: true,
    peopleCount: 5,
    spaceId: 'space-1',
  });
  const el = screen.getByTestId('hero-collapsed-people-count');
  expect(el).toHaveTextContent('5');
  // Should be a span, not a link
  expect(el.tagName).toBe('SPAN');
});

it('should not show people count in collapsed bar when faceRecognitionEnabled is false', () => {
  render(SpaceHero, {
    space: makeSpace(),
    memberCount: 3,
    assetCount: 42,
    collapsed: true,
    onToggleCollapse: vi.fn(),
    faceRecognitionEnabled: false,
    peopleCount: 5,
  });
  expect(screen.queryByTestId('hero-collapsed-people-count')).not.toBeInTheDocument();
});

it('should show cover image behind collapsed bar when cover exists', () => {
  render(SpaceHero, {
    space: makeSpace({ thumbnailAssetId: 'asset-1' }),
    memberCount: 3,
    assetCount: 42,
    collapsed: true,
    onToggleCollapse: vi.fn(),
  });
  expect(screen.getByTestId('hero-collapsed-bar')).toBeInTheDocument();
  expect(screen.getByTestId('hero-cover-image')).toBeInTheDocument();
});

it('should show gradient behind collapsed bar when no cover', () => {
  render(SpaceHero, {
    space: makeSpace({ thumbnailAssetId: null }),
    memberCount: 3,
    assetCount: 42,
    collapsed: true,
    onToggleCollapse: vi.fn(),
  });
  expect(screen.getByTestId('hero-collapsed-bar')).toBeInTheDocument();
  expect(screen.getByTestId('hero-gradient')).toBeInTheDocument();
});

it('should render collapsed bar without expand button when onToggleCollapse is not provided', () => {
  render(SpaceHero, {
    space: makeSpace({ name: 'Locked' }),
    memberCount: 1,
    assetCount: 10,
    collapsed: true,
  });
  expect(screen.getByTestId('hero-collapsed-bar')).toBeInTheDocument();
  expect(screen.queryByTestId('hero-expand-toggle')).not.toBeInTheDocument();
});

// --- Expand toggle in collapsed bar ---

it('should call onToggleCollapse when expand button in collapsed bar is clicked', () => {
  const onToggleCollapse = vi.fn();
  render(SpaceHero, {
    space: makeSpace(),
    memberCount: 3,
    assetCount: 42,
    collapsed: true,
    onToggleCollapse,
  });
  screen.getByTestId('hero-expand-toggle').click();
  expect(onToggleCollapse).toHaveBeenCalled();
});

it('should have correct aria-expanded on expand toggle in collapsed bar', () => {
  render(SpaceHero, {
    space: makeSpace(),
    memberCount: 3,
    assetCount: 42,
    collapsed: true,
    onToggleCollapse: vi.fn(),
  });
  expect(screen.getByTestId('hero-expand-toggle')).toHaveAttribute('aria-expanded', 'false');
});

// --- Repositioning override ---

it('should force expanded when repositioning even if collapsed', () => {
  render(SpaceHero, {
    space: makeSpace({ thumbnailAssetId: 'asset-1' }),
    memberCount: 1,
    assetCount: 0,
    collapsed: true,
    onToggleCollapse: vi.fn(),
    repositioning: true,
    onSavePosition: vi.fn(),
    onCancelReposition: vi.fn(),
  });
  // Should show reposition controls (expanded), not collapsed bar
  expect(screen.getByTestId('reposition-controls')).toBeInTheDocument();
  expect(screen.queryByTestId('hero-collapsed-bar')).not.toBeInTheDocument();
});
```

**Step 2: Run tests to verify they fail**

Run: `cd web && pnpm test -- --run src/lib/components/spaces/space-hero.spec.ts`

Expected: All new tests FAIL (props and test IDs don't exist yet).

**Step 3: Commit failing tests**

```bash
git add web/src/lib/components/spaces/space-hero.spec.ts
git commit -m "test: add failing tests for collapsible space hero"
```

---

### Task 2: Implement collapsed state in SpaceHero

**Files:**

- Modify: `web/src/lib/components/spaces/space-hero.svelte`

**Step 1: Add new props and derived state**

In the `<script>` block, add `mdiChevronUp` and `mdiChevronDown` to the `@mdi/js` import:

```typescript
import {
  mdiAccountGroupOutline,
  mdiAccountMultipleOutline,
  mdiCameraOutline,
  mdiChevronDown,
  mdiChevronUp,
  mdiCursorMove,
  mdiImageEditOutline,
} from '@mdi/js';
```

Add two new props to the `Props` interface:

```typescript
collapsed?: boolean;
onToggleCollapse?: () => void;
```

Add to the destructuring:

```typescript
collapsed = false,
onToggleCollapse,
```

Add a derived for the effective display state (repositioning forces expanded):

```typescript
let isCollapsed = $derived(collapsed && !repositioning);
let effectiveHeight = $derived(isCollapsed ? 56 : height);
```

**Step 2: Update container div to use effectiveHeight with transition**

Replace the opening container div (line 102):

```svelte
<div class="relative w-full overflow-hidden rounded-xl" style="height: {effectiveHeight}px; transition: height 300ms ease;" data-testid="space-hero">
```

**Step 3: Add collapsed bar content**

Right after the background image/gradient block (after line 119, before `{#if repositioning}`), add the collapsed content. Restructure the content section so it's `{#if isCollapsed}...collapsed bar...{:else}...existing expanded content...{/if}`.

The full template becomes (only showing the structural changes — the background img/gradient stays as-is outside the if block):

After the background (cover image or gradient), the content area becomes:

```svelte
{#if isCollapsed}
  <!-- Collapsed compact bar -->
  <div class="absolute inset-0 bg-black/60"></div>
  <div class="relative flex h-full items-center gap-3 px-4" data-testid="hero-collapsed-bar">
    <span class="min-w-0 flex-1 truncate text-base font-semibold text-white drop-shadow-md" data-testid="hero-collapsed-name">
      {space.name}
    </span>
    <span
      class="hidden items-center gap-1.5 rounded-full bg-white/20 px-2 py-0.5 text-xs text-white backdrop-blur-sm sm:inline-flex"
      data-testid="hero-collapsed-photo-count"
    >
      <Icon icon={mdiCameraOutline} size="14" />
      {assetCount}
      {$t('photos')}
    </span>
    <span
      class="hidden items-center gap-1.5 rounded-full bg-white/20 px-2 py-0.5 text-xs text-white backdrop-blur-sm sm:inline-flex"
      data-testid="hero-collapsed-member-count"
    >
      <Icon icon={mdiAccountMultipleOutline} size="14" />
      {memberCount}
      {$t('members')}
    </span>
    {#if faceRecognitionEnabled && peopleCount && peopleCount > 0}
      <span
        class="hidden items-center gap-1.5 rounded-full bg-white/20 px-2 py-0.5 text-xs text-white backdrop-blur-sm sm:inline-flex"
        data-testid="hero-collapsed-people-count"
      >
        <Icon icon={mdiAccountGroupOutline} size="14" />
        {peopleCount}
        {$t('people')}
      </span>
    {/if}
    {#if currentRole}
      <span
        class="hidden items-center rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium capitalize text-white backdrop-blur-sm sm:inline-flex"
        data-testid="hero-collapsed-role"
      >
        {roleLabels[currentRole] ?? currentRole}
      </span>
    {/if}
    {#if onToggleCollapse}
      <button
        type="button"
        class="rounded-full bg-white/20 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
        onclick={onToggleCollapse}
        aria-expanded="false"
        aria-label="Expand space header"
        data-testid="hero-expand-toggle"
      >
        <Icon icon={mdiChevronDown} size="16" />
      </button>
    {/if}
  </div>
{:else if repositioning}
  <!-- existing reposition mode content (lines 122-153, unchanged) -->
{:else}
  <!-- existing expanded content (lines 154-251, unchanged) -->

  <!-- ADD collapse toggle at end of badges row (inside the badges div, after role badge) -->
{/if}
```

**Step 4: Add collapse toggle button in expanded mode**

Inside the existing badges `<div>` (the `mt-2 flex flex-wrap` div), after the role badge `{/if}` (line 248), add the collapse button:

```svelte
{#if onToggleCollapse}
  <button
    type="button"
    class="inline-flex items-center rounded-full bg-white/20 p-1 backdrop-blur-sm transition-colors hover:bg-white/30"
    onclick={onToggleCollapse}
    aria-expanded="true"
    aria-label="Collapse space header"
    data-testid="hero-collapse-toggle"
  >
    <Icon icon={mdiChevronUp} size="16" />
  </button>
{/if}
```

**Step 5: Run tests to verify they pass**

Run: `cd web && pnpm test -- --run src/lib/components/spaces/space-hero.spec.ts`

Expected: ALL tests pass (old + new).

**Step 6: Run lint and format**

Run: `cd web && npx prettier --write src/lib/components/spaces/space-hero.svelte && npx eslint --fix src/lib/components/spaces/space-hero.svelte`

**Step 7: Commit**

```bash
git add web/src/lib/components/spaces/space-hero.svelte web/src/lib/components/spaces/space-hero.spec.ts
git commit -m "feat: add collapsible state to SpaceHero component"
```

---

### Task 3: Wire up collapsed state and auto-collapse in space page

**Files:**

- Modify: `web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte`

**Step 1: Add heroCollapsed state and auto-collapse effect**

In the `<script>` block, after the existing filter state (around line 111, after `let tagNames = ...`), add:

```typescript
let heroCollapsed = $state(false);
let prevFilterCount = 0;

$effect(() => {
  const count = getActiveFilterCount(filters);
  if (count > 0 && prevFilterCount === 0) {
    heroCollapsed = true;
  }
  prevFilterCount = count;
});
```

**Step 2: Pass new props to SpaceHero**

In the template, find the `<SpaceHero>` usage (around line 690) and add the two new props:

```svelte
<SpaceHero
  {space}
  memberCount={members.length}
  assetCount={space.assetCount ?? 0}
  currentRole={currentMember?.role}
  gradientClass={spaceGradient}
  onSetCover={isEditor ? () => (viewMode = 'select-cover') : undefined}
  onReposition={isEditor && space.thumbnailAssetId ? handleReposition : undefined}
  {repositioning}
  onSavePosition={handleSavePosition}
  onCancelReposition={handleCancelReposition}
  peopleCount={spacePeople.length}
  faceRecognitionEnabled={space.faceRecognitionEnabled}
  spaceId={space.id}
  collapsed={heroCollapsed}
  onToggleCollapse={() => (heroCollapsed = !heroCollapsed)}
/>
```

**Step 3: Run lint and format**

Run: `cd web && npx prettier --write src/routes/\(user\)/spaces/\[spaceId\]/\[\[photos=photos\]\]/\[\[assetId=id\]\]/+page.svelte`

**Step 4: Run all space-hero tests to make sure nothing broke**

Run: `cd web && pnpm test -- --run src/lib/components/spaces/space-hero.spec.ts`

Expected: ALL tests pass.

**Step 5: Run type check**

Run: `cd web && npx tsc --noEmit`

Expected: No type errors.

**Step 6: Commit**

```bash
git add web/src/routes/\(user\)/spaces/\[spaceId\]/\[\[photos=photos\]\]/\[\[assetId=id\]\]/+page.svelte
git commit -m "feat: wire collapsible hero state with auto-collapse on filter activation"
```

---

### Task 4: Manual visual verification and final cleanup

**Step 1: Verify visually in dev environment**

Run `make dev` (if not already running) and test:

1. Navigate to a space with a cover photo — hero shows at 450px with collapse chevron in badge row
2. Click the chevron — hero smoothly animates to 56px compact bar showing name + badges
3. Click expand chevron in collapsed bar — hero expands back
4. Activate a filter (e.g., pick a person or media type) — hero auto-collapses
5. Change the filter — hero stays collapsed
6. Clear all filters — hero stays collapsed (manual expand needed)
7. While collapsed, enter repositioning mode — hero expands automatically
8. Save/cancel reposition — hero returns to collapsed state
9. Check mobile width (<500px) — collapsed bar hides badges, shows just name + expand

**Step 2: Run full web test suite**

Run: `cd web && pnpm test`

Expected: All tests pass.

**Step 3: Run lint on all changed files**

Run: `make lint-web && make check-web`

Expected: Zero warnings, zero errors.

**Step 4: Final commit if any cleanup was needed**

Only if Step 2 or 3 revealed issues that required fixes.
