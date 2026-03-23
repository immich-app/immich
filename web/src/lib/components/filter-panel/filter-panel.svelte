<script lang="ts">
  import { Icon } from '@immich/ui';
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
  import type { FilterPanelConfig, FilterState, PersonOption, TagOption } from './filter-panel';
  import { createFilterState } from './filter-panel';
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
  }

  let { config, timeBuckets, filters = $bindable(createFilterState()) }: Props = $props();
  let collapsed = $state(false);

  // Fetched data for filter sections
  let people = $state<PersonOption[]>([]);
  let countries = $state<string[]>([]);
  let cameraMakes = $state<string[]>([]);
  let tags = $state<TagOption[]>([]);

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
      default: {
        return false;
      }
    }
  }
</script>

{#if collapsed}
  <div
    class="flex w-8 flex-col items-center gap-3 border-r border-gray-200 bg-light py-2 dark:border-gray-700"
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

    <div class="pt-4">
      {#each config.sections as section (section)}
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
      {/each}
    </div>
  </div>
{/if}
