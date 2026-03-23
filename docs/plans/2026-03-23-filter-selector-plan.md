# Filter Section Selector Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an icon toggle row to FilterPanel so users can show/hide individual filter sections, with visibility persisted in localStorage.

**Architecture:** A horizontal row of icon buttons renders below the panel header (expanded state only). Each icon toggles a filter section's visibility. Visibility is tracked in a `Set<FilterSection>` initialized from localStorage (falling back to all-visible). A write-only `$effect` persists changes. Hidden sections with active filters show a dot indicator on their toggle icon.

**Tech Stack:** Svelte 5, Tailwind CSS 4, Vitest + @testing-library/svelte

**Design doc:** `docs/plans/2026-03-23-filter-selector-design.md`

---

## Task 1: Write failing tests for filter section selector

**Files:**

- Modify: `web/src/lib/components/filter-panel/__tests__/filter-panel.spec.ts`

**Step 1: Add 28 test cases in a new describe block**

Open `web/src/lib/components/filter-panel/__tests__/filter-panel.spec.ts` (currently 118 lines). Add the following `describe('Section Selector', ...)` block after the existing `describe('FilterPanel', ...)` block (after line 118).

The full test file after modification should be:

```typescript
import { fireEvent, render, screen } from '@testing-library/svelte';
import { createFilterState } from '../filter-panel';
import FilterPanel from '../filter-panel.svelte';

describe('FilterPanel', () => {
  it('should render configured sections only', () => {
    const { queryByTestId } = render(FilterPanel, {
      props: {
        config: {
          sections: ['people', 'rating'],
          providers: {},
        },
        timeBuckets: [],
      },
    });
    expect(queryByTestId('filter-section-people')).toBeTruthy();
    expect(queryByTestId('filter-section-rating')).toBeTruthy();
    expect(queryByTestId('filter-section-location')).toBeNull();
    expect(queryByTestId('filter-section-camera')).toBeNull();
  });

  it('should hide sections not in config', () => {
    const { queryByTestId } = render(FilterPanel, {
      props: {
        config: { sections: ['rating'], providers: {} },
        timeBuckets: [],
      },
    });
    expect(queryByTestId('filter-section-people')).toBeNull();
    expect(queryByTestId('filter-section-location')).toBeNull();
    expect(queryByTestId('filter-section-camera')).toBeNull();
    expect(queryByTestId('filter-section-tags')).toBeNull();
    expect(queryByTestId('filter-section-media')).toBeNull();
    expect(queryByTestId('filter-section-rating')).toBeTruthy();
  });

  it('should collapse to icon strip', async () => {
    const { getByTestId, queryByTestId } = render(FilterPanel, {
      props: {
        config: { sections: ['people', 'location'], providers: {} },
        timeBuckets: [],
      },
    });
    const collapseBtn = getByTestId('collapse-panel-btn');
    await fireEvent.click(collapseBtn);
    expect(queryByTestId('collapsed-icon-strip')).toBeTruthy();
    expect(queryByTestId('discovery-panel')).toBeNull();
  });

  it('should expand from collapsed state', async () => {
    const { getByTestId, queryByTestId } = render(FilterPanel, {
      props: {
        config: { sections: ['people'], providers: {} },
        timeBuckets: [],
      },
    });
    // Collapse first
    await fireEvent.click(getByTestId('collapse-panel-btn'));
    expect(queryByTestId('collapsed-icon-strip')).toBeTruthy();
    // Expand
    await fireEvent.click(getByTestId('expand-panel-btn'));
    expect(queryByTestId('discovery-panel')).toBeTruthy();
    expect(queryByTestId('collapsed-icon-strip')).toBeNull();
  });

  it('should update filters when month is clicked in timeline picker', async () => {
    const { getByTestId } = render(FilterPanel, {
      props: {
        config: { sections: ['timeline'], providers: {} },
        timeBuckets: [
          { timeBucket: '2023-06-01', count: 100 },
          { timeBucket: '2023-08-01', count: 200 },
        ],
      },
    });
    await fireEvent.click(getByTestId('year-btn-2023'));
    await fireEvent.click(getByTestId('month-btn-6'));
    await fireEvent.click(getByTestId('collapse-panel-btn'));
    expect(getByTestId('collapsed-icon-strip')).toBeTruthy();
  });

  it('should update filters when year is clicked in timeline picker', async () => {
    const { getByTestId } = render(FilterPanel, {
      props: {
        config: { sections: ['timeline'], providers: {} },
        timeBuckets: [
          { timeBucket: '2023-06-01', count: 100 },
          { timeBucket: '2023-08-01', count: 200 },
        ],
      },
    });
    await fireEvent.click(getByTestId('year-btn-2023'));
    expect(getByTestId('discovery-panel')).toBeTruthy();
  });

  it('should render with externally-provided filters state', () => {
    const filters = createFilterState();
    filters.mediaType = 'image';
    const { queryByTestId } = render(FilterPanel, {
      props: {
        config: { sections: ['media'], providers: {} },
        timeBuckets: [],
        filters,
      },
    });
    expect(queryByTestId('filter-section-media')).toBeTruthy();
  });

  it('should work without onFilterChange callback', () => {
    const { queryByTestId } = render(FilterPanel, {
      props: {
        config: { sections: ['rating'], providers: {} },
        timeBuckets: [],
      },
    });
    expect(queryByTestId('filter-section-rating')).toBeTruthy();
  });
});

describe('Section Selector', () => {
  const STORAGE_KEY = 'gallery-filter-visible-sections';
  const allSections = ['timeline', 'people', 'location', 'camera', 'tags', 'rating', 'media'] as const;

  function renderPanel(
    sections: Array<(typeof allSections)[number]> = [...allSections],
    filters?: ReturnType<typeof createFilterState>,
  ) {
    return render(FilterPanel, {
      props: {
        config: { sections: [...sections], providers: {} },
        timeBuckets: sections.includes('timeline')
          ? [
              { timeBucket: '2023-06-01', count: 100 },
              { timeBucket: '2023-08-01', count: 200 },
            ]
          : [],
        ...(filters ? { filters } : {}),
      },
    });
  }

  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
  });

  // --- Rendering ---

  // Test 1
  it('should render toggle row with icons for all configured sections', () => {
    renderPanel();
    expect(screen.getByTestId('section-toggle-row')).toBeTruthy();
    for (const section of allSections) {
      expect(screen.getByTestId(`section-toggle-${section}`)).toBeTruthy();
    }
  });

  // Test 2
  it('should not render toggle icons for unconfigured sections', () => {
    renderPanel(['people', 'rating']);
    expect(screen.getByTestId('section-toggle-people')).toBeTruthy();
    expect(screen.getByTestId('section-toggle-rating')).toBeTruthy();
    expect(screen.queryByTestId('section-toggle-location')).toBeNull();
    expect(screen.queryByTestId('section-toggle-camera')).toBeNull();
    expect(screen.queryByTestId('section-toggle-tags')).toBeNull();
    expect(screen.queryByTestId('section-toggle-timeline')).toBeNull();
    expect(screen.queryByTestId('section-toggle-media')).toBeNull();
  });

  // Test 3
  it('should show all sections visible by default when no localStorage value', () => {
    renderPanel();
    for (const section of allSections) {
      expect(screen.getByTestId(`filter-section-${section}`)).toBeTruthy();
    }
  });

  // Test 4
  it('should not render toggle row in collapsed panel state', async () => {
    renderPanel(['people', 'rating']);
    await fireEvent.click(screen.getByTestId('collapse-panel-btn'));
    expect(screen.queryByTestId('section-toggle-row')).toBeNull();
    expect(screen.getByTestId('collapsed-icon-strip')).toBeTruthy();
  });

  // Test 5
  it('should not crash and not render toggle row with empty sections config', () => {
    renderPanel([]);
    expect(screen.queryByTestId('section-toggle-row')).toBeNull();
  });

  // --- Toggle Interaction ---

  // Test 6
  it('should hide section from DOM when active icon is clicked', async () => {
    renderPanel();
    expect(screen.getByTestId('filter-section-people')).toBeTruthy();
    await fireEvent.click(screen.getByTestId('section-toggle-people'));
    expect(screen.queryByTestId('filter-section-people')).toBeNull();
  });

  // Test 7
  it('should restore section to DOM when inactive icon is clicked', async () => {
    renderPanel();
    await fireEvent.click(screen.getByTestId('section-toggle-people'));
    expect(screen.queryByTestId('filter-section-people')).toBeNull();
    await fireEvent.click(screen.getByTestId('section-toggle-people'));
    expect(screen.getByTestId('filter-section-people')).toBeTruthy();
  });

  // Test 8
  it('should not affect other sections when one is toggled', async () => {
    renderPanel();
    await fireEvent.click(screen.getByTestId('section-toggle-people'));
    expect(screen.queryByTestId('filter-section-people')).toBeNull();
    expect(screen.getByTestId('filter-section-location')).toBeTruthy();
    expect(screen.getByTestId('filter-section-camera')).toBeTruthy();
    expect(screen.getByTestId('filter-section-rating')).toBeTruthy();
  });

  // Test 9
  it('should allow multiple sections to be hidden simultaneously', async () => {
    renderPanel();
    await fireEvent.click(screen.getByTestId('section-toggle-people'));
    await fireEvent.click(screen.getByTestId('section-toggle-location'));
    await fireEvent.click(screen.getByTestId('section-toggle-camera'));
    expect(screen.queryByTestId('filter-section-people')).toBeNull();
    expect(screen.queryByTestId('filter-section-location')).toBeNull();
    expect(screen.queryByTestId('filter-section-camera')).toBeNull();
    expect(screen.getByTestId('filter-section-rating')).toBeTruthy();
    expect(screen.getByTestId('filter-section-tags')).toBeTruthy();
  });

  // Test 10
  it('should return to original state after rapid double-click', async () => {
    renderPanel();
    expect(screen.getByTestId('filter-section-people')).toBeTruthy();
    await fireEvent.click(screen.getByTestId('section-toggle-people'));
    await fireEvent.click(screen.getByTestId('section-toggle-people'));
    expect(screen.getByTestId('filter-section-people')).toBeTruthy();
  });

  // Test 11
  it('should trigger all-hidden state when single section is hidden', async () => {
    renderPanel(['rating']);
    expect(screen.getByTestId('filter-section-rating')).toBeTruthy();
    await fireEvent.click(screen.getByTestId('section-toggle-rating'));
    expect(screen.queryByTestId('filter-section-rating')).toBeNull();
    expect(screen.getByTestId('show-all-sections')).toBeTruthy();
  });

  // --- All-Hidden Empty State ---

  // Test 12
  it('should show empty state with "Show all" link when all sections hidden', async () => {
    renderPanel(['people', 'rating']);
    await fireEvent.click(screen.getByTestId('section-toggle-people'));
    await fireEvent.click(screen.getByTestId('section-toggle-rating'));
    expect(screen.queryByTestId('filter-section-people')).toBeNull();
    expect(screen.queryByTestId('filter-section-rating')).toBeNull();
    expect(screen.getByTestId('show-all-sections')).toBeTruthy();
  });

  // Test 13
  it('should restore all sections when "Show all" is clicked', async () => {
    renderPanel(['people', 'rating']);
    await fireEvent.click(screen.getByTestId('section-toggle-people'));
    await fireEvent.click(screen.getByTestId('section-toggle-rating'));
    expect(screen.getByTestId('show-all-sections')).toBeTruthy();
    await fireEvent.click(screen.getByTestId('show-all-sections'));
    expect(screen.getByTestId('filter-section-people')).toBeTruthy();
    expect(screen.getByTestId('filter-section-rating')).toBeTruthy();
    expect(screen.queryByTestId('show-all-sections')).toBeNull();
  });

  // Test 14
  it('should update all toggle icons to active/pressed after "Show all"', async () => {
    renderPanel(['people', 'rating']);
    await fireEvent.click(screen.getByTestId('section-toggle-people'));
    await fireEvent.click(screen.getByTestId('section-toggle-rating'));
    await fireEvent.click(screen.getByTestId('show-all-sections'));
    expect(screen.getByTestId('section-toggle-people').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByTestId('section-toggle-rating').getAttribute('aria-pressed')).toBe('true');
  });

  // --- Active-but-Hidden Indicator ---

  // Test 15
  it('should show dot indicator on hidden section with active filter', async () => {
    const filters = createFilterState();
    filters.personIds = ['person-1'];
    renderPanel(['people', 'rating'], filters);
    await fireEvent.click(screen.getByTestId('section-toggle-people'));
    expect(screen.getByTestId('section-toggle-dot-people')).toBeTruthy();
  });

  // Test 16
  it('should not show dot indicator on hidden section without active filter', async () => {
    renderPanel(['people', 'rating']);
    await fireEvent.click(screen.getByTestId('section-toggle-people'));
    expect(screen.queryByTestId('section-toggle-dot-people')).toBeNull();
  });

  // Test 17
  it('should show dot on timeline section with selectedYear when hidden', async () => {
    const filters = createFilterState();
    filters.selectedYear = 2023;
    renderPanel(['timeline', 'rating'], filters);
    await fireEvent.click(screen.getByTestId('section-toggle-timeline'));
    expect(screen.getByTestId('section-toggle-dot-timeline')).toBeTruthy();
  });

  // --- Accessibility ---

  // Test 18
  it('should set aria-pressed="true" on visible section toggle icons', () => {
    renderPanel(['people', 'rating']);
    expect(screen.getByTestId('section-toggle-people').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByTestId('section-toggle-rating').getAttribute('aria-pressed')).toBe('true');
  });

  // Test 19
  it('should set aria-pressed="false" on hidden section toggle icons', async () => {
    renderPanel(['people', 'rating']);
    await fireEvent.click(screen.getByTestId('section-toggle-people'));
    expect(screen.getByTestId('section-toggle-people').getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByTestId('section-toggle-rating').getAttribute('aria-pressed')).toBe('true');
  });

  // Test 20
  it('should update aria-pressed correctly after toggle click', async () => {
    renderPanel(['people']);
    expect(screen.getByTestId('section-toggle-people').getAttribute('aria-pressed')).toBe('true');
    await fireEvent.click(screen.getByTestId('section-toggle-people'));
    expect(screen.getByTestId('section-toggle-people').getAttribute('aria-pressed')).toBe('false');
    await fireEvent.click(screen.getByTestId('section-toggle-people'));
    expect(screen.getByTestId('section-toggle-people').getAttribute('aria-pressed')).toBe('true');
  });

  // --- localStorage Persistence ---

  // Test 21
  it('should write updated visibility to localStorage when section is toggled', async () => {
    renderPanel(['people', 'rating']);
    await fireEvent.click(screen.getByTestId('section-toggle-people'));
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as string[];
    expect(stored).toContain('rating');
    expect(stored).not.toContain('people');
  });

  // Test 22
  it('should read localStorage on mount and restore visibility', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(['rating']));
    renderPanel(['people', 'rating']);
    expect(screen.queryByTestId('filter-section-people')).toBeNull();
    expect(screen.getByTestId('filter-section-rating')).toBeTruthy();
  });

  // Test 23
  it('should show only stored sections when localStorage has partial list', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(['people']));
    renderPanel();
    expect(screen.getByTestId('filter-section-people')).toBeTruthy();
    expect(screen.queryByTestId('filter-section-rating')).toBeNull();
    expect(screen.queryByTestId('filter-section-location')).toBeNull();
  });

  // Test 24
  it('should ignore stale/unknown section names in localStorage', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(['people', 'nonexistent', 'foobar']));
    renderPanel(['people', 'rating']);
    expect(screen.getByTestId('filter-section-people')).toBeTruthy();
    expect(screen.queryByTestId('filter-section-rating')).toBeNull();
  });

  // Test 25
  it('should fall back to all-visible default when localStorage has invalid JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{not valid json!!!');
    renderPanel(['people', 'rating']);
    expect(screen.getByTestId('filter-section-people')).toBeTruthy();
    expect(screen.getByTestId('filter-section-rating')).toBeTruthy();
  });

  // Test 26
  it('should use the correct localStorage key', async () => {
    renderPanel(['people', 'rating']);
    await fireEvent.click(screen.getByTestId('section-toggle-people'));
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
    expect(localStorage.getItem('some-other-key')).toBeNull();
  });

  // --- State Preservation ---

  // Test 27
  it('should preserve visibility state across panel collapse/expand cycle', async () => {
    renderPanel(['people', 'rating']);
    await fireEvent.click(screen.getByTestId('section-toggle-people'));
    expect(screen.queryByTestId('filter-section-people')).toBeNull();
    expect(screen.getByTestId('filter-section-rating')).toBeTruthy();

    // Collapse
    await fireEvent.click(screen.getByTestId('collapse-panel-btn'));
    expect(screen.getByTestId('collapsed-icon-strip')).toBeTruthy();

    // Expand
    await fireEvent.click(screen.getByTestId('expand-panel-btn'));
    expect(screen.queryByTestId('filter-section-people')).toBeNull();
    expect(screen.getByTestId('filter-section-rating')).toBeTruthy();
  });

  // Test 28
  it('should still allow filter interactions on visible sections (regression)', async () => {
    renderPanel(['timeline', 'rating']);
    await fireEvent.click(screen.getByTestId('section-toggle-rating'));
    expect(screen.queryByTestId('filter-section-rating')).toBeNull();
    // Timeline should still work
    expect(screen.getByTestId('filter-section-timeline')).toBeTruthy();
    await fireEvent.click(screen.getByTestId('year-btn-2023'));
    expect(screen.getByTestId('filter-section-timeline')).toBeTruthy();
  });
});
```

Apply this by replacing the entire file content.

**Step 2: Run tests to verify they fail**

```bash
cd /home/pierre/dev/gallery/web && pnpm test -- --run src/lib/components/filter-panel/__tests__/filter-panel.spec.ts
```

Expected: All 28 new tests fail (elements like `section-toggle-row`, `section-toggle-people`, etc. do not exist yet). The 8 existing tests should still pass.

**Step 3: Commit**

```bash
git add web/src/lib/components/filter-panel/__tests__/filter-panel.spec.ts
git commit -m "test(web): add 28 failing tests for filter section selector"
```

---

## Task 2: Implement filter section selector

**Files:**

- Modify: `web/src/lib/components/filter-panel/filter-panel.svelte`

All changes are in this single file. The implementation has 6 parts.

### Step 1: Add `browser` import

At line 2 of `filter-panel.svelte`, add the `browser` import from `$app/environment`:

```typescript
// Add after: import { Icon } from '@immich/ui';
import { browser } from '$app/environment';
```

The import block (lines 1-13) becomes:

```typescript
import { Icon } from '@immich/ui';
import { browser } from '$app/environment';
import {
  mdiChevronLeft,
  mdiChevronRight,
  mdiCalendar,
  mdiAccount,
  mdiMapMarker,
  mdiCamera,
  mdiTag,
  mdiStar,
  mdiImage,
} from '@mdi/js';
```

### Step 2: Add `loadVisibleSections` function, state, toggle functions, and `$effect`

After line 58 (the `sectionTitles` closing brace+semicolon), add:

```typescript
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

This requires importing the `FilterSection` type. Update the existing type import at line 14 (currently):

```typescript
import type { FilterPanelConfig, FilterState, PersonOption, TagOption } from './filter-panel';
```

To also include `FilterSection`:

```typescript
import type { FilterPanelConfig, FilterSection, FilterState, PersonOption, TagOption } from './filter-panel';
```

### Step 3: Fix `hasActiveFilter` for timeline

In the `hasActiveFilter` function (currently at line 125), add a `case 'timeline'` before the `default`:

```typescript
function hasActiveFilter(section: string): boolean {
  switch (section) {
    case 'people': {
      return filters.personIds.length > 0;
    }
    case 'location': {
      return !!filters.city || !!filters.country;
    }
    case 'camera': {
      return !!filters.make;
    }
    case 'tags': {
      return filters.tagIds.length > 0;
    }
    case 'rating': {
      return filters.rating !== undefined;
    }
    case 'media': {
      return filters.mediaType !== 'all';
    }
    case 'timeline': {
      return filters.selectedYear !== undefined;
    }
    default: {
      return false;
    }
  }
}
```

### Step 4: Add icon toggle row in template

In the expanded panel template, after the panel header `</div>` (currently at line 197, closing the sticky header div) and before `<div class="pt-4">` (line 199), add the section toggle row.

This row should only render when `config.sections.length > 0`:

```svelte
{#if config.sections.length > 0}
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
{/if}
```

### Step 5: Wrap filter sections with visibility gate

Replace the current `<div class="pt-4">` block (lines 199-249) with a version that gates each section on `visibleSections.has(section)`:

```svelte
<div class="pt-4">
  {#each config.sections as section (section)}
    {#if visibleSections.has(section)}
      <FilterSection title={sectionTitles[section]} testId={section}>
        {#if section === 'timeline'}
          <TemporalPicker
            {timeBuckets}
            selectedYear={filters.selectedYear}
            selectedMonth={filters.selectedMonth}
            onYearSelect={handleYearSelect}
            onMonthSelect={handleMonthSelect}
          />
        {:else if section === 'people'}
          <PeopleFilter {people} selectedIds={filters.personIds} onSelectionChange={handlePeopleChange} />
        {:else if section === 'location'}
          <LocationFilter
            {countries}
            selectedCity={filters.city}
            selectedCountry={filters.country}
            onCityFetch={async (_) => {
              if (config.providers.locations) {
                const result = await config.providers.locations();
                return result.filter((l) => l.type === 'city').map((l) => l.value);
              }
              return [];
            }}
            onSelectionChange={handleLocationChange}
          />
        {:else if section === 'camera'}
          <CameraFilter
            makes={cameraMakes}
            selectedMake={filters.make}
            selectedModel={filters.model}
            onModelFetch={async (_) => {
              if (config.providers.cameras) {
                const result = await config.providers.cameras();
                return result.filter((c) => c.type === 'model').map((c) => c.value);
              }
              return [];
            }}
            onSelectionChange={handleCameraChange}
          />
        {:else if section === 'tags'}
          <TagsFilter {tags} selectedIds={filters.tagIds} onSelectionChange={handleTagsChange} />
        {:else if section === 'rating'}
          <RatingFilter selectedRating={filters.rating} onRatingChange={handleRatingChange} />
        {:else if section === 'media'}
          <MediaTypeFilter selected={filters.mediaType} onTypeChange={handleMediaTypeChange} />
        {/if}
      </FilterSection>
    {/if}
  {/each}

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
</div>
```

### Step 6: Run tests to verify they pass

```bash
cd /home/pierre/dev/gallery/web && pnpm test -- --run src/lib/components/filter-panel/__tests__/filter-panel.spec.ts
```

Expected: All 36 tests pass (8 existing + 28 new).

### Step 7: Format and lint

```bash
cd /home/pierre/dev/gallery && make format-web && make lint-web
```

### Step 8: Commit

```bash
git add web/src/lib/components/filter-panel/filter-panel.svelte
git commit -m "feat(web): add filter section selector with icon toggle row

Add icon toggle row to FilterPanel that lets users show/hide individual
filter sections. Visibility state persists in localStorage. Hidden
sections with active filters show a dot indicator. All sections visible
by default. Includes hasActiveFilter fix for timeline section."
```

---

## Task 3: Final verification

### Step 1: Run full web test suite

```bash
cd /home/pierre/dev/gallery/web && pnpm test -- --run
```

Expected: All tests pass.

### Step 2: Run type check

```bash
cd /home/pierre/dev/gallery && make check-web
```

Expected: No type errors.

### Step 3: Run lint

```bash
cd /home/pierre/dev/gallery && make lint-web
```

Expected: Zero warnings, zero errors.

### Step 4: Commit if any formatting/lint fixes were needed

If Steps 2-3 required changes:

```bash
git add -u
git commit -m "fix(web): resolve lint/type issues in filter section selector"
```
