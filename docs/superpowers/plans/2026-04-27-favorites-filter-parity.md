# Favorites Filter Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Favorites filter visible and functional across Map active chips, Photos, Spaces view mode, Album detail, and Album asset picker while preserving existing backend favorite semantics.

**Architecture:** Keep the existing `FilterState.isFavorite` model. First fix shared filter behavior, then wire route-specific config and request builders, then add route regressions for the page-level state flows. Owner-timeline requests must omit partner/shared-space inclusion whenever `isFavorite` is set because the backend rejects those combinations.

**Tech Stack:** Svelte 5, SvelteKit routes, Vitest, Testing Library, `@immich/sdk`, pnpm workspace.

---

## File Structure

- Modify `web/src/lib/components/filter-panel/active-filters-bar.svelte`: render the Favorites active chip for `isFavorite === true`.
- Modify `web/src/lib/components/filter-panel/filter-panel.svelte`: hydrate visible/expanded sections with known-section metadata so newly introduced sections appear without unhiding existing hidden sections.
- Modify `web/src/lib/components/filter-panel/__tests__/active-filters-bar.spec.ts`: cover Favorites chip rendering, removal, and no chip for `false`.
- Modify `web/src/lib/components/filter-panel/__tests__/filter-panel.spec.ts`: cover visible/expanded section migration.
- Modify `web/src/lib/utils/photos-filter-options.ts`: pass `isFavorite`, clear it, and omit partner/shared-space inclusions when it is set.
- Modify `web/src/lib/utils/space-filter-options.ts`: pass and clear `isFavorite` for concrete shared-space scope.
- Modify `web/src/lib/utils/album-filter-options.ts`: pass `isFavorite`; omit `withPartners` for picker requests when it is set.
- Modify `web/src/lib/utils/album-filter-config.ts`: add Favorites section and pass `isFavorite` into suggestions.
- Modify utility specs in `web/src/lib/utils/__tests__`: cover the request-shaping changes.
- Modify `web/src/routes/(user)/photos/[[assetId=id]]/+page.svelte`: add Favorites section and drop `withSharedSpaces` for Favorites suggestions/search.
- Modify `web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte`: add Favorites section in view mode config.
- Modify route specs for Photos, Spaces, and Albums to cover page wiring.
- Create `web/src/test-data/mocks/filter-panel-favorites.stub.svelte`: route-test stub that exposes sections and can set `filters.isFavorite`.

---

### Task 1: Active Favorites Chip

**Files:**

- Modify: `web/src/lib/components/filter-panel/__tests__/active-filters-bar.spec.ts`
- Modify: `web/src/lib/components/filter-panel/active-filters-bar.svelte`

- [ ] **Step 1: Add failing active-chip tests**

Add these tests inside `describe('ActiveFiltersBar', () => { ... })` after the media type tests:

```ts
it('should render chip for favorites filter', () => {
  const filters = { ...createFilterState(), isFavorite: true };

  const { getAllByTestId } = render(ActiveFiltersBar, {
    props: {
      filters,
      onRemoveFilter: () => {},
      onClearAll: () => {},
    },
  });

  const chips = getAllByTestId('active-chip');
  expect(chips).toHaveLength(1);
  expect(chips[0]).toHaveTextContent('Favorites');
});

it('should remove favorites filter on chip close', async () => {
  let removedType: string | undefined;
  const filters = { ...createFilterState(), isFavorite: true };

  const { getByTestId } = render(ActiveFiltersBar, {
    props: {
      filters,
      onRemoveFilter: (type) => {
        removedType = type;
      },
      onClearAll: () => {},
    },
  });

  await fireEvent.click(getByTestId('chip-close'));
  expect(removedType).toBe('favorites');
});

it('should not render a favorites chip for isFavorite false', () => {
  const filters = { ...createFilterState(), isFavorite: false };

  const { queryAllByTestId } = render(ActiveFiltersBar, {
    props: {
      filters,
      onRemoveFilter: () => {},
      onClearAll: () => {},
    },
  });

  expect(queryAllByTestId('active-chip')).toHaveLength(0);
});
```

- [ ] **Step 2: Run the failing tests**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/components/filter-panel/__tests__/active-filters-bar.spec.ts
```

Expected: the first two new tests fail because `ActiveFiltersBar` does not render a Favorites chip yet.

- [ ] **Step 3: Implement the Favorites chip**

In `web/src/lib/components/filter-panel/active-filters-bar.svelte`, add the Favorites chip after the media type chip block and before the timeline chip block:

```svelte
    // Favorites chip
    if (filters.isFavorite === true) {
      result.push({ type: 'favorites', label: 'Favorites' });
    }
```

- [ ] **Step 4: Run the active-chip tests**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/components/filter-panel/__tests__/active-filters-bar.spec.ts
```

Expected: all tests in the file pass.

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/components/filter-panel/active-filters-bar.svelte web/src/lib/components/filter-panel/__tests__/active-filters-bar.spec.ts
git commit -m "fix: show favorites active filter chip"
```

---

### Task 2: Filter Section Preference Migration

**Files:**

- Modify: `web/src/lib/components/filter-panel/filter-panel.svelte`
- Modify: `web/src/lib/components/filter-panel/__tests__/filter-panel.spec.ts`

- [ ] **Step 1: Add failing visible-section migration tests**

In `web/src/lib/components/filter-panel/__tests__/filter-panel.spec.ts`, add these tests in the visible-section persistence describe block after the localStorage restore tests:

```ts
it('should add favorites to legacy visible-section preferences without unhiding known hidden sections', () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(['people']));

  renderPanel(['people', 'rating', 'favorites']);

  expect(screen.getByTestId('filter-section-people')).toBeTruthy();
  expect(screen.getByTestId('filter-section-favorites')).toBeTruthy();
  expect(screen.queryByTestId('filter-section-rating')).toBeNull();
});

it('should add favorites to empty legacy visible-section preferences without unhiding all known sections', () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]));

  renderPanel(['people', 'rating', 'favorites']);

  expect(screen.getByTestId('filter-section-favorites')).toBeTruthy();
  expect(screen.queryByTestId('filter-section-people')).toBeNull();
  expect(screen.queryByTestId('filter-section-rating')).toBeNull();
});

it('should fall back to all visible when legacy visible-section preferences only contain unknown sections', () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(['obsolete-section']));

  renderPanel(['people', 'rating', 'favorites']);

  expect(screen.getByTestId('filter-section-people')).toBeTruthy();
  expect(screen.getByTestId('filter-section-rating')).toBeTruthy();
  expect(screen.getByTestId('filter-section-favorites')).toBeTruthy();
});

it('should add sections missing from stored known-section metadata without unhiding known hidden sections', () => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      selected: ['people'],
      known: ['people', 'rating', 'favorites'],
    }),
  );

  renderPanel(['people', 'rating', 'favorites', 'media']);

  expect(screen.getByTestId('filter-section-people')).toBeTruthy();
  expect(screen.getByTestId('filter-section-media')).toBeTruthy();
  expect(screen.queryByTestId('filter-section-rating')).toBeNull();
  expect(screen.queryByTestId('filter-section-favorites')).toBeNull();
});
```

- [ ] **Step 2: Add failing expanded-section migration tests**

In the `Section Accordion Persistence` describe block, add:

```ts
it('should expand favorites for legacy expanded-section preferences without expanding known collapsed sections', () => {
  localStorage.setItem(EXPANDED_KEY, JSON.stringify(['people']));

  renderPanel(['people', 'rating', 'favorites']);

  const peopleContent = screen.getByTestId('filter-section-people').querySelector('.filter-section-content');
  const ratingContent = screen.getByTestId('filter-section-rating').querySelector('.filter-section-content');
  const favoritesContent = screen.getByTestId('filter-section-favorites').querySelector('.filter-section-content');

  expect(peopleContent).toBeTruthy();
  expect(favoritesContent).toBeTruthy();
  expect(ratingContent).toBeNull();
});

it('should fall back to all expanded when legacy expanded-section preferences only contain unknown sections', () => {
  localStorage.setItem(EXPANDED_KEY, JSON.stringify(['obsolete-section']));

  renderPanel(['people', 'rating', 'favorites']);

  const peopleContent = screen.getByTestId('filter-section-people').querySelector('.filter-section-content');
  const ratingContent = screen.getByTestId('filter-section-rating').querySelector('.filter-section-content');
  const favoritesContent = screen.getByTestId('filter-section-favorites').querySelector('.filter-section-content');

  expect(peopleContent).toBeTruthy();
  expect(ratingContent).toBeTruthy();
  expect(favoritesContent).toBeTruthy();
});

it('should expand newly introduced sections from stored known-section metadata', () => {
  localStorage.setItem(
    EXPANDED_KEY,
    JSON.stringify({
      selected: ['people'],
      known: ['people', 'rating', 'favorites'],
    }),
  );

  renderPanel(['people', 'rating', 'favorites', 'media']);

  const mediaContent = screen.getByTestId('filter-section-media').querySelector('.filter-section-content');
  const ratingContent = screen.getByTestId('filter-section-rating').querySelector('.filter-section-content');
  const favoritesContent = screen.getByTestId('filter-section-favorites').querySelector('.filter-section-content');

  expect(mediaContent).toBeTruthy();
  expect(ratingContent).toBeNull();
  expect(favoritesContent).toBeNull();
});
```

- [ ] **Step 3: Run the failing persistence tests**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/components/filter-panel/__tests__/filter-panel.spec.ts
```

Expected: the new tests fail because legacy arrays do not add Favorites and stored metadata is not supported.

- [ ] **Step 4: Implement section-set hydration helpers**

In `web/src/lib/components/filter-panel/filter-panel.svelte`, replace `loadVisibleSections()` and `loadExpandedSections()` with shared helpers. Keep `EXPANDED_SECTIONS_KEY` above the expanded-state loader.

```svelte
  type StoredSectionSet = string[] | { selected?: string[]; known?: string[] };

  const LEGACY_INTRODUCED_SECTIONS = new Set<FilterSectionType>(['favorites']);

  function isFilterSection(value: string, configSections: FilterSectionType[]): value is FilterSectionType {
    return configSections.includes(value as FilterSectionType);
  }

  function getValidSections(values: unknown, configSections: FilterSectionType[]): FilterSectionType[] {
    if (!Array.isArray(values)) {
      return [];
    }
    return values.filter((value): value is FilterSectionType => {
      return typeof value === 'string' && isFilterSection(value, configSections);
    });
  }

  function getLegacyKnownSections(
    selected: FilterSectionType[],
    configSections: FilterSectionType[],
  ): FilterSectionType[] {
    const selectedSections = new Set(selected);
    return configSections.filter((section) => selectedSections.has(section) || !LEGACY_INTRODUCED_SECTIONS.has(section));
  }

  function getLegacySections(
    values: unknown,
    configSections: FilterSectionType[],
    fallback: () => SvelteSet<FilterSectionType>,
  ): SvelteSet<FilterSectionType> {
    if (!Array.isArray(values)) {
      return fallback();
    }

    const selected = getValidSections(values, configSections);
    if (values.length > 0 && selected.length === 0) {
      return fallback();
    }

    const known = getLegacyKnownSections(selected, configSections);
    const knownSet = new Set(known);
    const introduced = configSections.filter((section) => !knownSet.has(section));
    return new SvelteSet([...selected, ...introduced]);
  }

  function hydrateSectionSet(
    configSections: FilterSectionType[],
    raw: string | null,
    fallback: () => SvelteSet<FilterSectionType>,
  ): SvelteSet<FilterSectionType> {
    if (raw === null) {
      return fallback();
    }

    try {
      const parsed = JSON.parse(raw) as StoredSectionSet;
      if (Array.isArray(parsed)) {
        return getLegacySections(parsed, configSections, fallback);
      }

      const selected = getValidSections(parsed.selected, configSections);
      const known = getValidSections(parsed.known, configSections);
      const knownSet = new Set(known);
      const introduced = configSections.filter((section) => !knownSet.has(section));

      return new SvelteSet([...selected, ...introduced]);
    } catch {
      return fallback();
    }
  }

  function serializeSectionSet(sections: SvelteSet<FilterSectionType>, configSections: FilterSectionType[]): string {
    return JSON.stringify({
      selected: [...sections],
      known: [...configSections],
    });
  }

  function loadVisibleSections(configSections: FilterSectionType[], key: string): SvelteSet<FilterSectionType> {
    if (browser) {
      return hydrateSectionSet(configSections, localStorage.getItem(key), () => new SvelteSet(configSections));
    }
    return new SvelteSet(configSections);
  }

  const EXPANDED_SECTIONS_KEY = 'gallery-filter-expanded-sections';

  function loadExpandedSections(configSections: FilterSectionType[]): SvelteSet<FilterSectionType> {
    if (browser) {
      return hydrateSectionSet(configSections, localStorage.getItem(EXPANDED_SECTIONS_KEY), () => new SvelteSet(configSections));
    }
    return new SvelteSet(configSections);
  }
```

Update the localStorage write effects:

```svelte
        localStorage.setItem(storageKey, serializeSectionSet(visibleSections, config.sections));
```

and:

```svelte
        localStorage.setItem(EXPANDED_SECTIONS_KEY, serializeSectionSet(expandedSections, config.sections));
```

- [ ] **Step 5: Run the persistence tests**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/components/filter-panel/__tests__/filter-panel.spec.ts
```

Expected: all tests in the file pass. If existing tests assert an array is stored, update them to parse `.selected` from the stored object.

- [ ] **Step 6: Commit**

```bash
git add web/src/lib/components/filter-panel/filter-panel.svelte web/src/lib/components/filter-panel/__tests__/filter-panel.spec.ts
git commit -m "fix: migrate filter section preferences"
```

---

### Task 3: Album Regression, Utility, And Config Plumbing

**Files:**

- Modify: `web/src/lib/utils/photos-filter-options.ts`
- Modify: `web/src/lib/utils/space-filter-options.ts`
- Modify: `web/src/lib/utils/album-filter-options.ts`
- Modify: `web/src/lib/utils/album-filter-config.ts`
- Modify: `web/src/lib/utils/__tests__/photos-filter-options.spec.ts`
- Modify: `web/src/lib/utils/__tests__/space-filter-options.spec.ts`
- Modify: `web/src/lib/utils/__tests__/album-filter-options.spec.ts`
- Modify: `web/src/lib/utils/__tests__/album-filter-config.spec.ts`
- Modify: `web/src/lib/utils/__tests__/map-filter-config.spec.ts`
- Modify: `web/src/routes/(user)/albums/[albumId=id]/[[photos=photos]]/[[assetId=id]]/page.route.spec.ts`

- [ ] **Step 1: Add the failing album route regression**

Add this test to `web/src/routes/(user)/albums/[albumId=id]/[[photos=photos]]/[[assetId=id]]/page.route.spec.ts`:

```ts
it('applies favorites independently in album view and picker modes', async () => {
  renderPage();
  const user = userEvent.setup();

  await waitFor(() => expect(screen.getByTestId('favorites-only')).toBeInTheDocument());
  await user.click(screen.getByTestId('favorites-only'));

  expect(screen.getByTestId('active-chip')).toHaveTextContent('Favorites');
  expect(screen.getByTestId('timeline-options').textContent).toContain('"isFavorite":true');

  await fireEvent.click(screen.getByLabelText('add_photos'));
  await waitFor(() => expect(screen.getByTestId('favorites-only')).toBeInTheDocument());
  expect(screen.queryByTestId('active-chip')).not.toBeInTheDocument();

  await user.click(screen.getByTestId('favorites-only'));

  expect(screen.getByTestId('active-chip')).toHaveTextContent('Favorites');
  expect(screen.getByTestId('timeline-options').textContent).toContain('"timelineAlbumId":"');
  expect(screen.getByTestId('timeline-options').textContent).toContain('"isFavorite":true');
  expect(screen.getByTestId('timeline-options').textContent).not.toContain('"withPartners":true');
});
```

- [ ] **Step 2: Add failing utility tests**

Add these tests to `web/src/lib/utils/__tests__/photos-filter-options.spec.ts`:

```ts
it('should include isFavorite and omit shared timeline inclusions when favorites is selected', () => {
  const filters = { ...createFilterState(), isFavorite: true };
  const options = buildPhotosTimelineOptions(filters);

  expect(options.isFavorite).toBe(true);
  expect(options).not.toHaveProperty('withPartners');
  expect(options).not.toHaveProperty('withSharedSpaces');
});
```

Add this test in the `handlePhotosRemoveFilter` describe:

```ts
it('should clear favorites filter', () => {
  const filters = { ...createFilterState(), isFavorite: true };

  expect(handlePhotosRemoveFilter(filters, 'favorites').isFavorite).toBeUndefined();
  expect(handlePhotosRemoveFilter(filters, 'isFavorite').isFavorite).toBeUndefined();
});
```

Add these tests to `web/src/lib/utils/__tests__/space-filter-options.spec.ts`:

```ts
it('preserves favorites in spaces timeline options', () => {
  const filters = { ...createFilterState(), isFavorite: true };

  expect(buildSpaceTimelineOptions('space-1', filters)).toEqual(
    expect.objectContaining({
      spaceId: 'space-1',
      isFavorite: true,
    }),
  );
});

it('clears favorites when removing favorites filter', () => {
  const filters = { ...createFilterState(), isFavorite: true };

  expect(handleSpaceRemoveFilter(filters, 'favorites').isFavorite).toBeUndefined();
  expect(handleSpaceRemoveFilter(filters, 'isFavorite').isFavorite).toBeUndefined();
});
```

Add these tests to `web/src/lib/utils/__tests__/album-filter-options.spec.ts`:

```ts
it('maps favorites for album timeline options', () => {
  const filters = { ...createFilterState(), isFavorite: true };

  expect(buildAlbumTimelineOptions('album-1', AssetOrder.Desc, filters)).toEqual(
    expect.objectContaining({
      albumId: 'album-1',
      isFavorite: true,
    }),
  );
});

it('maps favorites and omits partners for album asset picker options', () => {
  const filters = { ...createFilterState(), isFavorite: true };
  const options = buildAlbumAssetPickerOptions('album-1', filters);

  expect(options).toEqual(
    expect.objectContaining({
      timelineAlbumId: 'album-1',
      isFavorite: true,
    }),
  );
  expect(options).not.toHaveProperty('withPartners');
});
```

Add tests to `web/src/lib/utils/__tests__/album-filter-config.spec.ts`:

```ts
it('keeps the album filter sections in plan order', () => {
  const config = buildAlbumDetailFilterConfig('album-1');
  expect(config.sections).toEqual(['timeline', 'people', 'location', 'camera', 'tags', 'rating', 'media', 'favorites']);
});

it('passes isFavorite to album detail filter suggestions', async () => {
  const config = buildAlbumDetailFilterConfig('album-1');
  await config.suggestionsProvider!({ ...createFilterState(), isFavorite: true });

  expect(getFilterSuggestions).toHaveBeenCalledWith(expect.objectContaining({ albumId: 'album-1', isFavorite: true }));
});

it('keeps the picker filter sections in plan order and passes isFavorite to suggestions', async () => {
  const config = buildAlbumAssetPickerFilterConfig();
  expect(config.sections).toEqual(['timeline', 'people', 'location', 'camera', 'tags', 'rating', 'media', 'favorites']);

  await config.suggestionsProvider!({ ...createFilterState(), isFavorite: true });
  expect(getFilterSuggestions).toHaveBeenCalledWith(expect.objectContaining({ isFavorite: true }));
});
```

Update the existing album-config section-order tests to the expectations above instead of leaving duplicate tests with the old seven-section order.

- [ ] **Step 3: Run the failing utility and album route tests**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/utils/__tests__/photos-filter-options.spec.ts src/lib/utils/__tests__/space-filter-options.spec.ts src/lib/utils/__tests__/album-filter-options.spec.ts src/lib/utils/__tests__/album-filter-config.spec.ts src/lib/utils/__tests__/map-filter-config.spec.ts "src/routes/(user)/albums/[albumId=id]/[[photos=photos]]/[[assetId=id]]/page.route.spec.ts"
```

Expected: new tests fail where `isFavorite` and `favorites` are not wired yet. The album route regression should fail before album configs include Favorites and album option builders pass `isFavorite`.

- [ ] **Step 4: Implement Photos utility changes**

Update `buildPhotosTimelineOptions()` in `web/src/lib/utils/photos-filter-options.ts`:

```ts
export function buildPhotosTimelineOptions(filters: FilterState): Record<string, unknown> {
  const includeSharedTimelineAssets = filters.isFavorite === undefined;
  const base: Record<string, unknown> = {
    visibility: AssetVisibility.Timeline,
    withStacked: true,
    ...(includeSharedTimelineAssets ? { withPartners: true, withSharedSpaces: true } : {}),
  };
```

Add after the rating block:

```ts
if (filters.isFavorite !== undefined) {
  base.isFavorite = filters.isFavorite;
}
```

Add to `handlePhotosRemoveFilter()`:

```ts
    case 'favorites':
    case 'isFavorite': {
      return { ...filters, isFavorite: undefined };
    }
```

- [ ] **Step 5: Implement Spaces utility changes**

In `web/src/lib/utils/space-filter-options.ts`, add after the rating block:

```ts
if (filters.isFavorite !== undefined) {
  base.isFavorite = filters.isFavorite;
}
```

Add to `handleSpaceRemoveFilter()`:

```ts
    case 'favorites':
    case 'isFavorite': {
      return { ...filters, isFavorite: undefined };
    }
```

- [ ] **Step 6: Implement Album utility/config changes**

In `web/src/lib/utils/album-filter-config.ts`, change the sections constant:

```ts
const sections = ['timeline', 'people', 'location', 'camera', 'tags', 'rating', 'media', 'favorites'] as const;
```

Add `isFavorite` to `toSuggestionRequest()`:

```ts
    isFavorite: filters.isFavorite,
```

In `web/src/lib/utils/album-filter-options.ts`, add after the rating block:

```ts
if (filters.isFavorite !== undefined) {
  base.isFavorite = filters.isFavorite;
}
```

Change `buildAlbumAssetPickerOptions()` so `withPartners` is conditional:

```ts
export function buildAlbumAssetPickerOptions(albumId: string, filters: FilterState): Record<string, unknown> {
  return applyCommonFilterFields(
    {
      visibility: AssetVisibility.Timeline,
      ...(filters.isFavorite === undefined ? { withPartners: true } : {}),
      timelineAlbumId: albumId,
    },
    filters,
  );
}
```

- [ ] **Step 7: Run utility and album route tests**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/utils/__tests__/photos-filter-options.spec.ts src/lib/utils/__tests__/space-filter-options.spec.ts src/lib/utils/__tests__/album-filter-options.spec.ts src/lib/utils/__tests__/album-filter-config.spec.ts src/lib/utils/__tests__/map-filter-config.spec.ts "src/routes/(user)/albums/[albumId=id]/[[photos=photos]]/[[assetId=id]]/page.route.spec.ts"
```

Expected: all listed utility tests and the album route spec pass.

- [ ] **Step 8: Commit**

```bash
git add web/src/lib/utils/photos-filter-options.ts web/src/lib/utils/space-filter-options.ts web/src/lib/utils/album-filter-options.ts web/src/lib/utils/album-filter-config.ts web/src/lib/utils/__tests__/photos-filter-options.spec.ts web/src/lib/utils/__tests__/space-filter-options.spec.ts web/src/lib/utils/__tests__/album-filter-options.spec.ts web/src/lib/utils/__tests__/album-filter-config.spec.ts web/src/lib/utils/__tests__/map-filter-config.spec.ts web/src/routes/'(user)'/albums/'[albumId=id]'/'[[photos=photos]]'/'[[assetId=id]]'/page.route.spec.ts
git commit -m "fix: wire favorites filter options"
```

---

### Task 4: Route Wiring For Photos And Spaces

**Files:**

- Create: `web/src/test-data/mocks/filter-panel-favorites.stub.svelte`
- Modify: `web/src/test-data/mocks/smart-search-results.stub.svelte`
- Modify: `web/src/routes/(user)/photos/[[assetId=id]]/+page.svelte`
- Modify: `web/src/routes/(user)/photos/[[assetId=id]]/photos-page.spec.ts`
- Modify: `web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte`
- Modify: `web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/spaces-page.spec.ts`

- [ ] **Step 1: Create a route-test filter panel stub**

Create `web/src/test-data/mocks/filter-panel-favorites.stub.svelte`:

```svelte
<script lang="ts">
  import {
    buildFilterContext,
    createFilterState,
    type FilterPanelConfig,
    type FilterState,
  } from '$lib/components/filter-panel/filter-panel';

  interface Props {
    filters?: FilterState;
    config?: FilterPanelConfig;
    [key: string]: unknown;
  }

  let { filters = $bindable(createFilterState()), config, ...rest }: Props = $props();

  function selectFavorites() {
    filters = { ...filters, isFavorite: true };
  }

  function loadCitySuggestions() {
    void config?.providers?.cities?.('Germany', buildFilterContext(filters, ['country', 'city']));
  }

  function loadCameraModelSuggestions() {
    void config?.providers?.cameraModels?.('Sony', buildFilterContext(filters, ['make', 'model']));
  }
</script>

<div
  {...rest}
  data-testid="filter-panel-stub"
  data-sections={config?.sections.join(',') ?? ''}
  data-is-favorite={String(filters?.isFavorite)}
>
  <button type="button" data-testid="select-favorites-filter" onclick={selectFavorites}>Favorites</button>
  <button type="button" data-testid="load-city-suggestions" onclick={loadCitySuggestions}>Load cities</button>
  <button type="button" data-testid="load-camera-model-suggestions" onclick={loadCameraModelSuggestions}>
    Load camera models
  </button>
</div>
```

- [ ] **Step 2: Expose shared-space scope in smart-search test stub**

Update `web/src/test-data/mocks/smart-search-results.stub.svelte` props and markup:

```svelte
  interface Props {
    isLoading?: boolean;
    searchQuery?: string;
    filters?: FilterState;
    withSharedSpaces?: boolean;
    spaceId?: string;
    [key: string]: unknown;
  }

  let {
    isLoading = $bindable(false),
    searchQuery = '',
    filters,
    withSharedSpaces,
    spaceId,
    ...rest
  }: Props = $props();
```

Add these attributes to the root `<div>`:

```svelte
  data-is-favorite={String(filters?.isFavorite)}
  data-with-shared-spaces={String(withSharedSpaces)}
  data-space-id={spaceId ?? ''}
```

- [ ] **Step 3: Add failing Photos route tests**

In `web/src/routes/(user)/photos/[[assetId=id]]/photos-page.spec.ts`, change the FilterPanel mock to:

```ts
vi.mock('$lib/components/filter-panel/filter-panel.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/filter-panel-favorites.stub.svelte');
  return { default: MockComponent };
});
```

Import the mocked utility:

```ts
import { buildPhotosTimelineOptions } from '$lib/utils/photos-filter-options';
```

Import mocked SDK suggestions:

```ts
import { getSearchSuggestions } from '@immich/sdk';
```

Update the Testing Library import to include `fireEvent` and `waitFor`:

```ts
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
```

Add tests:

```ts
it('exposes favorites in the Photos filter panel', () => {
  mockPage.url = new URL('https://gallery.test/photos');

  renderPage();

  expect(screen.getByTestId('filter-panel-stub')).toHaveAttribute(
    'data-sections',
    'timeline,people,location,camera,tags,rating,media,favorites',
  );
});

it('selects favorites in Photos timeline mode and uses owner-only timeline options', async () => {
  mockPage.url = new URL('https://gallery.test/photos');

  renderPage();
  await fireEvent.click(screen.getByTestId('select-favorites-filter'));

  await waitFor(() => {
    expect(buildPhotosTimelineOptions).toHaveBeenCalledWith(expect.objectContaining({ isFavorite: true }));
  });
});

it('selects favorites in Photos search mode and disables shared-space search scope', async () => {
  mockPage.url = new URL('https://gallery.test/photos?q=nature');

  renderPage();
  await fireEvent.click(screen.getByTestId('select-favorites-filter'));

  expect(screen.getByTestId('smart-search-results')).toHaveAttribute('data-is-favorite', 'true');
  expect(screen.getByTestId('smart-search-results')).toHaveAttribute('data-with-shared-spaces', 'false');
});

it('selects favorites in Photos and disables shared-space scope for dependent suggestions', async () => {
  mockPage.url = new URL('https://gallery.test/photos');

  renderPage();
  await fireEvent.click(screen.getByTestId('select-favorites-filter'));
  await fireEvent.click(screen.getByTestId('load-city-suggestions'));
  await fireEvent.click(screen.getByTestId('load-camera-model-suggestions'));

  expect(getSearchSuggestions).toHaveBeenCalledWith(expect.objectContaining({ country: 'Germany', isFavorite: true }));
  expect(getSearchSuggestions).toHaveBeenCalledWith(expect.objectContaining({ make: 'Sony', isFavorite: true }));
  for (const [request] of vi.mocked(getSearchSuggestions).mock.calls) {
    expect(request).not.toHaveProperty('withSharedSpaces');
  }
});
```

- [ ] **Step 4: Add failing Spaces route tests**

In `web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/spaces-page.spec.ts`, keep the bindable filter-panel mock or switch it to the new favorites stub:

```ts
vi.mock('$lib/components/filter-panel/filter-panel.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/filter-panel-favorites.stub.svelte');
  return { default: MockComponent };
});
```

Update the Testing Library import to include `fireEvent`:

```ts
import { fireEvent, render, screen } from '@testing-library/svelte';
```

Add tests:

```ts
it('exposes favorites in the Spaces view filter panel', () => {
  renderPage();

  expect(screen.getByTestId('filter-panel-stub')).toHaveAttribute(
    'data-sections',
    'timeline,people,location,camera,tags,rating,media,favorites',
  );
});

it('keeps favorites scoped to the concrete space in Spaces search mode', async () => {
  mockPage.url = new URL('https://gallery.test/spaces/space-1/photos?q=beach');

  renderPage();
  await fireEvent.click(screen.getByTestId('select-favorites-filter'));

  expect(screen.getByTestId('smart-search-results')).toHaveAttribute('data-is-favorite', 'true');
  expect(screen.getByTestId('smart-search-results')).toHaveAttribute('data-space-id', 'space-1');
});
```

- [ ] **Step 5: Run failing route tests**

Run:

```bash
pnpm --dir web exec vitest --run "src/routes/(user)/photos/[[assetId=id]]/photos-page.spec.ts" "src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/spaces-page.spec.ts"
```

Expected: Photos and Spaces section tests fail until route configs include `favorites`; Photos search scope test fails until `withSharedSpaces` is conditional.

- [ ] **Step 6: Implement Photos route changes**

In `web/src/routes/(user)/photos/[[assetId=id]]/+page.svelte`, change the config sections:

```ts
    sections: ['timeline', 'people', 'location', 'camera', 'tags', 'rating', 'media', 'favorites'],
```

In the suggestions request, change:

```ts
        withSharedSpaces: true,
```

to:

```ts
        withSharedSpaces: filters.isFavorite === undefined ? true : undefined,
```

In both dependent providers, change the shared-space spread to:

```ts
          ...(context?.isFavorite === undefined ? { withSharedSpaces: true } : {}),
```

In the `SmartSearchResults` usage, change:

```svelte
          withSharedSpaces={true}
```

to:

```svelte
          withSharedSpaces={filters.isFavorite === undefined}
```

- [ ] **Step 7: Implement Spaces route section change**

In `web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte`, change:

```ts
    sections: ['timeline', 'people', 'location', 'camera', 'tags', 'rating', 'media'],
```

to:

```ts
    sections: ['timeline', 'people', 'location', 'camera', 'tags', 'rating', 'media', 'favorites'],
```

- [ ] **Step 8: Run route tests**

Run:

```bash
pnpm --dir web exec vitest --run "src/routes/(user)/photos/[[assetId=id]]/photos-page.spec.ts" "src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/spaces-page.spec.ts"
```

Expected: both route spec files pass.

- [ ] **Step 9: Commit**

```bash
git add web/src/test-data/mocks/filter-panel-favorites.stub.svelte web/src/test-data/mocks/smart-search-results.stub.svelte web/src/routes/'(user)'/photos/'[[assetId=id]]'/+page.svelte web/src/routes/'(user)'/photos/'[[assetId=id]]'/photos-page.spec.ts web/src/routes/'(user)'/spaces/'[spaceId]'/'[[photos=photos]]'/'[[assetId=id]]'/+page.svelte web/src/routes/'(user)'/spaces/'[spaceId]'/'[[photos=photos]]'/'[[assetId=id]]'/spaces-page.spec.ts
git commit -m "fix: add favorites filter to photos and spaces"
```

---

### Task 5: Focused Verification And Cleanup

**Files:**

- Review all files modified by Tasks 1-4.

- [ ] **Step 1: Run the full focused test suite**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/components/filter-panel/__tests__/active-filters-bar.spec.ts src/lib/components/filter-panel/__tests__/filter-panel.spec.ts src/lib/components/filter-panel/__tests__/favorites-filter.spec.ts src/lib/components/filter-panel/__tests__/filter-state.spec.ts src/lib/utils/__tests__/map-filter-config.spec.ts src/lib/utils/__tests__/photos-filter-options.spec.ts src/lib/utils/__tests__/space-filter-options.spec.ts src/lib/utils/__tests__/album-filter-options.spec.ts src/lib/utils/__tests__/album-filter-config.spec.ts src/lib/utils/__tests__/space-search.spec.ts "src/routes/(user)/photos/[[assetId=id]]/photos-page.spec.ts" "src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/spaces-page.spec.ts" "src/routes/(user)/albums/[albumId=id]/[[photos=photos]]/[[assetId=id]]/page.route.spec.ts"
```

Expected: all listed tests pass.

- [ ] **Step 2: Run Svelte and TypeScript checks**

Run:

```bash
pnpm --dir web run check:svelte
pnpm --dir web run check:typescript
```

Expected: both commands pass. If `check:svelte` reports unrelated pre-existing warnings, capture the exact output and only fix warnings caused by this branch.

- [ ] **Step 3: Run formatting check on touched files**

Run:

```bash
pnpm --dir web exec prettier --check src/lib/components/filter-panel/active-filters-bar.svelte src/lib/components/filter-panel/filter-panel.svelte src/lib/components/filter-panel/__tests__/active-filters-bar.spec.ts src/lib/components/filter-panel/__tests__/filter-panel.spec.ts src/lib/utils/photos-filter-options.ts src/lib/utils/space-filter-options.ts src/lib/utils/album-filter-options.ts src/lib/utils/album-filter-config.ts src/lib/utils/__tests__/photos-filter-options.spec.ts src/lib/utils/__tests__/space-filter-options.spec.ts src/lib/utils/__tests__/album-filter-options.spec.ts src/lib/utils/__tests__/album-filter-config.spec.ts src/routes/'(user)'/photos/'[[assetId=id]]'/+page.svelte src/routes/'(user)'/photos/'[[assetId=id]]'/photos-page.spec.ts src/routes/'(user)'/spaces/'[spaceId]'/'[[photos=photos]]'/'[[assetId=id]]'/+page.svelte src/routes/'(user)'/spaces/'[spaceId]'/'[[photos=photos]]'/'[[assetId=id]]'/spaces-page.spec.ts src/routes/'(user)'/albums/'[albumId=id]'/'[[photos=photos]]'/'[[assetId=id]]'/page.route.spec.ts src/test-data/mocks/filter-panel-favorites.stub.svelte src/test-data/mocks/smart-search-results.stub.svelte
```

Expected: Prettier reports all checked files are formatted. If not, run the same command with `--write`, inspect the diff, and include formatting changes in the final commit.

- [ ] **Step 4: Inspect final diff**

Run:

```bash
git diff --stat
git diff --check
```

Expected: diff contains only Favorites filter parity changes and no whitespace errors.

- [ ] **Step 5: Final commit if needed**

If Step 2 or Step 3 produced cleanup changes, commit them:

```bash
git add web
git commit -m "chore: clean up favorites filter checks"
```

If there are no cleanup changes, do not create an empty commit.
