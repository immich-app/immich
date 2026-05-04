<script lang="ts">
  import { Icon } from '@immich/ui';
  import { browser } from '$app/environment';
  import { SvelteSet } from 'svelte/reactivity';
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
    mdiHeart,
  } from '@mdi/js';
  import { untrack } from 'svelte';
  import type {
    FilterPanelConfig,
    FilterSection as FilterSectionType,
    FilterState,
    PersonOption,
    TagOption,
  } from './filter-panel';
  import { buildFilterContext, createFilterState } from './filter-panel';
  import FilterSection from './filter-section.svelte';
  import TemporalPicker from './temporal-picker.svelte';
  import PeopleFilter from './people-filter.svelte';
  import LocationFilter from './location-filter.svelte';
  import CameraFilter from './camera-filter.svelte';
  import TagsFilter from './tags-filter.svelte';
  import RatingFilter from './rating-filter.svelte';
  import MediaTypeFilter from './media-type-filter.svelte';
  import FavoritesFilter from './favorites-filter.svelte';

  interface Props {
    config: FilterPanelConfig;
    timeBuckets: Array<{ timeBucket: string; count: number }>;
    filters?: FilterState;
    personNames?: Map<string, string>;
    tagNames?: Map<string, string>;
    onFiltersChange?: (filters: FilterState) => void;
    persistCollapsed?: boolean;
    storageKey?: string;
    hidden?: boolean;
  }

  const COLLAPSED_KEY = 'gallery-filter-collapsed';

  let {
    config,
    timeBuckets,
    filters = $bindable(createFilterState()),
    personNames,
    tagNames,
    onFiltersChange,
    storageKey = 'gallery-filter-visible-sections',
    hidden = false,
    persistCollapsed = true,
  }: Props = $props();

  function loadCollapsed(): boolean {
    if (persistCollapsed && browser) {
      try {
        const raw = localStorage.getItem(COLLAPSED_KEY);
        if (raw !== null) {
          return JSON.parse(raw) as boolean;
        }
      } catch {
        /* corrupted — fall through */
      }
    }
    return false;
  }

  let collapsed = $state(loadCollapsed());

  const providers = config.providers ?? {};

  // Fetched data for filter sections
  let people = $state<PersonOption[]>([]);
  let hasUnnamedPeople = $state(false);
  let countries = $state<string[]>([]);
  let cameraMakes = $state<string[]>([]);
  let tags = $state<TagOption[]>([]);
  let availableRatings = $state<number[] | undefined>();
  let availableMediaTypes = $state<string[] | undefined>();

  let filterContext = $derived(buildFilterContext(filters));
  let locationFilterContext = $derived(buildFilterContext(filters, ['country', 'city']));
  let cameraFilterContext = $derived(buildFilterContext(filters, ['make', 'model']));

  // Unified suggestions re-fetch: replaces mount effects + temporal re-fetch when suggestionsProvider is set
  let prevFilters: FilterState | undefined = $state();
  let unifiedAbortController: AbortController | undefined = $state();

  $effect(() => {
    if (!config.suggestionsProvider) {
      return;
    }

    // Track all filter fields — reading them registers as dependencies
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

    const prev = untrack(() => prevFilters);

    const isInitialMount = prev === undefined;
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

    const delay = isInitialMount || isTemporalClear ? 0 : temporalChanged ? 200 : 50;

    const provider = config.suggestionsProvider;
    const currentFilters = { ...current };

    const timeout = setTimeout(() => {
      unifiedAbortController?.abort();
      const controller = new AbortController();
      unifiedAbortController = controller;
      isRefetching = true;

      void provider(currentFilters)
        .then((result) => {
          if (controller.signal.aborted) {
            return;
          }
          people = result.people;
          countries = result.countries;
          cameraMakes = result.cameraMakes;
          tags = result.tags;
          // Note: availableRatings and availableMediaTypes are intentionally NOT set from
          // suggestionsProvider. Hiding rating stars and media type buttons based on the
          // current result set is too aggressive — it breaks existing E2E tests and confuses
          // users who expect these fixed options to always be visible. The core value of
          // interdependent filtering is in people/countries/cameras/tags narrowing.
          hasUnnamedPeople = result.hasUnnamedPeople;
        })
        .catch((error: unknown) => {
          if (!controller.signal.aborted) {
            console.error('Failed to fetch filter suggestions:', error);
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            isRefetching = false;
          }
        });
    }, delay);

    prevFilters = current;

    return () => {
      clearTimeout(timeout);
    };
  });

  let prevTakenAfter: string | undefined = $state();
  let prevTakenBefore: string | undefined = $state();
  let abortController: AbortController | undefined = $state();
  let isRefetching = $state(false);

  // Debounced re-fetch when temporal filter changes.
  // We track temporal fields directly instead of
  // filterContext to avoid re-triggering when non-temporal filters change.
  $effect(() => {
    if (config.suggestionsProvider) {
      return;
    }

    // Track only temporal fields — this is what determines re-fetch
    const dateAfter = filters.dateAfter;
    const dateBefore = filters.dateBefore;
    const year = filters.selectedYear;
    const month = filters.selectedMonth;
    // Build context from tracked values (not from filterContext which would track all of filters)
    const currentContext = buildFilterContext({
      dateAfter,
      dateBefore,
      selectedYear: year,
      selectedMonth: month,
    } as FilterState);
    const currentTakenAfter = currentContext?.takenAfter;
    const currentTakenBefore = currentContext?.takenBefore;

    // Read prev values without tracking to avoid re-trigger loops
    const prevAfter = untrack(() => prevTakenAfter);
    const prevBefore = untrack(() => prevTakenBefore);

    // Skip initial load (both undefined)
    if (
      prevAfter === undefined &&
      prevBefore === undefined &&
      currentTakenAfter === undefined &&
      currentTakenBefore === undefined
    ) {
      return;
    }

    // Skip if context hasn't actually changed
    if (prevAfter === currentTakenAfter && prevBefore === currentTakenBefore) {
      return;
    }

    const isClear = (prevAfter !== undefined || prevBefore !== undefined) && currentContext === undefined;
    const delay = isClear ? 0 : 200;

    const sections = config.sections;

    const timeout = setTimeout(() => {
      // Abort previous in-flight requests
      abortController?.abort();
      const controller = new AbortController();
      abortController = controller;
      isRefetching = true;

      const promises: Promise<void>[] = [];

      if (providers.people && sections.includes('people')) {
        promises.push(
          providers
            .people(currentContext)
            .then((result) => {
              if (!controller.signal.aborted) {
                people = result;
              }
            })
            .catch((error: unknown) => {
              console.error('Failed to re-fetch people:', error);
            }),
        );
      }

      if (providers.locations && sections.includes('location')) {
        promises.push(
          providers
            .locations(currentContext)
            .then((result) => {
              if (!controller.signal.aborted) {
                countries = result.filter((l) => l.type === 'country').map((l) => l.value);
              }
            })
            .catch((error: unknown) => {
              console.error('Failed to re-fetch locations:', error);
            }),
        );
      }

      if (providers.cameras && sections.includes('camera')) {
        promises.push(
          providers
            .cameras(currentContext)
            .then((result) => {
              if (!controller.signal.aborted) {
                cameraMakes = result.filter((c) => c.type === 'make').map((c) => c.value);
              }
            })
            .catch((error: unknown) => {
              console.error('Failed to re-fetch cameras:', error);
            }),
        );
      }

      if (providers.tags && sections.includes('tags')) {
        promises.push(
          providers
            .tags(currentContext)
            .then((result) => {
              if (!controller.signal.aborted) {
                tags = result;
              }
            })
            .catch((error: unknown) => {
              console.error('Failed to re-fetch tags:', error);
            }),
        );
      }

      void Promise.allSettled(promises).then(() => {
        if (!controller.signal.aborted) {
          isRefetching = false;
        }
      });
    }, delay);

    prevTakenAfter = currentTakenAfter;
    prevTakenBefore = currentTakenBefore;

    return () => {
      clearTimeout(timeout);
    };
  });

  // Cleanup on unmount
  $effect(() => {
    return () => {
      abortController?.abort();
      unifiedAbortController?.abort();
    };
  });

  const sectionIcons: Record<string, string> = {
    timeline: mdiCalendar,
    people: mdiAccount,
    location: mdiMapMarker,
    camera: mdiCamera,
    tags: mdiTag,
    rating: mdiStar,
    media: mdiImage,
    favorites: mdiHeart,
  };

  const sectionTitles: Record<string, string> = {
    timeline: 'Timeline',
    people: 'People',
    location: 'Location',
    camera: 'Camera',
    tags: 'Tags',
    rating: 'Rating',
    media: 'Media Type',
    favorites: 'Favorites',
  };

  const sectionToggleLabels: Record<string, string> = {
    ...sectionTitles,
    // Avoid colliding with asset action buttons labeled "Favorite" in browser automation.
    favorites: 'Starred filter section',
  };

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
    return configSections.filter(
      (section) => selectedSections.has(section) || !LEGACY_INTRODUCED_SECTIONS.has(section),
    );
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

      const selected = getValidSections(parsed?.selected, configSections);
      const known = getValidSections(parsed?.known, configSections);
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

  let visibleSections = $state(loadVisibleSections(config.sections, storageKey));

  const EXPANDED_SECTIONS_KEY = 'gallery-filter-expanded-sections';

  function loadExpandedSections(configSections: FilterSectionType[]): SvelteSet<FilterSectionType> {
    if (browser) {
      return hydrateSectionSet(
        configSections,
        localStorage.getItem(EXPANDED_SECTIONS_KEY),
        () => new SvelteSet(configSections),
      );
    }
    return new SvelteSet(configSections);
  }

  let expandedSections = $state(loadExpandedSections(config.sections));

  function toggleSectionExpanded(section: FilterSectionType) {
    const next = new SvelteSet(expandedSections);
    if (next.has(section)) {
      next.delete(section);
    } else {
      next.add(section);
    }
    expandedSections = next;
  }

  function toggleSection(section: FilterSectionType) {
    const next = new SvelteSet(visibleSections);
    if (next.has(section)) {
      next.delete(section);
    } else {
      next.add(section);
    }
    visibleSections = next;
  }

  function showAllSections() {
    visibleSections = new SvelteSet(config.sections);
  }

  $effect(() => {
    if (browser) {
      try {
        localStorage.setItem(storageKey, serializeSectionSet(visibleSections, config.sections));
      } catch {
        /* localStorage unavailable */
      }
    }
  });

  $effect(() => {
    if (persistCollapsed && browser) {
      try {
        localStorage.setItem(COLLAPSED_KEY, JSON.stringify(collapsed));
      } catch {
        /* localStorage unavailable */
      }
    }
  });

  $effect(() => {
    if (browser) {
      try {
        localStorage.setItem(EXPANDED_SECTIONS_KEY, serializeSectionSet(expandedSections, config.sections));
      } catch {
        /* localStorage unavailable */
      }
    }
  });

  // Fetch data on mount via $effect
  $effect(() => {
    if (config.suggestionsProvider) {
      return;
    }
    if (providers.people && config.sections.includes('people')) {
      void providers.people().then((result) => {
        people = result;
        if (result.length === 0 && providers.allPeople) {
          void providers.allPeople().then((all) => {
            hasUnnamedPeople = all.length > 0;
          });
        }
      });
    }
  });

  $effect(() => {
    if (config.suggestionsProvider) {
      return;
    }
    if (providers.locations && config.sections.includes('location')) {
      void providers.locations().then((result) => {
        countries = result.filter((l) => l.type === 'country').map((l) => l.value);
      });
    }
  });

  $effect(() => {
    if (config.suggestionsProvider) {
      return;
    }
    if (providers.cameras && config.sections.includes('camera')) {
      void providers.cameras().then((result) => {
        cameraMakes = result.filter((c) => c.type === 'make').map((c) => c.value);
      });
    }
  });

  $effect(() => {
    if (config.suggestionsProvider) {
      return;
    }
    if (providers.tags && config.sections.includes('tags')) {
      void providers.tags().then((result) => {
        tags = result;
      });
    }
  });

  function updateFilters(nextFilters: FilterState) {
    filters = nextFilters;
    onFiltersChange?.(nextFilters);
  }

  function handlePeopleChange(ids: string[]) {
    updateFilters({ ...filters, personIds: ids });
  }

  function handleLocationChange(country?: string, city?: string) {
    updateFilters({ ...filters, country, city });
  }

  function handleCameraChange(make?: string, model?: string) {
    updateFilters({ ...filters, make, model });
  }

  function handleTagsChange(ids: string[]) {
    updateFilters({ ...filters, tagIds: ids });
  }

  function handleRatingChange(rating?: number) {
    updateFilters({ ...filters, rating });
  }

  function handleMediaTypeChange(type: 'all' | 'image' | 'video') {
    updateFilters({ ...filters, mediaType: type });
  }

  function handleCustomDateRangeChange(dateAfter: string | undefined, dateBefore: string | undefined) {
    updateFilters({ ...filters, dateAfter, dateBefore, selectedYear: undefined, selectedMonth: undefined });
  }

  function handleYearSelect(year: number | undefined) {
    updateFilters({
      ...filters,
      dateAfter: undefined,
      dateBefore: undefined,
      selectedYear: year,
      selectedMonth: undefined,
    });
  }

  function handleMonthSelect(year: number, month: number | undefined) {
    updateFilters({
      ...filters,
      dateAfter: undefined,
      dateBefore: undefined,
      selectedYear: year,
      selectedMonth: month,
    });
  }

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
      case 'favorites': {
        return filters.isFavorite !== undefined;
      }
      case 'timeline': {
        return (
          filters.dateAfter !== undefined || filters.dateBefore !== undefined || filters.selectedYear !== undefined
        );
      }
      default: {
        return false;
      }
    }
  }
</script>

{#if hidden}
  <!-- FilterPanel hidden: no assets to filter -->
{:else if collapsed}
  <div
    class="flex h-full w-8 flex-shrink-0 flex-col items-center gap-3 border-r border-gray-200 bg-light py-2 dark:border-gray-700"
    data-testid="collapsed-icon-strip"
  >
    <button
      type="button"
      class="flex h-6 w-6 items-center justify-center rounded-full text-gray-500 hover:bg-subtle dark:text-gray-400"
      onclick={() => (collapsed = false)}
      data-testid="expand-panel-btn"
    >
      <Icon icon={mdiChevronRight} size="16" />
    </button>
    {#each config.sections as section (section)}
      <button
        type="button"
        class="relative flex h-6 w-6 items-center justify-center rounded-md text-gray-500 hover:bg-subtle dark:text-gray-400"
        onclick={() => (collapsed = false)}
      >
        <Icon icon={sectionIcons[section]} size="16" />
        {#if hasActiveFilter(section)}
          <span
            class="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border-[1.5px] border-light bg-immich-primary dark:bg-immich-dark-primary"
          ></span>
        {/if}
      </button>
    {/each}
  </div>
{:else}
  <div
    class="immich-scrollbar flex w-64 flex-col overflow-y-auto border-r border-gray-200 bg-light dark:border-gray-700"
    data-testid="discovery-panel"
  >
    <div
      class="sticky top-0 z-5 flex items-center justify-between border-b border-gray-200 bg-light px-4 py-2.5 dark:border-gray-700"
    >
      <span class="text-sm font-medium">Filters</span>
      <button
        type="button"
        class="flex h-6 w-6 items-center justify-center rounded-full text-gray-500 hover:bg-subtle dark:text-gray-400"
        onclick={() => (collapsed = true)}
        data-testid="collapse-panel-btn"
      >
        <Icon icon={mdiChevronLeft} size="14" />
      </button>
    </div>

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
            aria-label={sectionToggleLabels[section]}
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

    <div class="pt-4">
      {#each config.sections as section (section)}
        {#if visibleSections.has(section)}
          <FilterSection
            title={sectionTitles[section]}
            testId={section}
            refetching={isRefetching && section !== 'timeline'}
            expanded={expandedSections.has(section)}
            onToggleExpanded={() => toggleSectionExpanded(section)}
            count={filterContext
              ? section === 'people'
                ? people.length
                : section === 'location'
                  ? countries.length
                  : section === 'camera'
                    ? cameraMakes.length
                    : section === 'tags'
                      ? tags.length
                      : undefined
              : undefined}
          >
            {#if section === 'timeline'}
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
            {:else if section === 'people'}
              <PeopleFilter
                {people}
                selectedIds={filters.personIds}
                selectedNames={personNames}
                onSelectionChange={handlePeopleChange}
                emptyText={hasUnnamedPeople ? 'Name people to use this filter' : undefined}
              />
            {:else if section === 'location'}
              <LocationFilter
                {countries}
                selectedCity={filters.city}
                selectedCountry={filters.country}
                context={locationFilterContext}
                onCityFetch={async (country, ctx) => {
                  if (providers.cities) {
                    return providers.cities(country, ctx);
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
                context={cameraFilterContext}
                onModelFetch={async (make, ctx) => {
                  if (providers.cameraModels) {
                    return providers.cameraModels(make, ctx);
                  }
                  return [];
                }}
                onSelectionChange={handleCameraChange}
              />
            {:else if section === 'tags'}
              <TagsFilter
                {tags}
                selectedIds={filters.tagIds}
                selectedNames={tagNames}
                onSelectionChange={handleTagsChange}
              />
            {:else if section === 'rating'}
              <RatingFilter selectedRating={filters.rating} {availableRatings} onRatingChange={handleRatingChange} />
            {:else if section === 'media'}
              <MediaTypeFilter
                selected={filters.mediaType}
                {availableMediaTypes}
                onTypeChange={handleMediaTypeChange}
              />
            {:else if section === 'favorites'}
              <FavoritesFilter
                selected={filters.isFavorite}
                onToggle={(value) => {
                  updateFilters({ ...filters, isFavorite: value });
                }}
              />
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
  </div>
{/if}
