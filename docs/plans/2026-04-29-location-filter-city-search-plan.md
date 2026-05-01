# Location Filter City Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the location filter searchable by city while keeping expanded country city lists bounded.

**Architecture:** Keep the change local to `LocationFilter`. Add component-local city caching keyed by country, invalidate it when country suggestions or filter context changes, and derive displayed countries/cities from search query, selection, cached city matches, and per-country caps. Keep `FilterPanelConfig.providers.cities` unchanged.

**Tech Stack:** Svelte 5, `@testing-library/svelte`, Vitest, existing `FilterPanel` provider callbacks.

---

## File Structure

- Modify: `web/src/lib/components/filter-panel/location-filter.svelte`
  - Owns location search state, country cap, city cache, city cap, city fetch lifecycle, and selection callbacks.
  - Do not add backend/API changes.
  - Do not introduce plain `Map` or `Set` in the Svelte component. Use records or Svelte reactive collections.
- Modify: `web/src/lib/components/filter-panel/__tests__/filter-sections.spec.ts`
  - Extend the existing `LocationFilter` describe block.
  - Update existing expectations that conflict with the new design, especially selected location visibility during search.
- Create: `docs/plans/2026-04-29-location-filter-city-search-plan.md`
  - This implementation plan.

## Commands

Run once in a fresh worktree before web tests if the SDK has not already been built:

```bash
pnpm --filter @immich/sdk build
```

Targeted test command:

```bash
pnpm --filter immich-web exec vitest run src/lib/components/filter-panel/__tests__/filter-sections.spec.ts
```

Broader practical verification after implementation:

```bash
pnpm --filter immich-web run check:svelte
pnpm --filter immich-web exec vitest run src/lib/components/filter-panel/__tests__/filter-sections.spec.ts
```

## Task 0: Commit Reviewed Design And Plan

**Files:**

- Add: `docs/plans/2026-04-29-location-filter-city-search-design.md`
- Add: `docs/plans/2026-04-29-location-filter-city-search-plan.md`

- [ ] **Step 1: Verify the docs are the only untracked planned files**

Run:

```bash
git status --short
```

Expected output includes:

```text
?? docs/plans/2026-04-29-location-filter-city-search-design.md
?? docs/plans/2026-04-29-location-filter-city-search-plan.md
```

- [ ] **Step 2: Commit the reviewed docs**

Run:

```bash
git add docs/plans/2026-04-29-location-filter-city-search-design.md docs/plans/2026-04-29-location-filter-city-search-plan.md
git commit -m "docs: plan location city search"
```

Expected: one docs commit on `feat/location-filter-city-search`.

## Task 1: Red Test For Capped City Lists

**Files:**

- Modify: `web/src/lib/components/filter-panel/__tests__/filter-sections.spec.ts`

- [ ] **Step 1: Add tests before production code**

Add these tests inside `describe('LocationFilter', () => { ... })`, after `should show cities when country is expanded`. The first test is the required RED test for the core bug. The other two lock edge behavior before any production code is written.

```ts
it('should cap expanded city lists and expand cities with city-level show more', async () => {
  const cities = Array.from({ length: 12 }, (_, index) => `City ${index + 1}`);

  const { getByTestId, queryByTestId } = render(LocationFilter, {
    props: {
      countries: ['Germany'],
      onCityFetch: () => Promise.resolve(cities),
      onSelectionChange: () => {},
    },
  });

  await fireEvent.click(getByTestId('location-country-Germany'));

  await waitFor(() => {
    expect(queryByTestId('location-city-City 1')).toBeTruthy();
    expect(queryByTestId('location-city-City 10')).toBeTruthy();
    expect(queryByTestId('location-city-City 11')).toBeNull();
    expect(queryByTestId('location-city-City 12')).toBeNull();
    expect(getByTestId('location-city-show-more-Germany').textContent).toContain('Show 2 more');
  });

  await fireEvent.click(getByTestId('location-city-show-more-Germany'));

  expect(queryByTestId('location-city-City 11')).toBeTruthy();
  expect(queryByTestId('location-city-City 12')).toBeTruthy();
});

it('should expand hidden cities only for the selected country city list', async () => {
  const cityMap: Record<string, string[]> = {
    Germany: Array.from({ length: 12 }, (_, index) => `German City ${index + 1}`),
    France: Array.from({ length: 12 }, (_, index) => `French City ${index + 1}`),
  };

  const { getByTestId, queryByTestId } = render(LocationFilter, {
    props: {
      countries: ['Germany', 'France'],
      onCityFetch: (country) => Promise.resolve(cityMap[country] ?? []),
      onSelectionChange: () => {},
    },
  });

  await fireEvent.click(getByTestId('location-country-Germany'));
  await waitFor(() => expect(queryByTestId('location-city-German City 11')).toBeNull());

  await fireEvent.click(getByTestId('location-city-show-more-Germany'));
  expect(queryByTestId('location-city-German City 11')).toBeTruthy();

  await fireEvent.click(getByTestId('location-country-France'));
  await waitFor(() => {
    expect(queryByTestId('location-city-French City 10')).toBeTruthy();
    expect(queryByTestId('location-city-French City 11')).toBeNull();
  });
});

it('should not show city-level show more for countries with no cities', async () => {
  const { getByTestId, queryByTestId } = render(LocationFilter, {
    props: {
      countries: ['Germany'],
      onCityFetch: () => Promise.resolve([]),
      onSelectionChange: () => {},
    },
  });

  await fireEvent.click(getByTestId('location-country-Germany'));

  await waitFor(() => {
    expect(queryByTestId('location-city-show-more-Germany')).toBeNull();
  });
});
```

- [ ] **Step 2: Run the targeted test and verify RED**

Run:

```bash
pnpm --filter immich-web exec vitest run src/lib/components/filter-panel/__tests__/filter-sections.spec.ts
```

Expected: FAIL because `location-city-City 11` is currently rendered and `location-city-show-more-Germany` does not exist. Do not proceed unless the first new test fails for that reason.

- [ ] **Step 3: Implement the minimal city cap**

In `web/src/lib/components/filter-panel/location-filter.svelte`, replace:

```ts
let showAll = $state(false);

const INITIAL_SHOW_COUNT = 10;
```

with:

```ts
let showAll = $state(false);
let expandedCityLists = $state<Record<string, boolean>>({});

const COUNTRY_SHOW_COUNT = 10;
const CITY_SHOW_COUNT = 10;
```

Replace current uses of `INITIAL_SHOW_COUNT` for country display with `COUNTRY_SHOW_COUNT`:

```ts
let visibleCountries = $derived(
  searchQuery.trim() || showAll ? filteredCountries : filteredCountries.slice(0, COUNTRY_SHOW_COUNT),
);

let remainingCount = $derived(Math.max(0, filteredCountries.length - COUNTRY_SHOW_COUNT));
```

Add these helpers before `handleCountryClick`:

```ts
function getFilteredCities(country: string): string[] {
  return cities;
}

function getVisibleCities(country: string): string[] {
  const filtered = getFilteredCities(country);
  return expandedCityLists[country] ? filtered : filtered.slice(0, CITY_SHOW_COUNT);
}

function getRemainingCityCount(country: string): number {
  return Math.max(0, getFilteredCities(country).length - CITY_SHOW_COUNT);
}

function showAllCities(country: string) {
  expandedCityLists = { ...expandedCityLists, [country]: true };
}
```

Reset collapsed city state when opening a country by replacing `handleCountryClick` with:

```ts
function handleCountryClick(country: string) {
  if (selectedCountry === country && !selectedCity) {
    expandedCountry = undefined;
    onSelectionChange(undefined, undefined);
  } else {
    expandedCountry = country;
    expandedCityLists = { ...expandedCityLists, [country]: false };
    onSelectionChange(country, undefined);
  }
}
```

Replace the city `#each` block:

```svelte
        {#each cities as city (city)}
```

with:

```svelte
        {#each getVisibleCities(country) as city (city)}
```

Add this immediately after the city `#each` block and still inside `expandedCountry === country && !loadingCities`:

```svelte
        {#if !expandedCityLists[country] && getRemainingCityCount(country) > 0}
          <button
            type="button"
            class="ml-5 py-1 text-xs font-medium text-immich-primary dark:text-immich-dark-primary"
            onclick={() => showAllCities(country)}
            data-testid="location-city-show-more-{country}"
          >
            Show {getRemainingCityCount(country)} more
          </button>
        {/if}
```

- [ ] **Step 4: Run the targeted test and verify GREEN**

Run:

```bash
pnpm --filter immich-web exec vitest run src/lib/components/filter-panel/__tests__/filter-sections.spec.ts
```

Expected: PASS for the new cap test and all existing `LocationFilter` tests.

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/components/filter-panel/location-filter.svelte web/src/lib/components/filter-panel/__tests__/filter-sections.spec.ts
git commit -m "feat: cap location city lists"
```

## Task 2: Complete City Search Across Current Country Suggestions

**Files:**

- Modify: `web/src/lib/components/filter-panel/__tests__/filter-sections.spec.ts`
- Modify: `web/src/lib/components/filter-panel/location-filter.svelte`

- [ ] **Step 1: Add failing city-search tests**

Add these tests inside the `LocationFilter` describe block:

```ts
it('should search city names and show matching cities under their country', async () => {
  const { getByTestId, queryByTestId } = render(LocationFilter, {
    props: {
      countries: mockCountries,
      onCityFetch: mockCityFetch,
      onSelectionChange: () => {},
    },
  });

  await fireEvent.input(getByTestId('location-search-input'), { target: { value: 'ber' } });

  await waitFor(() => {
    expect(queryByTestId('location-country-Germany')).toBeTruthy();
    expect(queryByTestId('location-city-Berlin')).toBeTruthy();
    expect(queryByTestId('location-country-Italy')).toBeNull();
    expect(queryByTestId('location-city-Munich')).toBeNull();
  });
});

it('should find a city in a country beyond the initial country cap', async () => {
  const cityMap: Record<string, string[]> = {
    Mexico: ['Merida'],
  };

  const { getByTestId, queryByTestId } = render(LocationFilter, {
    props: {
      countries: manyCountries,
      onCityFetch: (country) => Promise.resolve(cityMap[country] ?? []),
      onSelectionChange: () => {},
    },
  });

  expect(queryByTestId('location-country-Mexico')).toBeNull();

  await fireEvent.input(getByTestId('location-search-input'), { target: { value: 'meri' } });

  await waitFor(() => {
    expect(queryByTestId('location-country-Mexico')).toBeTruthy();
    expect(queryByTestId('location-city-Merida')).toBeTruthy();
  });
});

it('should select a city from city search results', async () => {
  const onSelectionChange = vi.fn();

  const { getByTestId, queryByTestId } = render(LocationFilter, {
    props: {
      countries: mockCountries,
      onCityFetch: mockCityFetch,
      onSelectionChange,
    },
  });

  await fireEvent.input(getByTestId('location-search-input'), { target: { value: 'ber' } });

  await waitFor(() => expect(queryByTestId('location-city-Berlin')).toBeTruthy());
  await fireEvent.click(getByTestId('location-city-Berlin'));

  expect(onSelectionChange).toHaveBeenLastCalledWith('Germany', 'Berlin');
});
```

- [ ] **Step 2: Run and verify RED**

Run:

```bash
pnpm --filter immich-web exec vitest run src/lib/components/filter-panel/__tests__/filter-sections.spec.ts
```

Expected: FAIL because city search currently only filters countries and does not fetch/search cities.

- [ ] **Step 3: Add city cache and search fetching**

In `location-filter.svelte`, add a normalized query and cache state after `expandedCityLists`:

```ts
let cityCache = $state<Record<string, string[]>>({});
let loadingCitiesByCountry = $state<Record<string, boolean>>({});
let cityFetchErrors = $state<Record<string, boolean>>({});
let latestCityFetchIds = $state<Record<string, number>>({});
let cityFetchSequence = 0;

let normalizedSearchQuery = $derived(searchQuery.trim().toLowerCase());
let cityCacheKey = $state('');
```

Add cache invalidation after the existing country-length reset effect:

```ts
$effect(() => {
  const nextKey = JSON.stringify({ countries, context });
  if (cityCacheKey && nextKey !== cityCacheKey) {
    cityCache = {};
    loadingCitiesByCountry = {};
    cityFetchErrors = {};
    latestCityFetchIds = {};
    expandedCityLists = {};
    cities = [];
  }
  cityCacheKey = nextKey;
});
```

Add `ensureCities` before the existing city-fetching effect:

```ts
function ensureCities(country: string) {
  if (cityCache[country] || loadingCitiesByCountry[country]) {
    return;
  }

  const fetchId = ++cityFetchSequence;
  const requestContext = context;
  latestCityFetchIds = { ...latestCityFetchIds, [country]: fetchId };
  loadingCitiesByCountry = { ...loadingCitiesByCountry, [country]: true };
  cityFetchErrors = { ...cityFetchErrors, [country]: false };

  void onCityFetch(country, requestContext)
    .then((result) => {
      if (latestCityFetchIds[country] !== fetchId) {
        return;
      }

      cityCache = { ...cityCache, [country]: result };
      loadingCitiesByCountry = { ...loadingCitiesByCountry, [country]: false };

      if (selectedCountry === country && selectedCity && result.length > 0 && !result.includes(selectedCity)) {
        onSelectionChange(country, undefined);
      }
    })
    .catch((error) => {
      console.error('Failed to fetch cities:', error);
      if (latestCityFetchIds[country] !== fetchId) {
        return;
      }

      loadingCitiesByCountry = { ...loadingCitiesByCountry, [country]: false };
      cityFetchErrors = { ...cityFetchErrors, [country]: true };
    });
}
```

Replace the existing `$effect` that directly calls `onCityFetch(expandedCountry, _context)` with:

```ts
$effect(() => {
  if (expandedCountry) {
    ensureCities(expandedCountry);
    cities = cityCache[expandedCountry] ?? [];
  } else {
    cities = [];
  }
});

$effect(() => {
  if (!selectedCountry) {
    return;
  }

  ensureCities(selectedCountry);
});

$effect(() => {
  if (!normalizedSearchQuery) {
    return;
  }

  const timer = setTimeout(() => {
    for (const country of countries) {
      ensureCities(country);
    }
  }, 150);

  return () => clearTimeout(timer);
});
```

Replace `filteredCountries` with:

```ts
let filteredCountries = $derived.by(() => {
  if (!normalizedSearchQuery) {
    return countries;
  }

  return countries.filter((country) => {
    const countryMatches = country.toLowerCase().includes(normalizedSearchQuery);
    const cityMatches = (cityCache[country] ?? []).some((city) => city.toLowerCase().includes(normalizedSearchQuery));
    return countryMatches || cityMatches || selectedCountry === country;
  });
});
```

Replace `getFilteredCities` with:

```ts
function getFilteredCities(country: string): string[] {
  const cachedCities = cityCache[country] ?? (expandedCountry === country ? cities : []);
  if (!normalizedSearchQuery) {
    return cachedCities;
  }

  return cachedCities.filter((city) => city.toLowerCase().includes(normalizedSearchQuery));
}
```

Change the city section condition:

```svelte
      {#if (expandedCountry === country || (normalizedSearchQuery && (cityCache[country] ?? []).length > 0)) && !loadingCitiesByCountry[country]}
```

- [ ] **Step 4: Run and verify GREEN**

Run:

```bash
pnpm --filter immich-web exec vitest run src/lib/components/filter-panel/__tests__/filter-sections.spec.ts
```

Expected: PASS for the three city-search tests and existing country search tests.

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/components/filter-panel/location-filter.svelte web/src/lib/components/filter-panel/__tests__/filter-sections.spec.ts
git commit -m "feat: search location cities"
```

## Task 3: Selection Visibility And Toggle Edge Cases

**Files:**

- Modify: `web/src/lib/components/filter-panel/__tests__/filter-sections.spec.ts`
- Modify: `web/src/lib/components/filter-panel/location-filter.svelte`

- [ ] **Step 1: Update/add failing selection tests**

Replace the existing `should preserve selected country across search/clear cycle` test with:

```ts
it('should keep selected country visible during search even when it does not match', async () => {
  const { getByTestId, queryByTestId } = render(LocationFilter, {
    props: {
      countries: mockCountries,
      selectedCountry: 'Germany',
      onCityFetch: mockCityFetch,
      onSelectionChange: () => {},
    },
  });

  await fireEvent.input(getByTestId('location-search-input'), { target: { value: 'Italy' } });

  expect(queryByTestId('location-country-Germany')).toBeTruthy();
  expect(queryByTestId('location-country-Italy')).toBeTruthy();
});
```

Add these tests inside the `LocationFilter` describe block:

```ts
it('should keep selected city visible when it is outside the initial city cap', async () => {
  const cities = Array.from({ length: 12 }, (_, index) => `City ${index + 1}`);

  const { getByTestId, queryByTestId } = render(LocationFilter, {
    props: {
      countries: ['Germany'],
      selectedCountry: 'Germany',
      selectedCity: 'City 12',
      onCityFetch: () => Promise.resolve(cities),
      onSelectionChange: () => {},
    },
  });

  await fireEvent.click(getByTestId('location-country-Germany'));

  await waitFor(() => {
    expect(queryByTestId('location-city-City 12')).toBeTruthy();
  });
});

it('should clear country selection when clicking an already-selected country with no selected city', async () => {
  const onSelectionChange = vi.fn();

  const { getByTestId } = render(LocationFilter, {
    props: {
      countries: mockCountries,
      selectedCountry: 'Germany',
      onCityFetch: mockCityFetch,
      onSelectionChange,
    },
  });

  await fireEvent.click(getByTestId('location-country-Germany'));

  expect(onSelectionChange).toHaveBeenLastCalledWith(undefined, undefined);
});

it('should clear city selection but keep country when clicking an already-selected city', async () => {
  const onSelectionChange = vi.fn();

  const { getByTestId, queryByTestId } = render(LocationFilter, {
    props: {
      countries: mockCountries,
      selectedCountry: 'Germany',
      selectedCity: 'Berlin',
      onCityFetch: mockCityFetch,
      onSelectionChange,
    },
  });

  await fireEvent.click(getByTestId('location-country-Germany'));
  await waitFor(() => expect(queryByTestId('location-city-Berlin')).toBeTruthy());
  await fireEvent.click(getByTestId('location-city-Berlin'));

  expect(onSelectionChange).toHaveBeenLastCalledWith('Germany', undefined);
});
```

- [ ] **Step 2: Run and verify RED**

Run:

```bash
pnpm --filter immich-web exec vitest run src/lib/components/filter-panel/__tests__/filter-sections.spec.ts
```

Expected: FAIL because selected city `City 12` is outside the initial city cap and is not rendered.

- [ ] **Step 3: Preserve selected country/city in derived lists**

Replace `getVisibleCities` with:

```ts
function getVisibleCities(country: string): string[] {
  const filtered = getFilteredCities(country);
  const visible = expandedCityLists[country] ? filtered : filtered.slice(0, CITY_SHOW_COUNT);

  if (
    selectedCountry === country &&
    selectedCity &&
    (cityCache[country] ?? []).includes(selectedCity) &&
    !visible.includes(selectedCity)
  ) {
    return [...visible, selectedCity];
  }

  return visible;
}
```

Verify the `filteredCountries` return expression is exactly:

```ts
return countryMatches || cityMatches || selectedCountry === country;
```

- [ ] **Step 4: Run and verify GREEN**

Run:

```bash
pnpm --filter immich-web exec vitest run src/lib/components/filter-panel/__tests__/filter-sections.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/components/filter-panel/location-filter.svelte web/src/lib/components/filter-panel/__tests__/filter-sections.spec.ts
git commit -m "fix: preserve selected location visibility"
```

## Task 4: Async Failures, Loading, And Stale Fetches

**Files:**

- Modify: `web/src/lib/components/filter-panel/__tests__/filter-sections.spec.ts`
- Modify: `web/src/lib/components/filter-panel/location-filter.svelte`

- [ ] **Step 1: Add failing async edge-case tests**

Add these tests inside the `LocationFilter` describe block:

```ts
it('should not show no-results while city search fetches are still pending', async () => {
  let resolveCities!: (cities: string[]) => void;
  const pendingCities = new Promise<string[]>((resolve) => {
    resolveCities = resolve;
  });

  const { getByTestId, queryByTestId } = render(LocationFilter, {
    props: {
      countries: ['Germany'],
      onCityFetch: () => pendingCities,
      onSelectionChange: () => {},
    },
  });

  await fireEvent.input(getByTestId('location-search-input'), { target: { value: 'ber' } });

  expect(queryByTestId('location-no-results')).toBeNull();

  resolveCities(['Berlin']);

  await waitFor(() => {
    expect(queryByTestId('location-city-Berlin')).toBeTruthy();
    expect(queryByTestId('location-no-results')).toBeNull();
  });
});

it('should keep the panel usable when a city fetch fails', async () => {
  const onSelectionChange = vi.fn();

  const { getByTestId, queryByTestId } = render(LocationFilter, {
    props: {
      countries: ['Germany', 'France'],
      selectedCountry: 'Germany',
      onCityFetch: (country) =>
        country === 'Germany' ? Promise.reject(new Error('failed')) : Promise.resolve(['Paris']),
      onSelectionChange,
    },
  });

  await fireEvent.click(getByTestId('location-country-Germany'));

  await waitFor(() => {
    expect(queryByTestId('location-country-Germany')).toBeTruthy();
  });

  await fireEvent.click(getByTestId('location-country-France'));
  expect(onSelectionChange).toHaveBeenLastCalledWith('France', undefined);
});

it('should ignore stale city fetch responses after context changes', async () => {
  let resolveFirst!: (cities: string[]) => void;
  let resolveSecond!: (cities: string[]) => void;
  const first = new Promise<string[]>((resolve) => {
    resolveFirst = resolve;
  });
  const second = new Promise<string[]>((resolve) => {
    resolveSecond = resolve;
  });
  const cityFetch = vi.fn().mockReturnValueOnce(first).mockReturnValueOnce(second);

  const { getByTestId, queryByTestId, rerender } = render(LocationFilter, {
    props: {
      countries: ['Germany'],
      context: { isFavorite: true },
      onCityFetch: cityFetch,
      onSelectionChange: () => {},
    },
  });

  await fireEvent.click(getByTestId('location-country-Germany'));

  await rerender({
    countries: ['Germany'],
    context: { isFavorite: false },
    onCityFetch: cityFetch,
    onSelectionChange: () => {},
  });

  await fireEvent.click(getByTestId('location-country-Germany'));

  resolveSecond(['Berlin']);
  await waitFor(() => expect(queryByTestId('location-city-Berlin')).toBeTruthy());

  resolveFirst(['Munich']);
  await new Promise((resolve) => setTimeout(resolve, 0));

  expect(queryByTestId('location-city-Berlin')).toBeTruthy();
  expect(queryByTestId('location-city-Munich')).toBeNull();
});
```

- [ ] **Step 2: Run and verify RED**

Run:

```bash
pnpm --filter immich-web exec vitest run src/lib/components/filter-panel/__tests__/filter-sections.spec.ts
```

Expected: FAIL because `location-no-results` appears before delayed city fetches have resolved, and stale in-flight city responses are not fully invalidated across context changes.

- [ ] **Step 3: Add loading/no-results and stale guards**

Add this derived value near `filteredCountries`:

```ts
let hasPendingCitySearch = $derived.by(() => {
  if (!normalizedSearchQuery) {
    return false;
  }

  return countries.some(
    (country) => loadingCitiesByCountry[country] || (!cityCache[country] && !cityFetchErrors[country]),
  );
});
```

Update the no-results condition:

```svelte
    {#if filteredCountries.length === 0 && searchQuery.trim() && !hasPendingCitySearch}
      <p class="text-sm text-gray-400 dark:text-gray-500" data-testid="location-no-results">No matching locations</p>
    {/if}
```

In the cache invalidation effect from Task 2, increment `cityFetchSequence` before clearing request IDs:

```ts
cityFetchSequence += 1;
```

The invalidation effect should contain this exact block:

```ts
cityFetchSequence += 1;
cityCache = {};
loadingCitiesByCountry = {};
cityFetchErrors = {};
latestCityFetchIds = {};
expandedCityLists = {};
cities = [];
```

- [ ] **Step 4: Run and verify GREEN**

Run:

```bash
pnpm --filter immich-web exec vitest run src/lib/components/filter-panel/__tests__/filter-sections.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/components/filter-panel/location-filter.svelte web/src/lib/components/filter-panel/__tests__/filter-sections.spec.ts
git commit -m "fix: handle location city fetch edge cases"
```

## Task 5: Final Refactor And Verification

**Files:**

- Modify: `web/src/lib/components/filter-panel/location-filter.svelte`
- Modify: `web/src/lib/components/filter-panel/__tests__/filter-sections.spec.ts`

- [ ] **Step 1: Refactor names and remove dead state**

In `location-filter.svelte`, keep the final state names clear:

```ts
const COUNTRY_SHOW_COUNT = 10;
const CITY_SHOW_COUNT = 10;

let searchQuery = $state('');
let showAll = $state(false);
let expandedCityLists = $state<Record<string, boolean>>({});
let cityCache = $state<Record<string, string[]>>({});
let loadingCitiesByCountry = $state<Record<string, boolean>>({});
let cityFetchErrors = $state<Record<string, boolean>>({});
let latestCityFetchIds = $state<Record<string, number>>({});
```

Delete the old single-purpose loading state:

```ts
let loadingCities = $state(false);
```

Replace any remaining `!loadingCities` template checks with:

```svelte
!loadingCitiesByCountry[country]
```

Keep `cities` only as the expanded-country mirror used by the Task 2 effect:

```ts
cities = cityCache[expandedCountry] ?? [];
```

- [ ] **Step 2: Run targeted tests**

Run:

```bash
pnpm --filter immich-web exec vitest run src/lib/components/filter-panel/__tests__/filter-sections.spec.ts
```

Expected: PASS.

- [ ] **Step 3: Run Svelte check**

Run:

```bash
pnpm --filter immich-web run check:svelte
```

Expected: PASS. Existing `state_referenced_locally` warnings in unrelated files are acceptable only if the command exits 0; do not add new warnings in `location-filter.svelte`.

- [ ] **Step 4: Review diff**

Run:

```bash
git diff -- web/src/lib/components/filter-panel/location-filter.svelte web/src/lib/components/filter-panel/__tests__/filter-sections.spec.ts docs/plans/2026-04-29-location-filter-city-search-design.md docs/plans/2026-04-29-location-filter-city-search-plan.md
```

Verify these points manually from the diff:

- no backend/API files changed;
- `FilterPanelConfig.providers.cities` signature is unchanged;
- city search is complete across `countries`, not only visible countries;
- selected country and selected city remain visible;
- stale fetches are guarded;
- no broad unrelated refactors are present.

- [ ] **Step 5: Commit final refactor**

```bash
git add web/src/lib/components/filter-panel/location-filter.svelte web/src/lib/components/filter-panel/__tests__/filter-sections.spec.ts
git commit -m "refactor: clean up location city search"
```

- [ ] **Step 6: Verify branch status**

Run:

```bash
git status --short
```

Expected: no output.
