<script lang="ts" module>
  import { MediaType, QueryType, validQueryTypes } from '$lib/constants';
  import type { SearchDateFilter } from '../components/shared-components/search-bar/search-date-section.svelte';
  import type { SearchDisplayFilters } from '../components/shared-components/search-bar/search-display-section.svelte';
  import type { SearchLocationFilter } from '../components/shared-components/search-bar/search-location-section.svelte';

  export type SearchFilter = {
    query: string;
    queryType: 'smart' | 'metadata' | 'description';
    personIds: SvelteSet<string>;
    tagIds: SvelteSet<string> | null;
    location: SearchLocationFilter;
    camera: SearchCameraFilter;
    date: SearchDateFilter;
    display: SearchDisplayFilters;
    mediaType: MediaType;
    rating?: number;
  };
</script>

<script lang="ts">
  import SearchCameraSection, {
    type SearchCameraFilter,
  } from '$lib/components/shared-components/search-bar/search-camera-section.svelte';
  import SearchDateSection from '$lib/components/shared-components/search-bar/search-date-section.svelte';
  import SearchDisplaySection from '$lib/components/shared-components/search-bar/search-display-section.svelte';
  import SearchLocationSection from '$lib/components/shared-components/search-bar/search-location-section.svelte';
  import SearchMediaSection from '$lib/components/shared-components/search-bar/search-media-section.svelte';
  import SearchPeopleSection from '$lib/components/shared-components/search-bar/search-people-section.svelte';
  import SearchRatingsSection from '$lib/components/shared-components/search-bar/search-ratings-section.svelte';
  import SearchTagsSection from '$lib/components/shared-components/search-bar/search-tags-section.svelte';
  import SearchTextSection from '$lib/components/shared-components/search-bar/search-text-section.svelte';
  import { preferences } from '$lib/stores/user.store';
  import { parseUtcDate } from '$lib/utils/date-time';
  import { generateId } from '$lib/utils/generate-id';
  import { AssetTypeEnum, AssetVisibility, type MetadataSearchDto, type SmartSearchDto } from '@immich/sdk';
  import { Button, HStack, Modal, ModalBody, ModalFooter } from '@immich/ui';
  import { mdiTune } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { SvelteSet } from 'svelte/reactivity';

  interface Props {
    searchQuery: MetadataSearchDto | SmartSearchDto;
    onClose: (search?: SmartSearchDto | MetadataSearchDto) => void;
  }

  let { searchQuery, onClose }: Props = $props();

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

  let query = '';
  if ('query' in searchQuery && searchQuery.query) {
    query = searchQuery.query;
  }
  if ('originalFileName' in searchQuery && searchQuery.originalFileName) {
    query = searchQuery.originalFileName;
  }

  let filter: SearchFilter = $state({
    query,
    queryType: defaultQueryType(),
    personIds: new SvelteSet('personIds' in searchQuery ? searchQuery.personIds : []),
    tagIds:
      'tagIds' in searchQuery
        ? searchQuery.tagIds === null
          ? null
          : new SvelteSet(searchQuery.tagIds)
        : new SvelteSet(),
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
      isArchive: searchQuery.visibility === AssetVisibility.Archive,
      isFavorite: searchQuery.isFavorite ?? false,
      isNotInAlbum: 'isNotInAlbum' in searchQuery ? (searchQuery.isNotInAlbum ?? false) : false,
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
      display: {
        isArchive: false,
        isFavorite: false,
        isNotInAlbum: false,
      },
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
      visibility: filter.display.isArchive ? AssetVisibility.Archive : undefined,
      isFavorite: filter.display.isFavorite || undefined,
      isNotInAlbum: filter.display.isNotInAlbum || undefined,
      personIds: filter.personIds.size > 0 ? [...filter.personIds] : undefined,
      tagIds: filter.tagIds === null ? null : filter.tagIds.size > 0 ? [...filter.tagIds] : undefined,
      type,
      rating: filter.rating,
    };

    onClose(payload);
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

<Modal icon={mdiTune} size="giant" title={$t('search_options')} {onClose}>
  <ModalBody>
    <form id={formId} autocomplete="off" {onsubmit} {onreset}>
      <div class="flex flex-col gap-4 pb-10" tabindex="-1">
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
  </ModalBody>

  <ModalFooter>
    <HStack fullWidth>
      <Button shape="round" size="large" type="reset" color="secondary" fullWidth form={formId}
        >{$t('clear_all')}</Button
      >
      <Button shape="round" size="large" type="submit" fullWidth form={formId}>{$t('search')}</Button>
    </HStack>
  </ModalFooter>
</Modal>
