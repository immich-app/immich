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
  } from '@mdi/js';
  import { untrack } from 'svelte';
  import type {
    FilterContext,
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
  let collapsed = $state(initialCollapsed);

  // Fetched data for filter sections
  let people = $state<PersonOption[]>([]);
  let countries = $state<string[]>([]);
  let cameraMakes = $state<string[]>([]);
  let tags = $state<TagOption[]>([]);

  // Stable filterContext that only updates when temporal values actually change.
  // Derived directly from selectedYear/selectedMonth (not the full filters object)
  // to prevent $effect blocks in LocationFilter/CameraFilter from re-triggering
  // on non-temporal filter changes.
  let filterContext: FilterContext | undefined = $state();
  $effect(() => {
    const year = filters.selectedYear;
    const month = filters.selectedMonth;
    const next = buildFilterContext({ selectedYear: year, selectedMonth: month } as FilterState);
    if (filterContext?.takenAfter !== next?.takenAfter || filterContext?.takenBefore !== next?.takenBefore) {
      filterContext = next;
    }
  });

  let prevTakenAfter: string | undefined = $state();
  let prevTakenBefore: string | undefined = $state();
  let abortController: AbortController | undefined = $state();
  let isRefetching = $state(false);

  // Debounced re-fetch when temporal filter changes.
  // We track filters.selectedYear and filters.selectedMonth directly instead of
  // filterContext to avoid re-triggering when non-temporal filters change.
  $effect(() => {
    // Track only the two temporal fields — this is what determines re-fetch
    const year = filters.selectedYear;
    const month = filters.selectedMonth;
    // Build context from tracked values (not from filterContext which would track all of filters)
    const currentContext = buildFilterContext({ selectedYear: year, selectedMonth: month } as FilterState);
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

    // Capture config providers to avoid stale closure warning
    const providers = config.providers;
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
  };

  const sectionTitles: Record<string, string> = {
    timeline: 'Timeline',
    people: 'People',
    location: 'Location',
    camera: 'Camera',
    tags: 'Tags',
    rating: 'Rating',
    media: 'Media Type',
  };

  function loadVisibleSections(configSections: FilterSectionType[], key: string): SvelteSet<FilterSectionType> {
    if (browser) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw) as string[];
          const valid = parsed.filter((s): s is FilterSectionType => configSections.includes(s as FilterSectionType));
          if (valid.length > 0) {
            return new SvelteSet(valid);
          }
        }
      } catch {
        /* corrupted JSON or localStorage unavailable — fall through to default */
      }
    }
    return new SvelteSet(configSections);
  }

  let visibleSections = $state(loadVisibleSections(config.sections, storageKey));

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
        localStorage.setItem(storageKey, JSON.stringify([...visibleSections]));
      } catch {
        /* localStorage unavailable */
      }
    }
  });

  // Fetch data on mount via $effect
  $effect(() => {
    if (config.providers.people && config.sections.includes('people')) {
      void config.providers.people().then((result) => {
        people = result;
      });
    }
  });

  $effect(() => {
    if (config.providers.locations && config.sections.includes('location')) {
      void config.providers.locations().then((result) => {
        countries = result.filter((l) => l.type === 'country').map((l) => l.value);
      });
    }
  });

  $effect(() => {
    if (config.providers.cameras && config.sections.includes('camera')) {
      void config.providers.cameras().then((result) => {
        cameraMakes = result.filter((c) => c.type === 'make').map((c) => c.value);
      });
    }
  });

  $effect(() => {
    if (config.providers.tags && config.sections.includes('tags')) {
      void config.providers.tags().then((result) => {
        tags = result;
      });
    }
  });

  function handlePeopleChange(ids: string[]) {
    filters = { ...filters, personIds: ids };
  }

  function handleLocationChange(country?: string, city?: string) {
    filters = { ...filters, country, city };
  }

  function handleCameraChange(make?: string, model?: string) {
    filters = { ...filters, make, model };
  }

  function handleTagsChange(ids: string[]) {
    filters = { ...filters, tagIds: ids };
  }

  function handleRatingChange(rating?: number) {
    filters = { ...filters, rating };
  }

  function handleMediaTypeChange(type: 'all' | 'image' | 'video') {
    filters = { ...filters, mediaType: type };
  }

  function handleYearSelect(year: number | undefined) {
    filters = { ...filters, selectedYear: year, selectedMonth: undefined };
  }

  function handleMonthSelect(year: number, month: number | undefined) {
    filters = { ...filters, selectedYear: year, selectedMonth: month };
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
      case 'timeline': {
        return filters.selectedYear !== undefined;
      }
      default: {
        return false;
      }
    }
  }
</script>

{#if collapsed}
  <div
    class="flex w-8 flex-shrink-0 flex-col items-center gap-3 border-r border-gray-200 bg-light py-2 shadow-sm dark:border-gray-700 dark:shadow-none"
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
    class="immich-scrollbar flex w-64 flex-col overflow-y-auto border-r border-gray-200 bg-light shadow-sm dark:border-gray-700 dark:shadow-none"
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

    <div class="pt-4">
      {#each config.sections as section (section)}
        {#if visibleSections.has(section)}
          <FilterSection
            title={sectionTitles[section]}
            testId={section}
            refetching={isRefetching && section !== 'timeline'}
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
                context={filterContext}
                onCityFetch={async (country, ctx) => {
                  if (config.providers.cities) {
                    return config.providers.cities(country, ctx);
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
                context={filterContext}
                onModelFetch={async (make, ctx) => {
                  if (config.providers.cameraModels) {
                    return config.providers.cameraModels(make, ctx);
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
  </div>
{/if}
