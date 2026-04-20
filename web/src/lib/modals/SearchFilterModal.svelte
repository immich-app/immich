<script lang="ts">
  import SearchCameraSection from '$lib/components/shared-components/search-bar/search-camera-section.svelte';
  import SearchDateSection from '$lib/components/shared-components/search-bar/search-date-section.svelte';
  import SearchDisplaySection from '$lib/components/shared-components/search-bar/search-display-section.svelte';
  import SearchLocationSection from '$lib/components/shared-components/search-bar/search-location-section.svelte';
  import SearchMediaSection from '$lib/components/shared-components/search-bar/search-media-section.svelte';
  import SearchPeopleSection from '$lib/components/shared-components/search-bar/search-people-section.svelte';
  import SearchRatingsSection from '$lib/components/shared-components/search-bar/search-ratings-section.svelte';
  import SearchTagsSection from '$lib/components/shared-components/search-bar/search-tags-section.svelte';
  import SearchTextFiltersSection from '$lib/components/shared-components/search-bar/search-text-filters-section.svelte';
  import SearchTextSection from '$lib/components/shared-components/search-bar/search-text-section.svelte';
  import { MediaType } from '$lib/constants';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import type { SearchFilter } from '$lib/types';
  import { parseUtcDate } from '$lib/utils/date-time';
  import { generateId } from '$lib/utils/generate-id';
  import { AssetTypeEnum, AssetVisibility, type MetadataSearchDto, type SmartSearchDto } from '@immich/sdk';
  import { Button, HStack, Modal, ModalBody, ModalFooter } from '@immich/ui';
  import { mdiTune } from '@mdi/js';
  import type { DateTime } from 'luxon';
  import { t } from 'svelte-i18n';
  import { SvelteSet } from 'svelte/reactivity';

  type Props = {
    searchQuery: MetadataSearchDto | SmartSearchDto;
    onClose: (search?: SmartSearchDto | MetadataSearchDto) => void;
  };

  let { searchQuery, onClose }: Props = $props();

  const parseOptionalDate = (dateString?: DateTime) => (dateString ? parseUtcDate(dateString.toString()) : undefined);
  const toStartOfDayDate = (dateString: string) => parseUtcDate(dateString)?.startOf('day') || undefined;
  const formId = generateId();

  // combobox and all the search components have terrible support for value | null so we use empty string instead.
  function withNullAsUndefined<T>(value: T | null) {
    return value === null ? undefined : value;
  }

  const asFilter = (searchQuery: SmartSearchDto | MetadataSearchDto): SearchFilter => {
    return {
      query: ('query' in searchQuery && searchQuery.query) || '',
      textFilters: {
        filename: 'originalFileName' in searchQuery ? searchQuery.originalFileName || '' : '',
        description: ('description' in searchQuery && searchQuery.description) || '',
        ocr: searchQuery.ocr || '',
      },
      queryAssetId: 'queryAssetId' in searchQuery ? searchQuery.queryAssetId : undefined,
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
        lensModel: withNullAsUndefined(searchQuery.lensModel),
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
    };
  };

  let filter: SearchFilter = $state(asFilter(searchQuery));

  const resetForm = () => {
    filter = {
      query: '',
      textFilters: {
        filename: '',
        description: '',
        ocr: '',
      },
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
    const originalFileName = filter.textFilters.filename || undefined;
    const description = filter.textFilters.description || undefined;
    const ocr = filter.textFilters.ocr || undefined;

    let payload: SmartSearchDto | MetadataSearchDto = {
      query,
      queryAssetId: filter.queryAssetId || undefined,
      ocr,
      originalFileName,
      description,
      country: filter.location.country,
      state: filter.location.state,
      city: filter.location.city,
      make: filter.camera.make,
      model: filter.camera.model,
      lensModel: filter.camera.lensModel,
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
    search();
  };
</script>

<Modal icon={mdiTune} size="giant" title={$t('search_options')} {onClose}>
  <ModalBody>
    <form id={formId} autocomplete="off" {onsubmit} {onreset}>
      <div class="flex flex-col gap-5 pb-10" tabindex="-1">
        <!-- SMART SEARCH -->
        <SearchTextSection bind:query={filter.query} />

        <!-- PEOPLE -->
        <SearchPeopleSection bind:selectedPeople={filter.personIds} />

        <!-- TEXT FILTERS -->
        <SearchTextFiltersSection bind:filters={filter.textFilters} />

        <!-- TAGS -->
        <SearchTagsSection bind:selectedTags={filter.tagIds} />

        <!-- LOCATION -->
        <SearchLocationSection bind:filters={filter.location} />

        <!-- CAMERA MODEL -->
        <SearchCameraSection bind:filters={filter.camera} />

        <!-- DATE RANGE -->
        <SearchDateSection bind:filters={filter.date} />

        <!-- RATING -->
        {#if authManager.authenticated && authManager.preferences.ratings.enabled}
          <SearchRatingsSection bind:rating={filter.rating} />
        {/if}

        <div class="grid gap-x-5 gap-y-5 md:grid-cols-2 md:gap-y-10">
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
