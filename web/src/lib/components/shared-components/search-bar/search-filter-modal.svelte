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
    query: string;
    queryType: 'smart' | 'metadata';
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
  import SearchPeopleSection from './search-people-section.svelte';
  import SearchLocationSection from './search-location-section.svelte';
  import SearchCameraSection, { type SearchCameraFilter } from './search-camera-section.svelte';
  import SearchDateSection from './search-date-section.svelte';
  import SearchMediaSection from './search-media-section.svelte';
  import { parseUtcDate } from '$lib/utils/date-time';
  import SearchDisplaySection from './search-display-section.svelte';
  import SearchTextSection from './search-text-section.svelte';
  import { t } from 'svelte-i18n';
  import FullScreenModal from '$lib/components/shared-components/full-screen-modal.svelte';
  import { mdiTune } from '@mdi/js';
  import { generateId } from '$lib/utils/generate-id';

  export let searchQuery: MetadataSearchDto | SmartSearchDto;
  export let onClose: () => void;
  export let onSearch: (search: SmartSearchDto | MetadataSearchDto) => void;

  const parseOptionalDate = (dateString?: string) => (dateString ? parseUtcDate(dateString) : undefined);
  const toStartOfDayDate = (dateString: string) => parseUtcDate(dateString)?.startOf('day').toISODate() || undefined;
  const formId = generateId();

  // combobox and all the search components have terrible support for value | null so we use empty string instead.
  function withNullAsUndefined<T>(value: T | null) {
    return value === null ? undefined : value;
  }

  let filter: SearchFilter = {
    query: 'query' in searchQuery ? searchQuery.query : searchQuery.originalFileName || '',
    queryType: 'query' in searchQuery ? 'smart' : 'metadata',
    personIds: new Set('personIds' in searchQuery ? searchQuery.personIds : []),
    location: {
      country: withNullAsUndefined(searchQuery.country),
      state: withNullAsUndefined(searchQuery.state),
      city: withNullAsUndefined(searchQuery.city),
    },
    camera: {
      make: withNullAsUndefined(searchQuery.make),
      model: withNullAsUndefined(searchQuery.model),
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

  const resetForm = () => {
    filter = {
      query: '',
      queryType: 'smart',
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

    const query = filter.query || undefined;

    let payload: SmartSearchDto | MetadataSearchDto = {
      query: filter.queryType === 'smart' ? query : undefined,
      originalFileName: filter.queryType === 'metadata' ? query : undefined,
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

    onSearch(payload);
  };
</script>

<FullScreenModal icon={mdiTune} width="extra-wide" title={$t('search_options')} {onClose}>
  <form id={formId} autocomplete="off" on:submit|preventDefault={search} on:reset|preventDefault={resetForm}>
    <div class="space-y-10 pb-10" tabindex="-1">
      <!-- PEOPLE -->
      <SearchPeopleSection bind:selectedPeople={filter.personIds} />

      <!-- TEXT -->
      <SearchTextSection bind:query={filter.query} bind:queryType={filter.queryType} />

      <!-- LOCATION -->
      <SearchLocationSection bind:filters={filter.location} />

      <!-- CAMERA MODEL -->
      <SearchCameraSection bind:filters={filter.camera} />

      <!-- DATE RANGE -->
      <SearchDateSection bind:filters={filter.date} />

      <div class="grid md:grid-cols-2 gap-x-5 gap-y-10">
        <!-- MEDIA TYPE -->
        <SearchMediaSection bind:filteredMedia={filter.mediaType} />

        <!-- DISPLAY OPTIONS -->
        <SearchDisplaySection bind:filters={filter.display} />
      </div>
    </div>
  </form>

  <svelte:fragment slot="sticky-bottom">
    <Button type="reset" color="gray" fullwidth form={formId}>{$t('clear_all')}</Button>
    <Button type="submit" fullwidth form={formId}>{$t('search')}</Button>
  </svelte:fragment>
</FullScreenModal>
