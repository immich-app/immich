<script lang="ts" module>
  import type { SearchLocationFilter } from './search-location-section.svelte';
  import type { SearchDisplayFilters } from './search-display-section.svelte';
  import type { SearchDateFilter } from './search-date-section.svelte';
  import { MediaType, QueryType, validQueryTypes } from '$lib/constants';

  export type SearchFilter = {
    query: string;
    queryType: 'smart' | 'metadata' | 'description';
    personIds: SvelteSet<string>;
    tagIds: SvelteSet<string>;
    location: SearchLocationFilter;
    camera: SearchCameraFilter;
    date: SearchDateFilter;
    display: SearchDisplayFilters;
    mediaType: MediaType;
    rating?: number;
  };
</script>

<script lang="ts">
  import { Button } from '@immich/ui';
  import { AssetTypeEnum, type SmartSearchDto, type MetadataSearchDto } from '@immich/sdk';
  import SearchPeopleSection from './search-people-section.svelte';
  import SearchTagsSection from './search-tags-section.svelte';
  import SearchLocationSection from './search-location-section.svelte';
  import SearchCameraSection, { type SearchCameraFilter } from './search-camera-section.svelte';
  import SearchDateSection from './search-date-section.svelte';
  import SearchMediaSection from './search-media-section.svelte';
  import SearchRatingsSection from './search-ratings-section.svelte';
  import { parseUtcDate } from '$lib/utils/date-time';
  import SearchDisplaySection from './search-display-section.svelte';
  import SearchTextSection from './search-text-section.svelte';
  import { t } from 'svelte-i18n';
  import FullScreenModal from '$lib/components/shared-components/full-screen-modal.svelte';
  import { mdiTune } from '@mdi/js';
  import { generateId } from '$lib/utils/generate-id';
  import { SvelteSet } from 'svelte/reactivity';
  import { preferences } from '$lib/stores/user.store';

  interface Props {
    searchQuery: MetadataSearchDto | SmartSearchDto;
    onClose: () => void;
    onSearch: (search: SmartSearchDto | MetadataSearchDto) => void;
  }

  let { searchQuery, onClose, onSearch }: Props = $props();

  const parseOptionalDate = (dateString?: string) => (dateString ? parseUtcDate(dateString) : undefined);
  const toStartOfDayDate = (dateString: string) => parseUtcDate(dateString)?.startOf('day').toISODate() || undefined;
  const formId = generateId();

  // combobox and all the search components have terrible support for value | null so we use empty string instead.
  function withNullAsUndefined<T>(value: T | null) {
    return value === null ? undefined : value;
  }

  function storeQueryType(type: SearchFilter['queryType']) {
    localStorage.setItem('searchQueryType', type);
  }

  function defaultQueryType(): QueryType {
    const storedQueryType = localStorage.getItem('searchQueryType') as QueryType;
    return validQueryTypes.has(storedQueryType) ? storedQueryType : QueryType.SMART;
  }

  let filter: SearchFilter = $state({
    query: 'query' in searchQuery ? searchQuery.query : searchQuery.originalFileName || '',
    queryType: defaultQueryType(),
    personIds: new SvelteSet('personIds' in searchQuery ? searchQuery.personIds : []),
    tagIds: new SvelteSet('tagIds' in searchQuery ? searchQuery.tagIds : []),
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
    rating: searchQuery.rating,
  });

  const resetForm = () => {
    filter = {
      query: '',
      queryType: defaultQueryType(), // retain from localStorage or default
      personIds: new SvelteSet(),
      tagIds: new SvelteSet(),
      location: {},
      camera: {},
      date: {},
      display: {},
      mediaType: MediaType.All,
      rating: undefined,
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
      description: filter.queryType === 'description' ? query : undefined,
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
      tagIds: filter.tagIds.size > 0 ? [...filter.tagIds] : undefined,
      type,
      rating: filter.rating,
    };

    onSearch(payload);
  };

  const onreset = (event: Event) => {
    event.preventDefault();
    resetForm();
  };

  const onsubmit = (event: Event) => {
    event.preventDefault();
    storeQueryType(filter.queryType);
    search();
  };

  // Will be called whenever queryType changes, not just onsubmit.
  $effect(() => {
    storeQueryType(filter.queryType);
  });
</script>

<FullScreenModal icon={mdiTune} width="extra-wide" title={$t('search_options')} {onClose}>
  <form id={formId} autocomplete="off" {onsubmit} {onreset}>
    <div class="space-y-10 pb-10" tabindex="-1">
      <!-- PEOPLE -->
      <SearchPeopleSection bind:selectedPeople={filter.personIds} />

      <!-- TEXT -->
      <SearchTextSection bind:query={filter.query} bind:queryType={filter.queryType} />

      <!-- TAGS -->
      <SearchTagsSection bind:selectedTags={filter.tagIds} />

      <!-- LOCATION -->
      <SearchLocationSection bind:filters={filter.location} />

      <!-- CAMERA MODEL -->
      <SearchCameraSection bind:filters={filter.camera} />

      <!-- DATE RANGE -->
      <SearchDateSection bind:filters={filter.date} />

      <!-- RATING -->
      {#if $preferences?.ratings.enabled}
        <SearchRatingsSection bind:rating={filter.rating} />
      {/if}

      <div class="grid md:grid-cols-2 gap-x-5 gap-y-10">
        <!-- MEDIA TYPE -->
        <SearchMediaSection bind:filteredMedia={filter.mediaType} />

        <!-- DISPLAY OPTIONS -->
        <SearchDisplaySection bind:filters={filter.display} />
      </div>
    </div>
  </form>

  {#snippet stickyBottom()}
    <Button shape="round" size="large" type="reset" color="secondary" fullWidth form={formId}>{$t('clear_all')}</Button>
    <Button shape="round" size="large" type="submit" fullWidth form={formId}>{$t('search')}</Button>
  {/snippet}
</FullScreenModal>
