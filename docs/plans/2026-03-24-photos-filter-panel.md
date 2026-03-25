# Photos FilterPanel Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add the existing FilterPanel sidebar to the /photos page so users can filter their main timeline by people, location, camera, tags, rating, media type, and time period.

**Architecture:** Direct integration of the FilterPanel component into the /photos page using the same `$derived.by()` pattern as the spaces page. FilterPanel props are extended with `initialCollapsed` and `storageKey`. Filter sub-component empty text is made configurable. No backend changes.

**Tech Stack:** SvelteKit, Svelte 5 runes, @immich/sdk, Vitest, Playwright

**Base branch:** `feat/contextual-filter-suggestions` (the contextual-filters worktree)

**Known limitation:** `getAllPeople` does not accept `takenAfter`/`takenBefore` — the people provider on /photos returns the full global people list regardless of temporal filter. This is acceptable since people are a user-level concept, not temporally scoped.

---

### Task 1: Add `initialCollapsed` prop to FilterPanel

**Files:**

- Modify: `web/src/lib/components/filter-panel/filter-panel.svelte:35-42`
- Test: `web/src/lib/components/filter-panel/__tests__/filter-panel.spec.ts`

**Step 1: Write failing test**

Add to the existing test file:

```typescript
describe('initialCollapsed prop', () => {
  it('should start collapsed when initialCollapsed is true', async () => {
    render(FilterPanel, {
      props: {
        config: { sections: ['rating', 'media'], providers: {} },
        timeBuckets: [],
        initialCollapsed: true,
      },
    });

    expect(screen.getByTestId('collapsed-icon-strip')).toBeInTheDocument();
    expect(screen.queryByTestId('discovery-panel')).not.toBeInTheDocument();
  });

  it('should start expanded by default (no prop)', async () => {
    render(FilterPanel, {
      props: {
        config: { sections: ['rating', 'media'], providers: {} },
        timeBuckets: [],
      },
    });

    expect(screen.getByTestId('discovery-panel')).toBeInTheDocument();
    expect(screen.queryByTestId('collapsed-icon-strip')).not.toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd web && pnpm test -- --run src/lib/components/filter-panel/__tests__/filter-panel.spec.ts`
Expected: FAIL — `initialCollapsed` is not a recognized prop

**Step 3: Implement**

In `filter-panel.svelte`, update the Props interface and state initialization:

```typescript
interface Props {
  config: FilterPanelConfig;
  timeBuckets: Array<{ timeBucket: string; count: number }>;
  filters?: FilterState;
  initialCollapsed?: boolean;
}

let { config, timeBuckets, filters = $bindable(createFilterState()), initialCollapsed = false }: Props = $props();
let collapsed = $state(initialCollapsed);
```

**Step 4: Run test to verify it passes**

Run: `cd web && pnpm test -- --run src/lib/components/filter-panel/__tests__/filter-panel.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add web/src/lib/components/filter-panel/filter-panel.svelte web/src/lib/components/filter-panel/__tests__/filter-panel.spec.ts
git commit -m "feat: add initialCollapsed prop to FilterPanel"
```

---

### Task 2: Add `storageKey` prop to FilterPanel

**Files:**

- Modify: `web/src/lib/components/filter-panel/filter-panel.svelte:35-42,176`
- Test: `web/src/lib/components/filter-panel/__tests__/filter-sections.spec.ts`

**Step 1: Write failing test**

Add to the existing filter-sections test file:

```typescript
describe('storageKey prop', () => {
  it('should use custom storage key for localStorage persistence', async () => {
    const customKey = 'gallery-filter-photos';
    render(FilterPanel, {
      props: {
        config: { sections: ['rating', 'media', 'tags'], providers: {} },
        timeBuckets: [],
        storageKey: customKey,
      },
    });

    // Toggle off a section
    const ratingToggle = screen.getByTestId('section-toggle-rating');
    await fireEvent.click(ratingToggle);

    // Check custom key was used
    const stored = localStorage.getItem(customKey);
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!) as string[];
    expect(parsed).not.toContain('rating');

    // Default key should NOT have been written
    expect(localStorage.getItem('gallery-filter-visible-sections')).toBeNull();
  });

  it('should use default key when storageKey not provided', async () => {
    render(FilterPanel, {
      props: {
        config: { sections: ['rating', 'media'], providers: {} },
        timeBuckets: [],
      },
    });

    const ratingToggle = screen.getByTestId('section-toggle-rating');
    await fireEvent.click(ratingToggle);

    expect(localStorage.getItem('gallery-filter-visible-sections')).toBeTruthy();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd web && pnpm test -- --run src/lib/components/filter-panel/__tests__/filter-sections.spec.ts`
Expected: FAIL — `storageKey` not recognized, default key still used

**Step 3: Implement**

In `filter-panel.svelte`:

1. Add to Props and destructuring:

```typescript
interface Props {
  config: FilterPanelConfig;
  timeBuckets: Array<{ timeBucket: string; count: number }>;
  filters?: FilterState;
  initialCollapsed?: boolean;
  storageKey?: string;
}

let {
  config,
  timeBuckets,
  filters = $bindable(createFilterState()),
  initialCollapsed = false,
  storageKey = 'gallery-filter-visible-sections',
}: Props = $props();
```

2. Remove the `STORAGE_KEY` constant (line 176) and replace all references with `storageKey`:

```typescript
// In loadVisibleSections — accept key param:
function loadVisibleSections(configSections: FilterSectionType[], key: string): SvelteSet<FilterSectionType> {
  if (browser) {
    try {
      const raw = localStorage.getItem(key);
      // ... rest unchanged
```

And call it: `let visibleSections = $state(loadVisibleSections(config.sections, storageKey));`

Update the persistence `$effect`:

```typescript
$effect(() => {
  if (browser) {
    try {
      localStorage.setItem(storageKey, JSON.stringify([...visibleSections]));
    } catch {
      /* localStorage unavailable */
    }
  }
});
```

**Step 4: Run test to verify it passes**

Run: `cd web && pnpm test -- --run src/lib/components/filter-panel/__tests__/filter-sections.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add web/src/lib/components/filter-panel/filter-panel.svelte web/src/lib/components/filter-panel/__tests__/filter-sections.spec.ts
git commit -m "feat: add storageKey prop to FilterPanel for independent persistence"
```

---

### Task 3: Add `emptyText` prop to filter sub-components

**Files:**

- Modify: `web/src/lib/components/filter-panel/people-filter.svelte`
- Modify: `web/src/lib/components/filter-panel/location-filter.svelte`
- Modify: `web/src/lib/components/filter-panel/camera-filter.svelte`
- Test: `web/src/lib/components/filter-panel/__tests__/filter-panel.spec.ts`

**Step 1: Write failing test**

Add to filter-panel.spec.ts:

```typescript
describe('emptyText prop', () => {
  it('should show generic empty text for people section when no people', async () => {
    render(FilterPanel, {
      props: {
        config: { sections: ['people'], providers: { people: async () => [] } },
        timeBuckets: [],
      },
    });

    await waitFor(() => {
      expect(screen.getByTestId('people-empty')).toHaveTextContent('No people found');
    });
  });

  it('should show generic empty text for location section when no locations', async () => {
    render(FilterPanel, {
      props: {
        config: { sections: ['location'], providers: { locations: async () => [] } },
        timeBuckets: [],
      },
    });

    await waitFor(() => {
      expect(screen.getByTestId('location-empty')).toHaveTextContent('No locations found');
    });
  });

  it('should show generic empty text for camera section when no cameras', async () => {
    render(FilterPanel, {
      props: {
        config: { sections: ['camera'], providers: { cameras: async () => [] } },
        timeBuckets: [],
      },
    });

    await waitFor(() => {
      expect(screen.getByTestId('camera-empty')).toHaveTextContent('No cameras found');
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd web && pnpm test -- --run src/lib/components/filter-panel/__tests__/filter-panel.spec.ts`
Expected: FAIL — text says "No people in this space" / "No locations in this space" / "No cameras in this space"

**Step 3: Implement**

In each sub-component, add an `emptyText` prop with a generic default:

**people-filter.svelte:**

```typescript
interface Props {
  people: PersonOption[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  emptyText?: string;
}
let { people, selectedIds, onSelectionChange, emptyText = 'No people found' }: Props = $props();
```

Replace: `<p ... data-testid="people-empty">No people in this space</p>`
With: `<p ... data-testid="people-empty">{emptyText}</p>`

**location-filter.svelte:**

```typescript
emptyText?: string;
// default: 'No locations found'
```

Replace: `<p ... data-testid="location-empty">No locations in this space</p>`
With: `<p ... data-testid="location-empty">{emptyText}</p>`

**camera-filter.svelte:**

```typescript
emptyText?: string;
// default: 'No cameras found'
```

Replace: `<p ... data-testid="camera-empty">No cameras in this space</p>`
With: `<p ... data-testid="camera-empty">{emptyText}</p>`

Note: `tags-filter.svelte` already says "No tags available" which is generic — no change needed.

**Step 4: Run test to verify it passes**

Run: `cd web && pnpm test -- --run src/lib/components/filter-panel/__tests__/filter-panel.spec.ts`
Expected: PASS

**Step 5: Update existing tests that assert old "in this space" text**

Three existing tests in `filter-sections.spec.ts` assert the old text and will break:

- Line 165: `expect(getByTestId('people-empty').textContent).toBe('No people in this space');` → change to `'No people found'`
- Line 278: `expect(getByTestId('location-empty').textContent).toBe('No locations in this space');` → change to `'No locations found'`
- Line 384: `expect(getByTestId('camera-empty').textContent).toBe('No cameras in this space');` → change to `'No cameras found'`

**Step 6: Run all existing tests for regressions**

Run: `cd web && pnpm test -- --run src/lib/components/filter-panel/`
Expected: All PASS

**Step 7: Commit**

```bash
git add web/src/lib/components/filter-panel/people-filter.svelte web/src/lib/components/filter-panel/location-filter.svelte web/src/lib/components/filter-panel/camera-filter.svelte web/src/lib/components/filter-panel/__tests__/filter-panel.spec.ts web/src/lib/components/filter-panel/__tests__/filter-sections.spec.ts
git commit -m "feat: add emptyText prop to filter sub-components with generic defaults"
```

---

### Task 4: Write unit tests for /photos filter logic (TDD — tests first)

**Files:**

- Create: `web/src/lib/utils/__tests__/photos-filter-options.spec.ts`
- Create: `web/src/lib/utils/photos-filter-options.ts`

The filter-to-options mapping logic is extracted as a pure utility function so it can be tested before wiring into the component. This is the "write tests first" step.

**Step 1: Write failing tests**

Create `web/src/lib/utils/__tests__/photos-filter-options.spec.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { AssetOrder, AssetTypeEnum, AssetVisibility } from '@immich/sdk';
import { createFilterState } from '$lib/components/filter-panel/filter-panel';
import { buildPhotosTimelineOptions } from '$lib/utils/photos-filter-options';

describe('buildPhotosTimelineOptions', () => {
  it('should return base options with no filters', () => {
    const options = buildPhotosTimelineOptions(createFilterState());

    expect(options).toEqual({
      visibility: AssetVisibility.Timeline,
      withStacked: true,
      withPartners: true,
      withSharedSpaces: true,
      order: AssetOrder.Desc,
    });
  });

  it('should use personIds (not spacePersonIds) for people filter', () => {
    const filters = { ...createFilterState(), personIds: ['person-1', 'person-2'] };
    const options = buildPhotosTimelineOptions(filters);

    expect(options.personIds).toEqual(['person-1', 'person-2']);
    expect(options).not.toHaveProperty('spacePersonIds');
  });

  it('should include city and country for location filter', () => {
    const filters = { ...createFilterState(), country: 'Germany', city: 'Berlin' };
    const options = buildPhotosTimelineOptions(filters);

    expect(options.country).toBe('Germany');
    expect(options.city).toBe('Berlin');
  });

  it('should include make and model for camera filter', () => {
    const filters = { ...createFilterState(), make: 'Sony', model: 'A7III' };
    const options = buildPhotosTimelineOptions(filters);

    expect(options.make).toBe('Sony');
    expect(options.model).toBe('A7III');
  });

  it('should include tagIds for tags filter', () => {
    const filters = { ...createFilterState(), tagIds: ['tag-1'] };
    const options = buildPhotosTimelineOptions(filters);

    expect(options.tagIds).toEqual(['tag-1']);
  });

  it('should include rating for rating filter', () => {
    const filters = { ...createFilterState(), rating: 4 };
    const options = buildPhotosTimelineOptions(filters);

    expect(options.rating).toBe(4);
  });

  it('should map mediaType image to AssetTypeEnum.Image', () => {
    const filters = { ...createFilterState(), mediaType: 'image' as const };
    const options = buildPhotosTimelineOptions(filters);

    expect(options.$type).toBe(AssetTypeEnum.Image);
  });

  it('should map mediaType video to AssetTypeEnum.Video', () => {
    const filters = { ...createFilterState(), mediaType: 'video' as const };
    const options = buildPhotosTimelineOptions(filters);

    expect(options.$type).toBe(AssetTypeEnum.Video);
  });

  it('should not include $type when mediaType is all', () => {
    const options = buildPhotosTimelineOptions(createFilterState());

    expect(options).not.toHaveProperty('$type');
  });

  it('should set ascending order', () => {
    const filters = { ...createFilterState(), sortOrder: 'asc' as const };
    const options = buildPhotosTimelineOptions(filters);

    expect(options.order).toBe(AssetOrder.Asc);
  });

  it('should set year-only date range using UTC (consistent with buildFilterContext)', () => {
    const filters = { ...createFilterState(), selectedYear: 2023 };
    const options = buildPhotosTimelineOptions(filters);

    expect(options.takenAfter).toBeDefined();
    expect(options.takenBefore).toBeDefined();
    // buildFilterContext uses UTC: Jan 1 2023 to Jan 1 2024 (exclusive end)
    expect(options.takenAfter).toBe('2023-01-01T00:00:00.000Z');
    expect(options.takenBefore).toBe('2024-01-01T00:00:00.000Z');
  });

  it('should set year+month date range using UTC (consistent with buildFilterContext)', () => {
    const filters = { ...createFilterState(), selectedYear: 2023, selectedMonth: 8 };
    const options = buildPhotosTimelineOptions(filters);

    // buildFilterContext uses UTC: Aug 1 2023 to Sep 1 2023 (exclusive end)
    expect(options.takenAfter).toBe('2023-08-01T00:00:00.000Z');
    expect(options.takenBefore).toBe('2023-09-01T00:00:00.000Z');
  });

  it('should preserve withPartners and withSharedSpaces when filters are active', () => {
    const filters = { ...createFilterState(), country: 'Japan', rating: 5 };
    const options = buildPhotosTimelineOptions(filters);

    expect(options.withPartners).toBe(true);
    expect(options.withSharedSpaces).toBe(true);
  });

  it('should handle multiple simultaneous filters', () => {
    const filters = {
      ...createFilterState(),
      personIds: ['p1'],
      country: 'Germany',
      city: 'Berlin',
      make: 'Sony',
      tagIds: ['t1', 't2'],
      rating: 3,
      mediaType: 'image' as const,
      sortOrder: 'asc' as const,
      selectedYear: 2023,
    };
    const options = buildPhotosTimelineOptions(filters);

    expect(options.personIds).toEqual(['p1']);
    expect(options.country).toBe('Germany');
    expect(options.city).toBe('Berlin');
    expect(options.make).toBe('Sony');
    expect(options.tagIds).toEqual(['t1', 't2']);
    expect(options.rating).toBe(3);
    expect(options.$type).toBe(AssetTypeEnum.Image);
    expect(options.order).toBe(AssetOrder.Asc);
    expect(options.takenAfter).toBeDefined();
  });

  it('should not include empty personIds array', () => {
    const options = buildPhotosTimelineOptions(createFilterState());

    expect(options).not.toHaveProperty('personIds');
  });

  it('should not include empty tagIds array', () => {
    const options = buildPhotosTimelineOptions(createFilterState());

    expect(options).not.toHaveProperty('tagIds');
  });

  it('should not include undefined optional fields', () => {
    const options = buildPhotosTimelineOptions(createFilterState());

    expect(options).not.toHaveProperty('city');
    expect(options).not.toHaveProperty('country');
    expect(options).not.toHaveProperty('make');
    expect(options).not.toHaveProperty('model');
    expect(options).not.toHaveProperty('rating');
    expect(options).not.toHaveProperty('takenAfter');
    expect(options).not.toHaveProperty('takenBefore');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd web && pnpm test -- --run src/lib/utils/__tests__/photos-filter-options.spec.ts`
Expected: FAIL — module `$lib/utils/photos-filter-options` does not exist

**Step 3: Write minimal implementation**

Create `web/src/lib/utils/photos-filter-options.ts`:

```typescript
import { AssetOrder, AssetTypeEnum, AssetVisibility } from '@immich/sdk';
import type { FilterState } from '$lib/components/filter-panel/filter-panel';
import { buildFilterContext } from '$lib/components/filter-panel/filter-panel';

export function buildPhotosTimelineOptions(filters: FilterState): Record<string, unknown> {
  const base: Record<string, unknown> = {
    visibility: AssetVisibility.Timeline,
    withStacked: true,
    withPartners: true,
    withSharedSpaces: true,
  };

  if (filters.personIds.length > 0) {
    base.personIds = filters.personIds;
  }
  if (filters.city) {
    base.city = filters.city;
  }
  if (filters.country) {
    base.country = filters.country;
  }
  if (filters.make) {
    base.make = filters.make;
  }
  if (filters.model) {
    base.model = filters.model;
  }
  if (filters.tagIds.length > 0) {
    base.tagIds = filters.tagIds;
  }
  if (filters.rating !== undefined) {
    base.rating = filters.rating;
  }
  if (filters.mediaType !== 'all') {
    base.$type = filters.mediaType === 'image' ? AssetTypeEnum.Image : AssetTypeEnum.Video;
  }
  base.order = filters.sortOrder === 'asc' ? AssetOrder.Asc : AssetOrder.Desc;

  // Reuse buildFilterContext for consistent UTC date range computation
  const context = buildFilterContext(filters);
  if (context) {
    base.takenAfter = context.takenAfter;
    base.takenBefore = context.takenBefore;
  }

  return base;
}
```

**Step 4: Run test to verify it passes**

Run: `cd web && pnpm test -- --run src/lib/utils/__tests__/photos-filter-options.spec.ts`
Expected: All PASS

**Step 5: Commit**

```bash
git add web/src/lib/utils/photos-filter-options.ts web/src/lib/utils/__tests__/photos-filter-options.spec.ts
git commit -m "feat: extract and test buildPhotosTimelineOptions utility"
```

---

### Task 5: Write unit tests for handleRemoveFilter logic

**Files:**

- Modify: `web/src/lib/utils/photos-filter-options.ts`
- Modify: `web/src/lib/utils/__tests__/photos-filter-options.spec.ts`

**Step 1: Write failing tests**

Add to `photos-filter-options.spec.ts`:

```typescript
import { handlePhotosRemoveFilter } from '$lib/utils/photos-filter-options';

describe('handlePhotosRemoveFilter', () => {
  it('should remove a specific person from personIds', () => {
    const filters = { ...createFilterState(), personIds: ['p1', 'p2', 'p3'] };
    const result = handlePhotosRemoveFilter(filters, 'person', 'p2');

    expect(result.personIds).toEqual(['p1', 'p3']);
  });

  it('should clear location (both country and city)', () => {
    const filters = { ...createFilterState(), country: 'Germany', city: 'Berlin' };
    const result = handlePhotosRemoveFilter(filters, 'location');

    expect(result.country).toBeUndefined();
    expect(result.city).toBeUndefined();
  });

  it('should clear camera (both make and model)', () => {
    const filters = { ...createFilterState(), make: 'Sony', model: 'A7III' };
    const result = handlePhotosRemoveFilter(filters, 'camera');

    expect(result.make).toBeUndefined();
    expect(result.model).toBeUndefined();
  });

  it('should remove a specific tag from tagIds', () => {
    const filters = { ...createFilterState(), tagIds: ['t1', 't2'] };
    const result = handlePhotosRemoveFilter(filters, 'tag', 't1');

    expect(result.tagIds).toEqual(['t2']);
  });

  it('should clear rating', () => {
    const filters = { ...createFilterState(), rating: 4 };
    const result = handlePhotosRemoveFilter(filters, 'rating');

    expect(result.rating).toBeUndefined();
  });

  it('should reset mediaType to all', () => {
    const filters = { ...createFilterState(), mediaType: 'video' as const };
    const result = handlePhotosRemoveFilter(filters, 'media');

    expect(result.mediaType).toBe('all');
  });

  it('should handle mediaType alias', () => {
    const filters = { ...createFilterState(), mediaType: 'image' as const };
    const result = handlePhotosRemoveFilter(filters, 'mediaType');

    expect(result.mediaType).toBe('all');
  });

  it('should preserve sortOrder when removing filters', () => {
    const filters = { ...createFilterState(), sortOrder: 'asc' as const, rating: 5 };
    const result = handlePhotosRemoveFilter(filters, 'rating');

    expect(result.sortOrder).toBe('asc');
    expect(result.rating).toBeUndefined();
  });

  it('should preserve other filters when removing one', () => {
    const filters = { ...createFilterState(), country: 'Germany', rating: 4, personIds: ['p1'] };
    const result = handlePhotosRemoveFilter(filters, 'rating');

    expect(result.country).toBe('Germany');
    expect(result.personIds).toEqual(['p1']);
    expect(result.rating).toBeUndefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd web && pnpm test -- --run src/lib/utils/__tests__/photos-filter-options.spec.ts`
Expected: FAIL — `handlePhotosRemoveFilter` does not exist

**Step 3: Implement**

Add to `web/src/lib/utils/photos-filter-options.ts`:

```typescript
export function handlePhotosRemoveFilter(filters: FilterState, type: string, id?: string): FilterState {
  switch (type) {
    case 'person': {
      return { ...filters, personIds: filters.personIds.filter((p) => p !== id) };
    }
    case 'location': {
      return { ...filters, city: undefined, country: undefined };
    }
    case 'camera': {
      return { ...filters, make: undefined, model: undefined };
    }
    case 'tag': {
      return { ...filters, tagIds: filters.tagIds.filter((t) => t !== id) };
    }
    case 'rating': {
      return { ...filters, rating: undefined };
    }
    case 'media':
    case 'mediaType': {
      return { ...filters, mediaType: 'all' };
    }
    default: {
      return filters;
    }
  }
}
```

**Step 4: Run test to verify it passes**

Run: `cd web && pnpm test -- --run src/lib/utils/__tests__/photos-filter-options.spec.ts`
Expected: All PASS

**Step 5: Commit**

```bash
git add web/src/lib/utils/photos-filter-options.ts web/src/lib/utils/__tests__/photos-filter-options.spec.ts
git commit -m "feat: extract and test handlePhotosRemoveFilter utility"
```

---

### Task 6: Wire FilterPanel into the /photos page

**Files:**

- Modify: `web/src/routes/(user)/photos/[[assetId=id]]/+page.svelte`

This task uses the tested `buildPhotosTimelineOptions` and `handlePhotosRemoveFilter` utilities from Tasks 4-5.

**Step 1: Implement the integration**

Modify `web/src/routes/(user)/photos/[[assetId=id]]/+page.svelte`:

Add imports at top of `<script>`:

```typescript
import FilterPanel from '$lib/components/filter-panel/filter-panel.svelte';
import ActiveFiltersBar from '$lib/components/filter-panel/active-filters-bar.svelte';
import {
  createFilterState,
  clearFilters,
  getActiveFilterCount,
  type FilterPanelConfig,
  type FilterContext,
} from '$lib/components/filter-panel/filter-panel';
import { buildPhotosTimelineOptions, handlePhotosRemoveFilter } from '$lib/utils/photos-filter-options';
import { getAllPeople, getAllTags, getSearchSuggestions, SearchSuggestionType } from '@immich/sdk';
import { SvelteMap } from 'svelte/reactivity';
```

Add filter state after the existing `assetInteraction`:

```typescript
// Filter state
let filters = $state(createFilterState());
let personNames = new SvelteMap<string, string>();
let tagNames = new SvelteMap<string, string>();

const filterConfig: FilterPanelConfig = {
  sections: ['timeline', 'people', 'location', 'camera', 'tags', 'rating', 'media'],
  providers: {
    people: async () => {
      const response = await getAllPeople({ withHidden: false });
      for (const p of response.people) {
        personNames.set(p.id, p.name || 'Unknown');
      }
      return response.people
        .filter((p) => p.thumbnailPath)
        .map((p) => ({ id: p.id, name: p.name || 'Unknown', thumbnailPath: p.thumbnailPath }));
    },
    locations: async (context?: FilterContext) => {
      const countries = await getSearchSuggestions({
        $type: SearchSuggestionType.Country,
        takenAfter: context?.takenAfter,
        takenBefore: context?.takenBefore,
      });
      return countries.filter(Boolean).map((c) => ({ value: c!, type: 'country' as const }));
    },
    cities: async (country: string, context?: FilterContext) => {
      const cities = await getSearchSuggestions({
        $type: SearchSuggestionType.City,
        country,
        takenAfter: context?.takenAfter,
        takenBefore: context?.takenBefore,
      });
      return cities.filter(Boolean) as string[];
    },
    cameras: async (context?: FilterContext) => {
      const makes = await getSearchSuggestions({
        $type: SearchSuggestionType.CameraMake,
        takenAfter: context?.takenAfter,
        takenBefore: context?.takenBefore,
      });
      return makes.filter(Boolean).map((m) => ({ value: m!, type: 'make' as const }));
    },
    cameraModels: async (make: string, context?: FilterContext) => {
      const models = await getSearchSuggestions({
        $type: SearchSuggestionType.CameraModel,
        make,
        takenAfter: context?.takenAfter,
        takenBefore: context?.takenBefore,
      });
      return models.filter(Boolean) as string[];
    },
    tags: async () => {
      const tags = await getAllTags();
      for (const t of tags) {
        tagNames.set(t.id, t.value);
      }
      return tags.map((t) => ({ id: t.id, name: t.value }));
    },
  },
};

const hasActiveFilters = $derived(getActiveFilterCount(filters) > 0);
const totalAssetCount = $derived(timelineManager?.assetCount ?? 0);
```

Change the static `options` to use the extracted utility:

```typescript
const options = $derived(buildPhotosTimelineOptions(filters));
```

Update the template — wrap Timeline with FilterPanel in a flex container:

```svelte
<UserPageLayout hideNavbar={assetInteraction.selectionActive} scrollbar={false}>
  <div class="flex h-full">
    <FilterPanel
      bind:filters
      config={filterConfig}
      timeBuckets={timelineManager?.months?.map((m) => ({
        timeBucket: `${m.yearMonth.year}-${String(m.yearMonth.month).padStart(2, '0')}-01T00:00:00.000Z`,
        count: m.assetsCount,
      })) ?? []}
      initialCollapsed={true}
      storageKey="gallery-filter-visible-sections-photos"
    />
    <div class="flex-1 overflow-hidden">
      {#if hasActiveFilters}
        <ActiveFiltersBar
          {filters}
          resultCount={totalAssetCount}
          {personNames}
          {tagNames}
          onRemoveFilter={(type, id) => {
            filters = handlePhotosRemoveFilter(filters, type, id);
          }}
          onClearAll={() => {
            filters = clearFilters(filters);
          }}
        />
      {/if}
      <Timeline
        enableRouting={true}
        bind:timelineManager
        {options}
        {assetInteraction}
        removeAction={AssetAction.ARCHIVE}
        onEscape={handleEscape}
        withStacked
      >
        {#if $preferences.memories.enabled && !hasActiveFilters}
          <ImageCarousel {items} />
        {/if}
        {#snippet empty()}
          <EmptyPlaceholder text={$t('no_assets_message')} onClick={() => openFileUploadDialog()} class="mt-10 mx-auto" />
        {/snippet}
      </Timeline>
    </div>
  </div>
</UserPageLayout>
```

**Step 2: Verify type-checking passes**

Run: `cd web && npx svelte-check --tsconfig tsconfig.json 2>&1 | grep -E "Error|error" | head -10`
Expected: No errors in the modified file

**Step 3: Run all FilterPanel unit tests (regression check)**

Run: `cd web && pnpm test -- --run src/lib/components/filter-panel/`
Expected: All PASS

**Step 4: Commit**

```bash
git add web/src/routes/(user)/photos/[[assetId=id]]/+page.svelte
git commit -m "feat: wire FilterPanel into /photos timeline page"
```

---

### Task 7: Lint, format, and type-check

**Step 1: Format**

Run: `make format-web`

**Step 2: Lint**

Run: `make lint-web`

**Step 3: Type-check**

Run: `make check-web`

**Step 4: Run full unit test suite**

Run: `cd web && pnpm test -- --run src/lib/components/filter-panel/ && pnpm test -- --run src/lib/utils/__tests__/photos-filter-options.spec.ts`
Expected: All PASS

**Step 5: Commit if any fixes needed**

```bash
git add -u
git commit -m "chore: lint and format filter panel changes"
```

---

### Task 8: E2E tests for /photos FilterPanel

**Files:**

- Create: `e2e/src/specs/web/photos-filter-panel.e2e-spec.ts`

**Step 1: Write all E2E tests**

Uses the proven pattern from `spaces-filter-panel.e2e-spec.ts`: intercept `/timeline/buckets` responses, check `result-count` text, use actual data-testid selectors.

```typescript
import type { LoginResponseDto } from '@immich/sdk';
import { expect, test } from '@playwright/test';
import { utils } from 'src/utils';

test.describe('Photos FilterPanel', () => {
  let admin: LoginResponseDto;

  test.beforeAll(async () => {
    utils.initSdk();
    await utils.resetDatabase();
    admin = await utils.adminSetup();

    // Create assets with varied dates so timeline has content
    await utils.createAsset(admin.accessToken, {
      fileCreatedAt: '2023-08-15T10:00:00.000Z',
      fileModifiedAt: '2023-08-15T10:00:00.000Z',
    });
    await utils.createAsset(admin.accessToken, {
      fileCreatedAt: '2023-07-10T10:00:00.000Z',
      fileModifiedAt: '2023-07-10T10:00:00.000Z',
    });
    await utils.createAsset(admin.accessToken, {
      fileCreatedAt: '2022-12-25T10:00:00.000Z',
      fileModifiedAt: '2022-12-25T10:00:00.000Z',
    });
  });

  async function gotoPhotos(context: import('@playwright/test').BrowserContext, page: import('@playwright/test').Page) {
    await utils.setAuthCookies(context, admin.accessToken);
    await page.goto('/photos');
    await page.waitForSelector('[data-testid="collapsed-icon-strip"], [data-testid="discovery-panel"]');
  }

  test('should render FilterPanel collapsed by default on /photos', async ({ context, page }) => {
    await gotoPhotos(context, page);

    await expect(page.locator('[data-testid="collapsed-icon-strip"]')).toBeVisible();
    await expect(page.locator('[data-testid="discovery-panel"]')).not.toBeVisible();
  });

  test('should expand FilterPanel and show all 7 sections', async ({ context, page }) => {
    await gotoPhotos(context, page);

    await page.locator('[data-testid="expand-panel-btn"]').click();
    await expect(page.locator('[data-testid="discovery-panel"]')).toBeVisible();

    for (const section of ['timeline', 'people', 'location', 'camera', 'tags', 'rating', 'media']) {
      await expect(page.locator(`[data-testid="filter-section-${section}"]`)).toBeVisible();
    }
  });

  test('should filter by media type and show result count', async ({ context, page }) => {
    await gotoPhotos(context, page);

    // Expand panel
    await page.locator('[data-testid="expand-panel-btn"]').click();

    // Apply image filter and wait for timeline to refetch
    const bucketResponse = page.waitForResponse((r) => r.url().includes('/timeline/buckets'));
    await page.locator('[data-testid="media-type-image"]').click();
    await bucketResponse;

    // Active filters bar should show result count
    const resultCount = page.locator('[data-testid="result-count"]');
    await expect(resultCount).toBeVisible();
    const countText = await resultCount.textContent();
    expect(countText).toMatch(/\d+\s*result/);
  });

  test('should show ActiveFiltersBar and clear all filters', async ({ context, page }) => {
    await gotoPhotos(context, page);

    // Expand, set rating filter
    await page.locator('[data-testid="expand-panel-btn"]').click();
    const bucketResponse = page.waitForResponse((r) => r.url().includes('/timeline/buckets'));
    await page.locator('[data-testid="rating-star-5"]').click();
    await bucketResponse;

    // Collapse panel — ActiveFiltersBar should be visible
    await page.locator('[data-testid="collapse-panel-btn"]').click();
    await expect(page.locator('[data-testid="active-filters-bar"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-chip"]').first()).toBeVisible();

    // Clear all and wait for timeline refetch
    const clearResponse = page.waitForResponse((r) => r.url().includes('/timeline/buckets'));
    await page.locator('[data-testid="clear-all-btn"]').click();
    await clearResponse;

    // ActiveFiltersBar should disappear, full timeline restored
    await expect(page.locator('[data-testid="active-filters-bar"]')).not.toBeVisible();
  });
});
```

**Step 2: Run E2E tests** (requires `make e2e` stack running)

Run: `cd e2e && npx playwright test src/specs/web/photos-filter-panel.e2e-spec.ts`
Expected: All PASS

**Step 3: Commit**

```bash
git add e2e/src/specs/web/photos-filter-panel.e2e-spec.ts
git commit -m "test(e2e): add FilterPanel tests for /photos page"
```

---

### Task 9: Run full regression suite

**Step 1: Run all FilterPanel unit tests**

Run: `cd web && pnpm test -- --run src/lib/components/filter-panel/`
Expected: All PASS

**Step 2: Run photos filter unit tests**

Run: `cd web && pnpm test -- --run src/lib/utils/__tests__/photos-filter-options.spec.ts`
Expected: All PASS

**Step 3: Run spaces filter E2E tests (regression)**

Run: `cd e2e && npx playwright test src/specs/web/spaces-filter-panel.e2e-spec.ts`
Expected: All 86 tests PASS

**Step 4: Final lint and type-check**

Run: `make check-web && make lint-web && make format-web`
Expected: Clean

**Step 5: Commit any final fixes**

```bash
git add -u
git commit -m "chore: final formatting and lint fixes"
```
