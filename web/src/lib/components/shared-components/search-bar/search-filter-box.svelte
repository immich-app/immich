<script lang="ts" context="module">
  import type { SearchLocationFilter } from './search-location-section.svelte';
  import type { SearchDisplayFilters } from './search-display-section.svelte';
  import type { SearchDateFilter } from './search-date-section.svelte';

  export enum MediaType {
    All = 'all',
    Image = 'image',
    Video = 'video',
  }

  export type SearchFilter = {
    context?: string;
    filename?: string;
    personIds: Set<string>;
    location: SearchLocationFilter;
    camera: SearchCameraFilter;
    date: SearchDateFilter;
    display: SearchDisplayFilters;
    mediaType: MediaType;
  };
</script>

<script lang="ts">
  import Button from '$lib/components/elements/buttons/button.svelte';
  import { AssetTypeEnum, type SmartSearchDto, type MetadataSearchDto } from '@immich/sdk';
  import { createEventDispatcher } from 'svelte';
  import { fly } from 'svelte/transition';
  import SearchPeopleSection from './search-people-section.svelte';
  import SearchLocationSection from './search-location-section.svelte';
  import SearchCameraSection, { type SearchCameraFilter } from './search-camera-section.svelte';
  import SearchDateSection from './search-date-section.svelte';
  import SearchMediaSection from './search-media-section.svelte';
  import { parseUtcDate } from '$lib/utils/date-time';
  import SearchDisplaySection from './search-display-section.svelte';
  import SearchTextSection from './search-text-section.svelte';
  import { t } from 'svelte-i18n';

  export let searchQuery: MetadataSearchDto | SmartSearchDto;

  const parseOptionalDate = (dateString?: string) => (dateString ? parseUtcDate(dateString) : undefined);
  const toStartOfDayDate = (dateString: string) => parseUtcDate(dateString)?.startOf('day').toISODate() || undefined;
  const dispatch = createEventDispatcher<{ search: SmartSearchDto | MetadataSearchDto }>();

  let filter: SearchFilter = {
    context: 'query' in searchQuery ? searchQuery.query : '',
    filename: 'originalFileName' in searchQuery ? searchQuery.originalFileName : undefined,
    personIds: new Set('personIds' in searchQuery ? searchQuery.personIds : []),
    location: {
      country: searchQuery.country,
      state: searchQuery.state,
      city: searchQuery.city,
    },
    camera: {
      make: searchQuery.make,
      model: searchQuery.model,
    },
    date: {
      takenAfter: searchQuery.takenAfter ? toStartOfDayDate(searchQuery.takenAfter) : undefined,
      takenBefore: searchQuery.takenBefore ? toStartOfDayDate(searchQuery.takenBefore) : undefined,
    },
    display: {
      isArchive: searchQuery.isArchived,
      isFavorite: searchQuery.isFavorite,
      isNotInAlbum: 'isNotInAlbum' in searchQuery ? searchQuery.isNotInAlbum : undefined,
    },
    mediaType:
      searchQuery.type === AssetTypeEnum.Image
        ? MediaType.Image
        : searchQuery.type === AssetTypeEnum.Video
          ? MediaType.Video
          : MediaType.All,
  };

  let filterBoxWidth = 0;

  const resetForm = () => {
    filter = {
      personIds: new Set(),
      location: {},
      camera: {},
      date: {},
      display: {},
      mediaType: MediaType.All,
    };
  };

  const search = () => {
    let type: AssetTypeEnum | undefined = undefined;
    if (filter.mediaType === MediaType.Image) {
      type = AssetTypeEnum.Image;
    } else if (filter.mediaType === MediaType.Video) {
      type = AssetTypeEnum.Video;
    }

    let payload: SmartSearchDto | MetadataSearchDto = {
      query: filter.context || undefined,
      originalFileName: filter.filename,
      country: filter.location.country,
      state: filter.location.state,
      city: filter.location.city,
      make: filter.camera.make,
      model: filter.camera.model,
      takenAfter: parseOptionalDate(filter.date.takenAfter)?.startOf('day').toISO() || undefined,
      takenBefore: parseOptionalDate(filter.date.takenBefore)?.endOf('day').toISO() || undefined,
      isArchived: filter.display.isArchive || undefined,
      isFavorite: filter.display.isFavorite || undefined,
      isNotInAlbum: filter.display.isNotInAlbum || undefined,
      personIds: filter.personIds.size > 0 ? [...filter.personIds] : undefined,
      type,
    };

    dispatch('search', payload);
  };
</script>

<div
  bind:clientWidth={filterBoxWidth}
  transition:fly={{ y: 25, duration: 250 }}
  class="absolute w-full rounded-b-3xl border border-t-0 border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-immich-dark-gray dark:text-gray-300"
>
  <form
    id="search-filter-form"
    autocomplete="off"
    on:submit|preventDefault={search}
    on:reset|preventDefault={resetForm}
  >
    <div class="px-4 sm:px-6 py-4 space-y-10 max-h-[calc(100dvh-12rem)] overflow-y-auto immich-scrollbar" tabindex="-1">
      <!-- PEOPLE -->
      <SearchPeopleSection width={filterBoxWidth} bind:selectedPeople={filter.personIds} />

      <!-- TEXT -->
      <SearchTextSection bind:filename={filter.filename} bind:context={filter.context} />

      <!-- LOCATION -->
      <SearchLocationSection bind:filters={filter.location} />

      <!-- CAMERA MODEL -->
      <SearchCameraSection bind:filters={filter.camera} />

      <!-- DATE RANGE -->
      <SearchDateSection bind:filters={filter.date} />

      <div class="grid md:grid-cols-2 gap-x-5 gap-y-8">
        <!-- MEDIA TYPE -->
        <SearchMediaSection bind:filteredMedia={filter.mediaType} />

        <!-- DISPLAY OPTIONS -->
        <SearchDisplaySection bind:filters={filter.display} />
      </div>
    </div>

    <div
      id="button-row"
      class="flex justify-end gap-4 border-t dark:border-gray-800 dark:bg-immich-dark-gray px-4 sm:py-6 py-4 mt-2 rounded-b-3xl"
    >
      <Button type="reset" color="gray">{$t('clear_all')}</Button>
      <Button type="submit">{$t('search')}</Button>
    </div>
  </form>
</div>
