# Filter Section Selector Design

## Problem

FilterPanel renders all 7 filter sections (timeline, people, location, camera, tags, rating,
media) at once, taking up excessive vertical space. Users can't customize which filters they see.

## Solution

Add an icon toggle row at the top of FilterPanel. Each filter type is represented by its
existing icon. Click to toggle section visibility. Visible sections persist in localStorage.

## Visual Design

A horizontal row of icon buttons (30x30px, 2px gaps) centered below the panel header. Fits
in one row at 256px (~46px height with padding).

- **Active icons**: `bg-primary/10 text-primary` — section visible below
- **Inactive icons**: `text-gray-400 dark:text-gray-600` — section hidden
- **Hover**: subtle background (`hover:bg-subtle`)
- **Active-but-hidden dot**: if a section is hidden but has an active filter, its icon shows a
  small dot indicator (same markup as the collapsed panel strip dot: absolute-positioned
  `bg-immich-primary` circle)
- **Reuses existing `sectionIcons` and `sectionTitles` maps** already in filter-panel.svelte
- **data-testid**: `section-toggle-{name}` (e.g., `section-toggle-people`)

## State Management

Use raw `localStorage` with a `browser` guard from `$app/environment` for SSR safety.

```typescript
import { browser } from '$app/environment';

const STORAGE_KEY = 'gallery-filter-visible-sections';

function loadVisibleSections(configSections: FilterSection[]): Set<FilterSection> {
  if (browser) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as string[];
        const valid = parsed.filter((s): s is FilterSection => configSections.includes(s as FilterSection));
        if (valid.length > 0) return new Set(valid);
      }
    } catch {
      /* corrupted JSON or localStorage unavailable — fall through to default */
    }
  }
  return new Set(configSections);
}

let visibleSections = $state(loadVisibleSections(config.sections));
```

Write-only `$effect` for persistence (no read-then-write loop):

```typescript
$effect(() => {
  if (browser) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...visibleSections]));
    } catch {
      /* localStorage unavailable */
    }
  }
});
```

### Toggle function

```typescript
function toggleSection(section: FilterSection) {
  const next = new Set(visibleSections);
  if (next.has(section)) {
    next.delete(section);
  } else {
    next.add(section);
  }
  visibleSections = next;
}

function showAllSections() {
  visibleSections = new Set(config.sections);
}
```

Default: all sections from `config.sections` visible (same as today).

## Template Changes

### Icon toggle row

After the panel header, before the filter sections `<div class="pt-4">`. Only rendered in
expanded state (not in collapsed icon strip):

```svelte
<div
  class="flex items-center justify-center gap-0.5 border-b border-gray-200 px-3 py-2 dark:border-gray-700"
  data-testid="section-toggle-row"
>
  {#each config.sections as section (section)}
    <button
      type="button"
      class="relative flex h-[30px] w-[30px] items-center justify-center rounded-lg transition-colors
        {visibleSections.has(section)
          ? 'bg-primary/10 text-primary'
          : 'text-gray-400 hover:bg-subtle hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400'}"
      onclick={() => toggleSection(section)}
      aria-label={sectionTitles[section]}
      aria-pressed={visibleSections.has(section)}
      title={sectionTitles[section]}
      data-testid="section-toggle-{section}"
    >
      <Icon icon={sectionIcons[section]} size="16" />
      {#if !visibleSections.has(section) && hasActiveFilter(section)}
        <span
          class="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border-[1.5px] border-light bg-immich-primary dark:bg-immich-dark-primary"
          data-testid="section-toggle-dot-{section}"
        ></span>
      {/if}
    </button>
  {/each}
</div>
```

### Filter sections with visibility gate

```svelte
{#each config.sections as section (section)}
  {#if visibleSections.has(section)}
    <FilterSection title={sectionTitles[section]} testId={section}>
      ...existing content unchanged...
    </FilterSection>
  {/if}
{/each}
```

### All-hidden empty state

```svelte
{#if visibleSections.size === 0}
  <div class="flex flex-col items-center gap-2 px-4 py-8 text-center">
    <p class="text-xs text-gray-500 dark:text-gray-400">Click an icon above to show filters</p>
    <button
      type="button"
      class="text-xs font-medium text-primary hover:underline"
      onclick={showAllSections}
      data-testid="show-all-sections"
    >
      Show all
    </button>
  </div>
{/if}
```

## Fix: hasActiveFilter for timeline

The existing `hasActiveFilter` function returns `false` for `'timeline'` (falls through to
default). Add a case so the dot indicator works for timeline too:

```typescript
case 'timeline': {
  return filters.selectedYear !== undefined;
}
```

## Edge Cases

- **All sections hidden**: Shows empty state with "Show all" link
- **Active-but-hidden**: Dot indicator on the toggle icon, filter stays active in `filters`
  state, ActiveFiltersBar still shows the chip
- **Stale localStorage**: Entries for sections not in `config.sections` are filtered out on load
- **Corrupted localStorage**: Invalid JSON falls back to all-visible default
- **Partial localStorage**: If localStorage stores `['people']` and config has 7 sections, only
  `people` is visible — the stored set is the user's intentional choice. Falls back to
  all-visible only if the filtered result is empty (all stored entries were stale)
- **SSR**: `browser` guard from `$app/environment` prevents localStorage access during SSR
- **Collapsed panel**: Toggle row only appears in expanded state. Collapsed icon strip is
  unaffected and always shows all config sections
- **Collapse/expand cycle**: `visibleSections` is component state, survives panel
  collapse/expand (only the `collapsed` boolean toggles)
- **Single section config**: Hiding the only section triggers all-hidden empty state
- **Empty sections config**: No toggle row rendered (empty `config.sections` array)

## Accessibility

- `aria-label={sectionTitles[section]}` on each toggle button
- `aria-pressed={visibleSections.has(section)}` reflects visibility state
- `title` attribute provides native tooltip on hover

## Files Changed

1. `web/src/lib/components/filter-panel/filter-panel.svelte` — icon toggle row, visibility
   state, localStorage persistence, `hasActiveFilter` timeline fix
2. `web/src/lib/components/filter-panel/__tests__/filter-panel.spec.ts` — 28 test cases

## Test Cases

### Rendering

1. Toggle row renders icons for all configured sections
2. Toggle row does not render icons for unconfigured sections
3. Default state: all sections visible when no localStorage value
4. Toggle row does not appear in collapsed panel state
5. Empty sections config: no crash, no toggle row

### Toggle Interaction

6. Click active icon hides the corresponding section from DOM
7. Click inactive icon restores the section to DOM
8. Other sections remain unaffected when one is toggled
9. Multiple sections can be hidden simultaneously
10. Rapid double-click returns to original state
11. Single-section config: hiding it triggers all-hidden state

### All-Hidden Empty State

12. All sections hidden: shows empty state message with "Show all" link
13. "Show all" click restores all sections to visible
14. "Show all" updates all toggle icons to active/pressed state

### Active-but-Hidden Indicator

15. Hidden section with active filter shows dot indicator on toggle icon
16. Hidden section without active filter shows no dot
17. Timeline section with selectedYear shows dot when hidden

### Accessibility

18. `aria-pressed="true"` on visible section toggle icons
19. `aria-pressed="false"` on hidden section toggle icons
20. `aria-pressed` updates correctly after toggle click

### localStorage Persistence

21. Toggling a section writes updated visibility to localStorage
22. Component reads localStorage on mount and restores visibility
23. Partial localStorage (e.g., `['people']` stored, 7 configured): only stored sections visible
24. Stale/unknown section names in localStorage: ignored without error
25. Invalid/corrupted JSON in localStorage: falls back to all-visible default
26. localStorage key is `gallery-filter-visible-sections`

### State Preservation

27. Visibility state survives panel collapse/expand cycle
28. Existing filter interactions still work on visible sections (regression)

## Out of Scope

- No per-space persistence (global localStorage only — user view preference)
- No drag-to-reorder sections
- No changes to the collapsed panel icon strip
- No server-side persistence
