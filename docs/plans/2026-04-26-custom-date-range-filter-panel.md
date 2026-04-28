# Custom Date Range Filter Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add custom from/to taken-date filtering to the shared web `FilterPanel` timeline section everywhere it is used, without changing mobile, search-bar syntax, people ordering, or rating/media option stability.

**Architecture:** Extend shared `FilterState` with `dateAfter` and `dateBefore`, make `buildFilterContext()` prefer custom dates over year/month, and wire the shared timeline UI so custom range and year/month are mutually exclusive. Keep route integrations on shared helper APIs, refactoring spaces and smart-search flows where they currently track/build only `selectedYear` and `selectedMonth`.

**Tech Stack:** Svelte 5, TypeScript, Vitest, @testing-library/svelte, SvelteKit route components, generated `@immich/sdk`

---

## File Structure

- Modify: `web/src/lib/components/filter-panel/filter-panel.ts`
  Responsibility: add custom temporal fields, UTC date conversion, active count, and clearing semantics.

- Modify: `web/src/lib/components/filter-panel/__tests__/filter-state.spec.ts`
  Responsibility: prove custom range context, open-ended ranges, priority over year/month, and clearing behavior.

- Modify: `web/src/lib/components/filter-panel/temporal-picker.svelte`
  Responsibility: render From/To controls above the existing year/month picker, validate local input, and emit custom range changes.

- Modify: `web/src/lib/components/filter-panel/__tests__/temporal-picker.spec.ts`
  Responsibility: prove custom range rendering, valid updates, malformed/impossible/inverted range suppression, invalid-field clearing, and year/month switching.

- Modify: `web/src/lib/components/filter-panel/filter-panel.svelte`
  Responsibility: track custom dates in temporal effects, pass custom props to `TemporalPicker`, clear the opposite temporal mode on selection, and mark the timeline section active for custom dates.

- Modify: `web/src/lib/components/filter-panel/__tests__/contextual-refetch.spec.ts`
  Responsibility: prove custom date changes refetch suggestions, pass custom context to dependent providers, narrow visible people/location/camera/tag options, and keep rating/media controls stable.

- Modify: `web/src/lib/components/filter-panel/active-filters-bar.svelte`
  Responsibility: show bounded/from-only/to-only temporal chip labels.

- Modify: `web/src/lib/components/filter-panel/__tests__/active-filters-bar.spec.ts`
  Responsibility: cover custom temporal chip labels and timeline chip removal.

- Modify: `web/src/lib/utils/photos-filter-options.ts`
  Responsibility: clear both custom dates and year/month when removing timeline filters.

- Modify: `web/src/lib/utils/__tests__/photos-filter-options.spec.ts`
  Responsibility: cover custom dates in photos timeline options and timeline removal.

- Modify: `web/src/lib/utils/album-filter-options.ts`
  Responsibility: continue using `buildFilterContext()` for custom dates; no logic split required.

- Modify: `web/src/lib/utils/__tests__/album-filter-options.spec.ts`
  Responsibility: cover custom dates for album timeline and asset picker options.

- Modify: `web/src/lib/utils/__tests__/album-filter-config.spec.ts`
  Responsibility: prove album suggestion requests send API-ready custom `takenAfter` and `takenBefore` values.

- Modify: `web/src/lib/utils/map-filter-options.ts`
  Responsibility: continue using `buildFilterContext()` for custom dates; no logic split required.

- Modify: `web/src/lib/utils/__tests__/map-filter-options.spec.ts`
  Responsibility: cover custom dates for marker and time-bucket options.

- Modify: `web/src/lib/utils/space-search.ts`
  Responsibility: use `buildFilterContext()` for smart-search temporal params.

- Modify: `web/src/lib/utils/__tests__/space-search.spec.ts`
  Responsibility: cover custom dates in smart-search params and preserve space-person mapping.

- Create: `web/src/lib/utils/space-filter-options.ts`
  Responsibility: build spaces timeline options with shared temporal context and remove active filter chips.

- Create: `web/src/lib/utils/__tests__/space-filter-options.spec.ts`
  Responsibility: cover spaces timeline custom dates, space-person mapping, and temporal removal.

- Modify: `web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte`
  Responsibility: use the tested spaces filter-options helper instead of route-local temporal construction and removal logic.

- Modify: `web/src/lib/components/search/smart-search-results.svelte`
  Responsibility: track `dateAfter` and `dateBefore` as reactive search dependencies.

- Modify: `web/src/lib/components/search/smart-search-results.spec.ts`
  Responsibility: prove smart-search results rerun and pass custom dates when custom date filters change.

## Task 1: Extend Shared Filter State

**Files:**

- Modify: `web/src/lib/components/filter-panel/__tests__/filter-state.spec.ts`
- Modify: `web/src/lib/components/filter-panel/filter-panel.ts`

- [ ] **Step 1: Add failing tests for custom temporal state**

Add these tests to `filter-state.spec.ts`:

```typescript
it('should create default state with custom dates undefined', () => {
  const state = createFilterState();
  expect(state.dateAfter).toBeUndefined();
  expect(state.dateBefore).toBeUndefined();
});

it('should count custom date range as one active temporal filter', () => {
  const state = createFilterState();
  state.dateAfter = '2024-01-01';
  expect(getActiveFilterCount(state)).toBe(1);

  state.dateBefore = '2024-12-31';
  expect(getActiveFilterCount(state)).toBe(1);

  state.personIds = ['p1'];
  expect(getActiveFilterCount(state)).toBe(2);
});

it('should build bounded custom date context with exclusive end date', () => {
  const state = createFilterState();
  state.dateAfter = '2024-01-01';
  state.dateBefore = '2024-12-31';
  expect(buildFilterContext(state)).toEqual({
    takenAfter: '2024-01-01T00:00:00.000Z',
    takenBefore: '2025-01-01T00:00:00.000Z',
  });
});

it('should build from-only custom date context', () => {
  const state = createFilterState();
  state.dateAfter = '2024-01-01';
  expect(buildFilterContext(state)).toEqual({
    takenAfter: '2024-01-01T00:00:00.000Z',
  });
});

it('should build to-only custom date context with exclusive end date', () => {
  const state = createFilterState();
  state.dateBefore = '2024-12-31';
  expect(buildFilterContext(state)).toEqual({
    takenBefore: '2025-01-01T00:00:00.000Z',
  });
});

it('should prefer custom date context over year and month context', () => {
  const state = createFilterState();
  state.selectedYear = 2023;
  state.selectedMonth = 8;
  state.dateAfter = '2024-01-01';
  expect(buildFilterContext(state)).toEqual({
    takenAfter: '2024-01-01T00:00:00.000Z',
  });
});

it('should clear custom dates on clearFilters', () => {
  const state = createFilterState();
  state.dateAfter = '2024-01-01';
  state.dateBefore = '2024-12-31';
  state.selectedYear = 2023;
  state.selectedMonth = 8;

  const cleared = clearFilters(state);
  expect(cleared.dateAfter).toBeUndefined();
  expect(cleared.dateBefore).toBeUndefined();
  expect(cleared.selectedYear).toBeUndefined();
  expect(cleared.selectedMonth).toBeUndefined();
});
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/components/filter-panel/__tests__/filter-state.spec.ts
```

Expected: failures for missing `dateAfter` / `dateBefore` properties and missing custom context behavior.

- [ ] **Step 3: Implement custom date fields and context conversion**

Update `filter-panel.ts`:

```typescript
export interface FilterState {
  personIds: string[];
  city?: string;
  country?: string;
  make?: string;
  model?: string;
  tagIds: string[];
  rating?: number;
  mediaType: 'all' | 'image' | 'video';
  isFavorite?: boolean;
  sortOrder: 'asc' | 'desc' | 'relevance';
  dateAfter?: string;
  dateBefore?: string;
  selectedYear?: number;
  selectedMonth?: number;
}
```

Add helpers in the same file:

```typescript
function dateOnlyToUtcStart(value: string): string {
  return new Date(`${value}T00:00:00.000Z`).toISOString();
}

function dateOnlyToExclusiveUtcEnd(value: string): string {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString();
}
```

Update `getActiveFilterCount()` temporal count:

```typescript
const hasTemporalFilter =
  state.dateAfter !== undefined || state.dateBefore !== undefined || state.selectedYear !== undefined;
```

Use `hasTemporalFilter ? 1 : 0` instead of the existing `selectedYear` count.

Update `buildFilterContext()`:

```typescript
export function buildFilterContext(state: FilterState): FilterContext | undefined {
  if (state.dateAfter || state.dateBefore) {
    return {
      ...(state.dateAfter ? { takenAfter: dateOnlyToUtcStart(state.dateAfter) } : {}),
      ...(state.dateBefore ? { takenBefore: dateOnlyToExclusiveUtcEnd(state.dateBefore) } : {}),
    };
  }
  if (!state.selectedYear) {
    return undefined;
  }
  if (state.selectedMonth) {
    return {
      takenAfter: new Date(Date.UTC(state.selectedYear, state.selectedMonth - 1, 1)).toISOString(),
      takenBefore: new Date(Date.UTC(state.selectedYear, state.selectedMonth, 1)).toISOString(),
    };
  }
  return {
    takenAfter: new Date(Date.UTC(state.selectedYear, 0, 1)).toISOString(),
    takenBefore: new Date(Date.UTC(state.selectedYear + 1, 0, 1)).toISOString(),
  };
}
```

Update `clearFilters()` to set `dateAfter: undefined` and `dateBefore: undefined`.

- [ ] **Step 4: Run tests and commit**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/components/filter-panel/__tests__/filter-state.spec.ts
```

Expected: all tests in `filter-state.spec.ts` pass.

Commit:

```bash
git add web/src/lib/components/filter-panel/filter-panel.ts web/src/lib/components/filter-panel/__tests__/filter-state.spec.ts
git commit -m "feat(web): add custom temporal filter state"
```

## Task 2: Add Custom Range UI To Temporal Picker

**Files:**

- Modify: `web/src/lib/components/filter-panel/__tests__/temporal-picker.spec.ts`
- Modify: `web/src/lib/components/filter-panel/temporal-picker.svelte`

- [ ] **Step 1: Add failing UI tests**

Add tests to `temporal-picker.spec.ts`:

```typescript
it('should render custom range inputs above year grid', () => {
  const { getByTestId } = render(TemporalPicker, {
    props: { timeBuckets: buckets },
  });
  expect(getByTestId('custom-date-range')).toBeTruthy();
  expect(getByTestId('custom-date-from')).toBeTruthy();
  expect(getByTestId('custom-date-to')).toBeTruthy();
  expect(getByTestId('year-grid')).toBeTruthy();
});

it('should emit from-only custom range', async () => {
  const spy = vi.fn();
  const { getByTestId } = render(TemporalPicker, {
    props: { timeBuckets: buckets, onCustomRangeChange: spy },
  });
  await fireEvent.input(getByTestId('custom-date-from'), { target: { value: '2024-01-01' } });
  expect(spy).toHaveBeenCalledWith('2024-01-01', undefined);
});

it('should emit to-only custom range', async () => {
  const spy = vi.fn();
  const { getByTestId } = render(TemporalPicker, {
    props: { timeBuckets: buckets, onCustomRangeChange: spy },
  });
  await fireEvent.input(getByTestId('custom-date-to'), { target: { value: '2024-12-31' } });
  expect(spy).toHaveBeenCalledWith(undefined, '2024-12-31');
});

it('should show custom date values from props', () => {
  const { getByTestId } = render(TemporalPicker, {
    props: { timeBuckets: buckets, dateAfter: '2024-01-01', dateBefore: '2024-12-31' },
  });
  expect((getByTestId('custom-date-from') as HTMLInputElement).value).toBe('2024-01-01');
  expect((getByTestId('custom-date-to') as HTMLInputElement).value).toBe('2024-12-31');
});

it('should not emit inverted custom ranges', async () => {
  const spy = vi.fn();
  const { getByTestId } = render(TemporalPicker, {
    props: { timeBuckets: buckets, dateAfter: '2024-12-31', onCustomRangeChange: spy },
  });
  await fireEvent.input(getByTestId('custom-date-to'), { target: { value: '2024-01-01' } });
  expect(spy).not.toHaveBeenCalled();
  expect(getByTestId('custom-date-error').textContent).toContain('From date must be on or before To date');
});

it('should not emit malformed custom dates', async () => {
  const spy = vi.fn();
  const { getByTestId } = render(TemporalPicker, {
    props: { timeBuckets: buckets, onCustomRangeChange: spy },
  });
  await fireEvent.input(getByTestId('custom-date-from'), { target: { value: '2024-1-1' } });
  expect(spy).not.toHaveBeenCalled();
  expect(getByTestId('custom-date-error').textContent).toContain('Enter a valid From date');
});

it('should not emit impossible custom dates', async () => {
  const spy = vi.fn();
  const { getByTestId } = render(TemporalPicker, {
    props: { timeBuckets: buckets, onCustomRangeChange: spy },
  });
  await fireEvent.input(getByTestId('custom-date-to'), { target: { value: '2024-02-31' } });
  expect(spy).not.toHaveBeenCalled();
  expect(getByTestId('custom-date-error').textContent).toContain('Enter a valid To date');
});

it('should emit remaining open-ended range after clearing an invalid field', async () => {
  const spy = vi.fn();
  const { getByTestId } = render(TemporalPicker, {
    props: { timeBuckets: buckets, dateAfter: '2024-01-01', onCustomRangeChange: spy },
  });
  await fireEvent.input(getByTestId('custom-date-to'), { target: { value: '2024-02-31' } });
  expect(spy).not.toHaveBeenCalled();

  await fireEvent.input(getByTestId('custom-date-to'), { target: { value: '' } });
  expect(spy).toHaveBeenCalledWith('2024-01-01', undefined);
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/components/filter-panel/__tests__/temporal-picker.spec.ts
```

Expected: missing custom date inputs and missing callback props.

- [ ] **Step 3: Implement the custom date inputs**

Update `temporal-picker.svelte` props:

```typescript
interface Props {
  timeBuckets: Array<{ timeBucket: string; count: number }>;
  selectedYear?: number;
  selectedMonth?: number;
  dateAfter?: string;
  dateBefore?: string;
  onYearSelect?: (year: number | undefined) => void;
  onMonthSelect?: (year: number, month: number | undefined) => void;
  onCustomRangeChange?: (dateAfter: string | undefined, dateBefore: string | undefined) => void;
}
```

Add local state and validation:

```typescript
let {
  timeBuckets,
  selectedYear,
  selectedMonth,
  dateAfter,
  dateBefore,
  onYearSelect,
  onMonthSelect,
  onCustomRangeChange,
}: Props = $props();

let localDateAfter = $state(dateAfter ?? '');
let localDateBefore = $state(dateBefore ?? '');
let customDateError = $state('');

$effect(() => {
  localDateAfter = dateAfter ?? '';
  localDateBefore = dateBefore ?? '';
});

function isValidDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function emitCustomRange(nextAfter: string, nextBefore: string) {
  customDateError = '';
  if (nextAfter && !isValidDateOnly(nextAfter)) {
    customDateError = 'Enter a valid From date';
    return;
  }
  if (nextBefore && !isValidDateOnly(nextBefore)) {
    customDateError = 'Enter a valid To date';
    return;
  }
  if (nextAfter && nextBefore && nextAfter > nextBefore) {
    customDateError = 'From date must be on or before To date';
    return;
  }
  onCustomRangeChange?.(nextAfter || undefined, nextBefore || undefined);
}
```

Render the custom range before the selected-year branch:

```svelte
<div class="mb-3 space-y-1" data-testid="custom-date-range">
  <div class="grid grid-cols-2 gap-2">
    <label class="flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-300">
      <span>From</span>
      <input
        type="text"
        inputmode="numeric"
        autocomplete="off"
        placeholder="YYYY-MM-DD"
        pattern="\d{4}-\d{2}-\d{2}"
        bind:value={localDateAfter}
        data-testid="custom-date-from"
        class="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
        oninput={() => emitCustomRange(localDateAfter, localDateBefore)}
      />
    </label>
    <label class="flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-300">
      <span>To</span>
      <input
        type="text"
        inputmode="numeric"
        autocomplete="off"
        placeholder="YYYY-MM-DD"
        pattern="\d{4}-\d{2}-\d{2}"
        bind:value={localDateBefore}
        data-testid="custom-date-to"
        class="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
        oninput={() => emitCustomRange(localDateAfter, localDateBefore)}
      />
    </label>
  </div>
  {#if customDateError}
    <p class="text-xs text-red-600 dark:text-red-400" data-testid="custom-date-error">{customDateError}</p>
  {/if}
</div>
```

- [ ] **Step 4: Run tests and commit**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/components/filter-panel/__tests__/temporal-picker.spec.ts
```

Expected: temporal picker tests pass.

Commit:

```bash
git add web/src/lib/components/filter-panel/temporal-picker.svelte web/src/lib/components/filter-panel/__tests__/temporal-picker.spec.ts
git commit -m "feat(web): add custom date range picker"
```

## Task 3: Wire FilterPanel Temporal Reactivity

**Files:**

- Modify: `web/src/lib/components/filter-panel/filter-panel.svelte`
- Modify: `web/src/lib/components/filter-panel/__tests__/contextual-refetch.spec.ts`

- [ ] **Step 1: Add failing contextual refetch tests**

Add tests to `contextual-refetch.spec.ts`:

```typescript
it('should re-fetch unified suggestions when custom from date changes', async () => {
  const suggestionsProvider = vi
    .fn()
    .mockResolvedValueOnce({
      countries: ['Germany', 'France'],
      cameraMakes: ['Canon', 'Sony'],
      tags: [
        { id: 't1', name: 'Vacation' },
        { id: 't2', name: 'Family' },
      ],
      people: [
        { id: 'p1', name: 'Alice' },
        { id: 'p2', name: 'Bob' },
      ],
      ratings: [1, 2, 3, 4, 5],
      mediaTypes: ['IMAGE', 'VIDEO'],
      hasUnnamedPeople: false,
    })
    .mockResolvedValueOnce({
      countries: ['Germany'],
      cameraMakes: ['Canon'],
      tags: [{ id: 't1', name: 'Vacation' }],
      people: [{ id: 'p1', name: 'Alice' }],
      ratings: [1],
      mediaTypes: ['IMAGE'],
      hasUnnamedPeople: false,
    });

  const config: FilterPanelConfig = {
    sections: ['timeline', 'people', 'location', 'camera', 'tags', 'rating', 'media'],
    suggestionsProvider,
  };

  render(FilterPanel, { props: { config, timeBuckets } });
  await vi.advanceTimersByTimeAsync(0);

  await fireEvent.input(screen.getByTestId('custom-date-from'), { target: { value: '2024-01-01' } });
  await vi.advanceTimersByTimeAsync(250);

  await waitFor(() => {
    expect(suggestionsProvider).toHaveBeenCalledTimes(2);
    expect(suggestionsProvider).toHaveBeenLastCalledWith(
      expect.objectContaining({ dateAfter: '2024-01-01', selectedYear: undefined, selectedMonth: undefined }),
    );
    expect(screen.getByTestId('people-item-p1')).toBeTruthy();
    expect(screen.queryByTestId('people-item-p2')).toBeNull();
    expect(screen.getByTestId('tags-item-t1')).toBeTruthy();
    expect(screen.queryByTestId('tags-item-t2')).toBeNull();
  });
});

it('should clear selected year when custom from date changes', async () => {
  const suggestionsProvider = vi.fn().mockResolvedValue({
    countries: [],
    cameraMakes: [],
    tags: [],
    people: [],
    ratings: [1, 2, 3, 4, 5],
    mediaTypes: ['IMAGE', 'VIDEO'],
    hasUnnamedPeople: false,
  });

  render(FilterPanel, {
    props: { config: { sections: ['timeline'], suggestionsProvider }, timeBuckets },
  });
  await vi.advanceTimersByTimeAsync(0);

  await fireEvent.click(screen.getByTestId('year-btn-2023'));
  await vi.advanceTimersByTimeAsync(250);
  await fireEvent.input(screen.getByTestId('custom-date-from'), { target: { value: '2024-01-01' } });
  await vi.advanceTimersByTimeAsync(250);

  expect(suggestionsProvider).toHaveBeenLastCalledWith(
    expect.objectContaining({ dateAfter: '2024-01-01', selectedYear: undefined, selectedMonth: undefined }),
  );
});

it('should clear selected year and month when custom to date changes', async () => {
  const suggestionsProvider = vi.fn().mockResolvedValue({
    countries: [],
    cameraMakes: [],
    tags: [],
    people: [],
    ratings: [1, 2, 3, 4, 5],
    mediaTypes: ['IMAGE', 'VIDEO'],
    hasUnnamedPeople: false,
  });

  render(FilterPanel, {
    props: { config: { sections: ['timeline'], suggestionsProvider }, timeBuckets },
  });
  await vi.advanceTimersByTimeAsync(0);

  await fireEvent.click(screen.getByTestId('year-btn-2023'));
  await vi.advanceTimersByTimeAsync(250);
  await fireEvent.click(screen.getByTestId('month-btn-6'));
  await vi.advanceTimersByTimeAsync(250);
  await fireEvent.input(screen.getByTestId('custom-date-to'), { target: { value: '2024-12-31' } });
  await vi.advanceTimersByTimeAsync(250);

  expect(suggestionsProvider).toHaveBeenLastCalledWith(
    expect.objectContaining({ dateBefore: '2024-12-31', selectedYear: undefined, selectedMonth: undefined }),
  );
});

it('should clear custom dates when year is selected', async () => {
  const suggestionsProvider = vi.fn().mockResolvedValue({
    countries: [],
    cameraMakes: [],
    tags: [],
    people: [],
    ratings: [1, 2, 3, 4, 5],
    mediaTypes: ['IMAGE', 'VIDEO'],
    hasUnnamedPeople: false,
  });

  render(FilterPanel, {
    props: { config: { sections: ['timeline'], suggestionsProvider }, timeBuckets },
  });
  await vi.advanceTimersByTimeAsync(0);

  await fireEvent.input(screen.getByTestId('custom-date-from'), { target: { value: '2024-01-01' } });
  await vi.advanceTimersByTimeAsync(250);
  await fireEvent.click(screen.getByTestId('year-btn-2023'));
  await vi.advanceTimersByTimeAsync(250);

  expect(suggestionsProvider).toHaveBeenLastCalledWith(
    expect.objectContaining({
      dateAfter: undefined,
      dateBefore: undefined,
      selectedYear: 2023,
      selectedMonth: undefined,
    }),
  );
});

it('should clear custom dates when month is selected', async () => {
  const suggestionsProvider = vi.fn().mockResolvedValue({
    countries: [],
    cameraMakes: [],
    tags: [],
    people: [],
    ratings: [1, 2, 3, 4, 5],
    mediaTypes: ['IMAGE', 'VIDEO'],
    hasUnnamedPeople: false,
  });

  render(FilterPanel, {
    props: { config: { sections: ['timeline'], suggestionsProvider }, timeBuckets },
  });
  await vi.advanceTimersByTimeAsync(0);

  await fireEvent.input(screen.getByTestId('custom-date-from'), { target: { value: '2024-01-01' } });
  await vi.advanceTimersByTimeAsync(250);
  await fireEvent.click(screen.getByTestId('year-btn-2023'));
  await vi.advanceTimersByTimeAsync(250);
  await fireEvent.click(screen.getByTestId('month-btn-6'));
  await vi.advanceTimersByTimeAsync(250);

  expect(suggestionsProvider).toHaveBeenLastCalledWith(
    expect.objectContaining({ dateAfter: undefined, dateBefore: undefined, selectedYear: 2023, selectedMonth: 6 }),
  );
});

it('should pass custom date context to dependent city and camera providers', async () => {
  const config = createConfig({
    cities: vi.fn().mockResolvedValue(['Berlin']),
    cameraModels: vi.fn().mockResolvedValue(['EOS R5']),
  });
  render(FilterPanel, { props: { config, timeBuckets } });
  await vi.advanceTimersByTimeAsync(0);

  await fireEvent.input(screen.getByTestId('custom-date-from'), { target: { value: '2024-01-01' } });
  await vi.advanceTimersByTimeAsync(250);

  await fireEvent.click(screen.getByTestId('location-country-Germany'));
  await vi.advanceTimersByTimeAsync(0);
  expect(config.providers!.cities).toHaveBeenLastCalledWith('Germany', {
    takenAfter: '2024-01-01T00:00:00.000Z',
  });

  await fireEvent.click(screen.getByTestId('camera-make-Canon'));
  await vi.advanceTimersByTimeAsync(0);
  expect(config.providers!.cameraModels).toHaveBeenLastCalledWith('Canon', {
    takenAfter: '2024-01-01T00:00:00.000Z',
  });
});

it('should keep rating and media controls stable when custom date changes', async () => {
  const suggestionsProvider = vi
    .fn()
    .mockResolvedValueOnce({
      countries: [],
      cameraMakes: [],
      tags: [],
      people: [],
      ratings: [1, 2, 3, 4, 5],
      mediaTypes: ['IMAGE', 'VIDEO'],
      hasUnnamedPeople: false,
    })
    .mockResolvedValueOnce({
      countries: [],
      cameraMakes: [],
      tags: [],
      people: [],
      ratings: [5],
      mediaTypes: ['IMAGE'],
      hasUnnamedPeople: false,
    });

  render(FilterPanel, {
    props: {
      config: { sections: ['timeline', 'rating', 'media'], suggestionsProvider },
      timeBuckets,
    },
  });
  await vi.advanceTimersByTimeAsync(0);
  await fireEvent.input(screen.getByTestId('custom-date-from'), { target: { value: '2024-01-01' } });
  await vi.advanceTimersByTimeAsync(250);

  expect(screen.getByTestId('rating-star-1')).toBeTruthy();
  expect(screen.getByTestId('media-type-image')).toBeTruthy();
  expect(screen.getByTestId('media-type-video')).toBeTruthy();
});
```

- [ ] **Step 2: Run contextual tests and verify failure**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/components/filter-panel/__tests__/contextual-refetch.spec.ts
```

Expected: custom date inputs are not wired through `FilterPanel`, and custom date context is not tracked.

- [ ] **Step 3: Update FilterPanel tracking and handlers**

In `filter-panel.svelte`, update the stable `filterContext` effect to track custom dates:

```typescript
$effect(() => {
  const dateAfter = filters.dateAfter;
  const dateBefore = filters.dateBefore;
  const year = filters.selectedYear;
  const month = filters.selectedMonth;
  const next = buildFilterContext({ dateAfter, dateBefore, selectedYear: year, selectedMonth: month } as FilterState);
  if (filterContext?.takenAfter !== next?.takenAfter || filterContext?.takenBefore !== next?.takenBefore) {
    filterContext = next;
  }
});
```

Update the unified suggestions current snapshot:

```typescript
const current: FilterState = {
  personIds: filters.personIds,
  city: filters.city,
  country: filters.country,
  make: filters.make,
  model: filters.model,
  tagIds: filters.tagIds,
  rating: filters.rating,
  mediaType: filters.mediaType,
  isFavorite: filters.isFavorite,
  sortOrder: filters.sortOrder,
  dateAfter: filters.dateAfter,
  dateBefore: filters.dateBefore,
  selectedYear: filters.selectedYear,
  selectedMonth: filters.selectedMonth,
};
```

Update temporal change detection:

```typescript
const temporalChanged =
  !isInitialMount &&
  (prev.dateAfter !== current.dateAfter ||
    prev.dateBefore !== current.dateBefore ||
    prev.selectedYear !== current.selectedYear ||
    prev.selectedMonth !== current.selectedMonth);
const isTemporalClear =
  temporalChanged &&
  current.dateAfter === undefined &&
  current.dateBefore === undefined &&
  current.selectedYear === undefined;
```

Update the provider-less temporal effect to track custom dates in the same context snapshot:

```typescript
const dateAfter = filters.dateAfter;
const dateBefore = filters.dateBefore;
const year = filters.selectedYear;
const month = filters.selectedMonth;
const currentContext = buildFilterContext({
  dateAfter,
  dateBefore,
  selectedYear: year,
  selectedMonth: month,
} as FilterState);
```

Add the custom range handler:

```typescript
function handleCustomDateRangeChange(dateAfter: string | undefined, dateBefore: string | undefined) {
  filters = { ...filters, dateAfter, dateBefore, selectedYear: undefined, selectedMonth: undefined };
}
```

Update existing handlers:

```typescript
function handleYearSelect(year: number | undefined) {
  filters = { ...filters, dateAfter: undefined, dateBefore: undefined, selectedYear: year, selectedMonth: undefined };
}

function handleMonthSelect(year: number, month: number | undefined) {
  filters = { ...filters, dateAfter: undefined, dateBefore: undefined, selectedYear: year, selectedMonth: month };
}
```

Update `hasActiveFilter('timeline')`:

```typescript
return filters.dateAfter !== undefined || filters.dateBefore !== undefined || filters.selectedYear !== undefined;
```

Pass custom props to `TemporalPicker`:

```svelte
<TemporalPicker
  {timeBuckets}
  dateAfter={filters.dateAfter}
  dateBefore={filters.dateBefore}
  selectedYear={filters.selectedYear}
  selectedMonth={filters.selectedMonth}
  onCustomRangeChange={handleCustomDateRangeChange}
  onYearSelect={handleYearSelect}
  onMonthSelect={handleMonthSelect}
/>
```

- [ ] **Step 4: Run contextual tests and commit**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/components/filter-panel/__tests__/contextual-refetch.spec.ts
```

Expected: contextual refetch tests pass.

Commit:

```bash
git add web/src/lib/components/filter-panel/filter-panel.svelte web/src/lib/components/filter-panel/__tests__/contextual-refetch.spec.ts
git commit -m "feat(web): refetch filters for custom date ranges"
```

## Task 4: Add Custom Date Active Chips And Removal

**Files:**

- Modify: `web/src/lib/components/filter-panel/active-filters-bar.svelte`
- Modify: `web/src/lib/components/filter-panel/__tests__/active-filters-bar.spec.ts`
- Modify: `web/src/lib/utils/photos-filter-options.ts`
- Modify: `web/src/lib/utils/__tests__/photos-filter-options.spec.ts`

- [ ] **Step 1: Add failing active chip and removal tests**

Add tests to `web/src/lib/components/filter-panel/__tests__/active-filters-bar.spec.ts`:

```typescript
it('should render bounded custom date range chip', () => {
  const filters = createFilterState();
  filters.dateAfter = '2024-01-01';
  filters.dateBefore = '2024-12-31';

  const { getAllByTestId } = render(ActiveFiltersBar, {
    props: { filters, onRemoveFilter: () => {}, onClearAll: () => {} },
  });

  expect(getAllByTestId('active-chip')[0].textContent).toContain('Jan 1, 2024 - Dec 31, 2024');
});

it('should render from-only custom date chip', () => {
  const filters = createFilterState();
  filters.dateAfter = '2024-01-01';

  const { getAllByTestId } = render(ActiveFiltersBar, {
    props: { filters, onRemoveFilter: () => {}, onClearAll: () => {} },
  });

  expect(getAllByTestId('active-chip')[0].textContent).toContain('After Jan 1, 2024');
});

it('should render to-only custom date chip', () => {
  const filters = createFilterState();
  filters.dateBefore = '2024-12-31';

  const { getAllByTestId } = render(ActiveFiltersBar, {
    props: { filters, onRemoveFilter: () => {}, onClearAll: () => {} },
  });

  expect(getAllByTestId('active-chip')[0].textContent).toContain('Before Dec 31, 2024');
});
```

Add tests to `photos-filter-options.spec.ts`:

```typescript
it('should clear custom dates when removing timeline filter', () => {
  const filters = { ...createFilterState(), dateAfter: '2024-01-01', dateBefore: '2024-12-31' };
  const result = handlePhotosRemoveFilter(filters, 'timeline');
  expect(result.dateAfter).toBeUndefined();
  expect(result.dateBefore).toBeUndefined();
});

it('should include custom dates in photos timeline options', () => {
  const filters = { ...createFilterState(), dateAfter: '2024-01-01', dateBefore: '2024-12-31' };
  const options = buildPhotosTimelineOptions(filters);
  expect(options.takenAfter).toBe('2024-01-01T00:00:00.000Z');
  expect(options.takenBefore).toBe('2025-01-01T00:00:00.000Z');
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/components/filter-panel/__tests__/active-filters-bar.spec.ts src/lib/utils/__tests__/photos-filter-options.spec.ts
```

Expected: custom date chips and removal behavior are missing.

- [ ] **Step 3: Implement chip labels and timeline removal**

In `active-filters-bar.svelte`, add date formatting:

```typescript
function formatDateOnly(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00.000Z`));
}
```

Add custom chip logic before the year/month branch:

```typescript
if (filters.dateAfter || filters.dateBefore) {
  if (filters.dateAfter && filters.dateBefore) {
    result.push({
      type: 'timeline',
      label: `${formatDateOnly(filters.dateAfter)} - ${formatDateOnly(filters.dateBefore)}`,
    });
  } else if (filters.dateAfter) {
    result.push({ type: 'timeline', label: `After ${formatDateOnly(filters.dateAfter)}` });
  } else if (filters.dateBefore) {
    result.push({ type: 'timeline', label: `Before ${formatDateOnly(filters.dateBefore)}` });
  }
} else if (filters.selectedYear !== undefined) {
  const label =
    filters.selectedMonth === undefined
      ? `${filters.selectedYear}`
      : `${MONTH_LABELS[filters.selectedMonth - 1]} ${filters.selectedYear}`;
  result.push({ type: 'timeline', label });
}
```

In `photos-filter-options.ts`, update timeline removal:

```typescript
case 'timeline': {
  return {
    ...filters,
    dateAfter: undefined,
    dateBefore: undefined,
    selectedYear: undefined,
    selectedMonth: undefined,
  };
}
```

- [ ] **Step 4: Run tests and commit**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/components/filter-panel/__tests__/active-filters-bar.spec.ts src/lib/utils/__tests__/photos-filter-options.spec.ts
```

Expected: active chip and photos option tests pass.

Commit:

```bash
git add web/src/lib/components/filter-panel/active-filters-bar.svelte web/src/lib/components/filter-panel/__tests__/active-filters-bar.spec.ts web/src/lib/utils/photos-filter-options.ts web/src/lib/utils/__tests__/photos-filter-options.spec.ts
git commit -m "feat(web): show custom date filter chips"
```

## Task 5: Wire Route And Search Option Helpers

**Files:**

- Modify: `web/src/lib/utils/__tests__/album-filter-options.spec.ts`
- Modify: `web/src/lib/utils/__tests__/album-filter-config.spec.ts`
- Modify: `web/src/lib/utils/__tests__/map-filter-options.spec.ts`
- Create: `web/src/lib/utils/__tests__/space-filter-options.spec.ts`
- Create: `web/src/lib/utils/space-filter-options.ts`
- Modify: `web/src/lib/utils/__tests__/space-search.spec.ts`
- Modify: `web/src/lib/utils/space-search.ts`
- Modify: `web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte`
- Modify: `web/src/lib/components/search/smart-search-results.spec.ts`
- Modify: `web/src/lib/components/search/smart-search-results.svelte`

- [ ] **Step 1: Add failing route option tests**

Add to `album-filter-options.spec.ts`:

```typescript
it('maps custom dates for album timeline options', () => {
  const filters = { ...createFilterState(), dateAfter: '2024-01-01', dateBefore: '2024-12-31' };
  expect(buildAlbumTimelineOptions('album-1', AssetOrder.Desc, filters)).toEqual(
    expect.objectContaining({
      takenAfter: '2024-01-01T00:00:00.000Z',
      takenBefore: '2025-01-01T00:00:00.000Z',
    }),
  );
});

it('maps custom dates for album asset picker options', () => {
  const filters = { ...createFilterState(), dateAfter: '2024-01-01' };
  expect(buildAlbumAssetPickerOptions('album-1', filters)).toEqual(
    expect.objectContaining({ takenAfter: '2024-01-01T00:00:00.000Z' }),
  );
});
```

Add to `map-filter-options.spec.ts`:

```typescript
it('includes custom dates in map marker options', () => {
  const filters = { ...createFilterState(), dateAfter: '2024-01-01', dateBefore: '2024-12-31' };
  expect(buildMapMarkerOptions(filters)).toEqual(
    expect.objectContaining({
      takenAfter: '2024-01-01T00:00:00.000Z',
      takenBefore: '2025-01-01T00:00:00.000Z',
    }),
  );
});

it('includes custom dates in map time bucket options', () => {
  const filters = { ...createFilterState(), dateBefore: '2024-12-31' };
  expect(buildMapTimeBucketOptions(filters)).toEqual(
    expect.objectContaining({ takenBefore: '2025-01-01T00:00:00.000Z' }),
  );
});
```

Create `space-filter-options.spec.ts`:

```typescript
import { createFilterState } from '$lib/components/filter-panel/filter-panel';
import { buildSpaceTimelineOptions, handleSpaceRemoveFilter } from '$lib/utils/space-filter-options';
import { AssetOrder, AssetTypeEnum } from '@immich/sdk';

describe('buildSpaceTimelineOptions', () => {
  it('maps custom dates and people for spaces timeline options', () => {
    const filters = {
      ...createFilterState(),
      personIds: ['space-person-1'],
      dateAfter: '2024-01-01',
      dateBefore: '2024-12-31',
    };

    expect(buildSpaceTimelineOptions('space-1', filters)).toEqual(
      expect.objectContaining({
        spaceId: 'space-1',
        withStacked: true,
        spacePersonIds: ['space-person-1'],
        takenAfter: '2024-01-01T00:00:00.000Z',
        takenBefore: '2025-01-01T00:00:00.000Z',
      }),
    );
  });

  it('prefers custom dates over selected year and month', () => {
    const filters = {
      ...createFilterState(),
      selectedYear: 2023,
      selectedMonth: 8,
      dateBefore: '2024-12-31',
    };

    const result = buildSpaceTimelineOptions('space-1', filters);
    expect(result.takenAfter).toBeUndefined();
    expect(result.takenBefore).toBe('2025-01-01T00:00:00.000Z');
  });

  it('maps media type and sort order for spaces timeline options', () => {
    const filters = { ...createFilterState(), mediaType: 'video' as const, sortOrder: 'asc' as const };

    expect(buildSpaceTimelineOptions('space-1', filters)).toEqual(
      expect.objectContaining({
        $type: AssetTypeEnum.Video,
        order: AssetOrder.Asc,
      }),
    );
  });
});

describe('handleSpaceRemoveFilter', () => {
  it('clears both temporal modes when removing timeline filter', () => {
    const filters = {
      ...createFilterState(),
      dateAfter: '2024-01-01',
      dateBefore: '2024-12-31',
      selectedYear: 2023,
      selectedMonth: 8,
    };

    const result = handleSpaceRemoveFilter(filters, 'timeline');
    expect(result.dateAfter).toBeUndefined();
    expect(result.dateBefore).toBeUndefined();
    expect(result.selectedYear).toBeUndefined();
    expect(result.selectedMonth).toBeUndefined();
  });
});
```

- [ ] **Step 2: Add failing suggestion DTO and smart-search tests**

Add to `album-filter-config.spec.ts`:

```typescript
it('passes custom dates to album detail filter suggestions', async () => {
  const config = buildAlbumDetailFilterConfig('album-1');
  await config.suggestionsProvider!({
    ...createFilterState(),
    dateAfter: '2024-01-01',
    dateBefore: '2024-12-31',
  });

  expect(getFilterSuggestions).toHaveBeenCalledWith(
    expect.objectContaining({
      albumId: 'album-1',
      takenAfter: '2024-01-01T00:00:00.000Z',
      takenBefore: '2025-01-01T00:00:00.000Z',
    }),
  );
});

it('passes custom dates to album asset picker filter suggestions', async () => {
  const config = buildAlbumAssetPickerFilterConfig();
  await config.suggestionsProvider!({
    ...createFilterState(),
    dateBefore: '2024-12-31',
  });

  expect(getFilterSuggestions).toHaveBeenCalledWith(
    expect.objectContaining({
      takenBefore: '2025-01-01T00:00:00.000Z',
    }),
  );
});
```

Add to `space-search.spec.ts`:

```typescript
it('builds takenAfter/takenBefore from custom dates', () => {
  const result = buildSmartSearchParams({
    query: 'beach',
    filters: { ...baseFilters, dateAfter: '2024-01-01', dateBefore: '2024-12-31' },
  });
  expect(result.takenAfter).toBe('2024-01-01T00:00:00.000Z');
  expect(result.takenBefore).toBe('2025-01-01T00:00:00.000Z');
});

it('prefers custom dates over selected year and month', () => {
  const result = buildSmartSearchParams({
    query: 'beach',
    filters: { ...baseFilters, selectedYear: 2023, selectedMonth: 8, dateAfter: '2024-01-01' },
  });
  expect(result.takenAfter).toBe('2024-01-01T00:00:00.000Z');
  expect(result.takenBefore).toBeUndefined();
});
```

Add to `smart-search-results.spec.ts`:

```typescript
it('triggers re-fetch when custom date range changes', async () => {
  const { rerender } = render(SmartSearchResults, { props: baseProps });
  await vi.advanceTimersByTimeAsync(SEARCH_FILTER_DEBOUNCE_MS);
  expect(searchSmartMock).toHaveBeenCalledTimes(1);

  await rerender({ ...baseProps, filters: { ...baseFilters, dateAfter: '2024-01-01' } });
  await vi.advanceTimersByTimeAsync(SEARCH_FILTER_DEBOUNCE_MS);

  expect(searchSmartMock).toHaveBeenCalledTimes(2);
  expect(searchSmartMock).toHaveBeenLastCalledWith(
    expect.objectContaining({
      smartSearchDto: expect.objectContaining({ takenAfter: '2024-01-01T00:00:00.000Z' }),
    }),
  );
});
```

- [ ] **Step 3: Run route/search tests and verify failure**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/utils/__tests__/album-filter-options.spec.ts src/lib/utils/__tests__/album-filter-config.spec.ts src/lib/utils/__tests__/map-filter-options.spec.ts src/lib/utils/__tests__/space-filter-options.spec.ts src/lib/utils/__tests__/space-search.spec.ts src/lib/components/search/smart-search-results.spec.ts
```

Expected: the new spaces helper test fails because the helper does not exist; space search and smart-search result reactivity fail until custom fields are wired. Album/map may pass after Task 1 because they already consume `buildFilterContext()`.

- [ ] **Step 4: Create tested spaces timeline helper**

Create `space-filter-options.ts`:

```typescript
import { buildFilterContext, type FilterState } from '$lib/components/filter-panel/filter-panel';
import { AssetOrder, AssetTypeEnum } from '@immich/sdk';

export function buildSpaceTimelineOptions(spaceId: string, filters: FilterState): Record<string, unknown> {
  const base: Record<string, unknown> = { spaceId, withStacked: true };
  if (filters.personIds.length > 0) {
    base.spacePersonIds = filters.personIds;
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

  const context = buildFilterContext(filters);
  if (context?.takenAfter) {
    base.takenAfter = context.takenAfter;
  }
  if (context?.takenBefore) {
    base.takenBefore = context.takenBefore;
  }

  return base;
}

export function handleSpaceRemoveFilter(filters: FilterState, type: string, id?: string): FilterState {
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
    case 'timeline': {
      return {
        ...filters,
        dateAfter: undefined,
        dateBefore: undefined,
        selectedYear: undefined,
        selectedMonth: undefined,
      };
    }
    default: {
      return filters;
    }
  }
}
```

- [ ] **Step 5: Use shared temporal context in smart search params**

Update `space-search.ts`:

```typescript
import { buildFilterContext, type FilterState } from '$lib/components/filter-panel/filter-panel';
```

Replace local year/month construction:

```typescript
const context = buildFilterContext(filters);
if (context?.takenAfter) {
  params.takenAfter = context.takenAfter;
}
if (context?.takenBefore) {
  params.takenBefore = context.takenBefore;
}
```

- [ ] **Step 6: Use tested helper in spaces route**

In `web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte`, import the helper:

```typescript
import { buildSpaceTimelineOptions, handleSpaceRemoveFilter } from '$lib/utils/space-filter-options';
```

Replace `handleRemoveFilter()` with:

```typescript
function handleRemoveFilter(type: string, id?: string) {
  filters = handleSpaceRemoveFilter(filters, type, id);
}
```

Replace the view-mode timeline options branch with:

```typescript
const options = $derived.by(() => {
  if (viewMode === 'select-assets') {
    return { visibility: AssetVisibility.Timeline, timelineSpaceId: space.id };
  }
  return buildSpaceTimelineOptions(space.id, filters);
});
```

Remove the route imports for `AssetOrder` and `AssetTypeEnum`; after this replacement those enum usages live in `space-filter-options.ts`.

- [ ] **Step 7: Track custom dates in smart search result reactivity**

Update the dependency array in `smart-search-results.svelte`:

```typescript
const _ = [
  searchQuery,
  filters.personIds,
  filters.city,
  filters.country,
  filters.make,
  filters.model,
  filters.tagIds,
  filters.rating,
  filters.mediaType,
  filters.dateAfter,
  filters.dateBefore,
  filters.selectedYear,
  filters.selectedMonth,
  filters.sortOrder,
  filters.isFavorite,
];
```

- [ ] **Step 8: Run tests and commit**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/utils/__tests__/album-filter-options.spec.ts src/lib/utils/__tests__/album-filter-config.spec.ts src/lib/utils/__tests__/map-filter-options.spec.ts src/lib/utils/__tests__/space-filter-options.spec.ts src/lib/utils/__tests__/space-search.spec.ts src/lib/components/search/smart-search-results.spec.ts
```

Expected: all route/search helper tests pass.

Commit:

```bash
git add web/src/lib/utils/__tests__/album-filter-options.spec.ts web/src/lib/utils/__tests__/album-filter-config.spec.ts web/src/lib/utils/__tests__/map-filter-options.spec.ts web/src/lib/utils/__tests__/space-filter-options.spec.ts web/src/lib/utils/space-filter-options.ts web/src/lib/utils/__tests__/space-search.spec.ts web/src/lib/utils/space-search.ts 'web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte' web/src/lib/components/search/smart-search-results.svelte web/src/lib/components/search/smart-search-results.spec.ts
git commit -m "feat(web): apply custom date ranges to search routes"
```

## Task 6: Final Verification

**Files:**

- Verify all files modified in Tasks 1-5.

- [ ] **Step 1: Run focused web tests**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/components/filter-panel/__tests__/filter-state.spec.ts src/lib/components/filter-panel/__tests__/temporal-picker.spec.ts src/lib/components/filter-panel/__tests__/contextual-refetch.spec.ts src/lib/components/filter-panel/__tests__/active-filters-bar.spec.ts src/lib/utils/__tests__/photos-filter-options.spec.ts src/lib/utils/__tests__/album-filter-options.spec.ts src/lib/utils/__tests__/album-filter-config.spec.ts src/lib/utils/__tests__/map-filter-options.spec.ts src/lib/utils/__tests__/space-filter-options.spec.ts src/lib/utils/__tests__/space-search.spec.ts src/lib/components/search/smart-search-results.spec.ts
```

Expected: all listed tests pass.

- [ ] **Step 2: Run type and Svelte checks**

Run:

```bash
pnpm --dir web run check:svelte
pnpm --dir web run check:typescript
```

Expected: both commands pass. Existing Svelte warnings are acceptable only if the command exits `0`; new warnings from edited files must be fixed.

- [ ] **Step 3: Run formatting and lint for touched web files**

Run:

```bash
pnpm --dir web exec prettier --check src/lib/components/filter-panel/filter-panel.ts src/lib/components/filter-panel/filter-panel.svelte src/lib/components/filter-panel/temporal-picker.svelte src/lib/components/filter-panel/active-filters-bar.svelte src/lib/components/filter-panel/__tests__/filter-state.spec.ts src/lib/components/filter-panel/__tests__/temporal-picker.spec.ts src/lib/components/filter-panel/__tests__/contextual-refetch.spec.ts src/lib/components/filter-panel/__tests__/active-filters-bar.spec.ts src/lib/utils/photos-filter-options.ts src/lib/utils/__tests__/photos-filter-options.spec.ts src/lib/utils/album-filter-options.ts src/lib/utils/__tests__/album-filter-options.spec.ts src/lib/utils/__tests__/album-filter-config.spec.ts src/lib/utils/map-filter-options.ts src/lib/utils/__tests__/map-filter-options.spec.ts src/lib/utils/space-filter-options.ts src/lib/utils/__tests__/space-filter-options.spec.ts src/lib/utils/space-search.ts src/lib/utils/__tests__/space-search.spec.ts src/lib/components/search/smart-search-results.svelte src/lib/components/search/smart-search-results.spec.ts 'src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte'
pnpm --dir web exec eslint src/lib/components/filter-panel/filter-panel.ts src/lib/components/filter-panel/filter-panel.svelte src/lib/components/filter-panel/temporal-picker.svelte src/lib/components/filter-panel/active-filters-bar.svelte src/lib/components/filter-panel/__tests__/filter-state.spec.ts src/lib/components/filter-panel/__tests__/temporal-picker.spec.ts src/lib/components/filter-panel/__tests__/contextual-refetch.spec.ts src/lib/components/filter-panel/__tests__/active-filters-bar.spec.ts src/lib/utils/photos-filter-options.ts src/lib/utils/__tests__/photos-filter-options.spec.ts src/lib/utils/album-filter-options.ts src/lib/utils/__tests__/album-filter-options.spec.ts src/lib/utils/__tests__/album-filter-config.spec.ts src/lib/utils/map-filter-options.ts src/lib/utils/__tests__/map-filter-options.spec.ts src/lib/utils/space-filter-options.ts src/lib/utils/__tests__/space-filter-options.spec.ts src/lib/utils/space-search.ts src/lib/utils/__tests__/space-search.spec.ts src/lib/components/search/smart-search-results.svelte src/lib/components/search/smart-search-results.spec.ts 'src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte' --max-warnings 0
```

Expected: both commands pass. If Prettier fails, run the same file list with `--write`, review the diff, then rerun check.

- [ ] **Step 4: Commit verification fixes when verification changed files**

If Step 2 or Step 3 required additional fixes, commit those changes:

```bash
git add web/src/lib/components/filter-panel web/src/lib/utils web/src/lib/components/search 'web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte'
git commit -m "fix(web): polish custom date range filters"
```

If `git status --short` is clean after Step 3, skip this step.
