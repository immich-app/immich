<script lang="ts">
  import SearchHistorySection from './SearchHistorySection.svelte';
  import { t } from 'svelte-i18n';
  import { fly } from 'svelte/transition';
  import { Button, Text } from '@immich/ui';
  import {
    mdiAccount,
    mdiCalendarBlank,
    mdiChevronDown,
    mdiChevronUp,
    mdiImage,
    mdiMagnify,
    mdiMapMarker,
    mdiTagMultiple,
    mdiTune,
  } from '@mdi/js';
  import SearchLocationSection from './SearchLocationSection.svelte';
  import type { SearchFilter } from '$lib/types';
  import {
    AssetTypeEnum,
    AssetVisibility,
    getAllTags,
    type MetadataSearchDto,
    type PersonResponseDto,
    type SmartSearchDto,
    type TagResponseDto,
  } from '@immich/sdk';
  import { MediaType, QueryType, validQueryTypes } from '$lib/constants';
  import { SvelteSet } from 'svelte/reactivity';
  import { asLocalTimeISO, parseUtcDate } from '$lib/utils/date-time';
  import SearchMediaSection from './SearchMediaSection.svelte';
  import SearchCameraSection from './SearchCameraSection.svelte';
  import SearchDateSection from './SearchDateSection.svelte';
  import SearchPeopleSection from './SearchPeopleSection.svelte';
  import SearchTagsSection from './SearchTagsSection.svelte';
  import SearchTextSection from './SearchTextSection.svelte';
  import SearchDisplaySection from './SearchDisplaySection.svelte';
  import SearchRatingsSection from './SearchRatingsSection.svelte';
  import type { DateTime } from 'luxon';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import {
    getPeople,
    getSearchDatePreset,
    searchDateTitle,
    searchMediaTitle,
    searchPeopleTitle,
    searchPlacesTitle,
    searchTagsTitle,
    searchTypeTitle,
  } from './search-bar-utils';
  import { onMount } from 'svelte';

  interface Props {
    id: string;
    searchBoxText?: string;
    isOpen?: boolean;
    searchQuery: MetadataSearchDto | SmartSearchDto;
    onSelectSearchTerm: (searchTerm: string) => void;
    onClearSearchTerm: (searchTerm: string) => void;
    onClearAllSearchTerms: () => void;
    onActiveSelectionChange: (selectedId: string | undefined) => void;
    onSearch: () => void;
  }

  let {
    id,
    searchBoxText = '',
    isOpen = false,
    searchQuery,
    onSelectSearchTerm,
    onClearSearchTerm,
    onClearAllSearchTerms,
    onActiveSelectionChange,
    onSearch,
  }: Props = $props();

  let searchHistory = $state<SearchHistorySection>();

  export function moveSelection(increment: 1 | -1) {
    if (searchHistory) {
      searchHistory.moveSelection(increment);
    }
  }

  export function clearSelection() {
    if (searchHistory) {
      searchHistory.clearSelection();
    }
  }

  export function selectActiveOption() {
    if (searchHistory) {
      searchHistory.selectActiveOption();
    }
  }

  const toStartOfDayDate = (dateString: string) => parseUtcDate(dateString)?.startOf('day') || undefined;

  // combobox and all the search components have terrible support for value | null so we use empty string instead.
  const withNullAsEmptyString = <T,>(value: T | null) => (value === null ? '' : value);

  const emptyStringToNull = (value: string | undefined) => (value === '' ? null : value);

  function defaultQueryType(): QueryType {
    const storedQueryType = localStorage.getItem('searchQueryType') as QueryType;
    return validQueryTypes.has(storedQueryType) ? storedQueryType : QueryType.SMART;
  }

  const asFilter = (searchQuery: SmartSearchDto | MetadataSearchDto): SearchFilter => {
    let query = 'query' in searchQuery && searchQuery.query ? searchQuery.query : '';

    if ('originalFileName' in searchQuery && searchQuery.originalFileName) {
      query = searchQuery.originalFileName;
    }

    if ('originalPath' in searchQuery && searchQuery.originalPath) {
      query = searchQuery.originalPath;
    }

    return {
      query,
      ocr: searchQuery.ocr,
      queryType: defaultQueryType(),
      queryAssetId: 'queryAssetId' in searchQuery ? searchQuery.queryAssetId : undefined,
      personIds: new SvelteSet('personIds' in searchQuery ? searchQuery.personIds : []),
      tagIds:
        'tagIds' in searchQuery
          ? searchQuery.tagIds === null
            ? null
            : new SvelteSet(searchQuery.tagIds)
          : new SvelteSet(),
      location: {
        country: withNullAsEmptyString(searchQuery.country),
        state: withNullAsEmptyString(searchQuery.state),
        city: withNullAsEmptyString(searchQuery.city),
      },
      camera: {
        make: withNullAsEmptyString(searchQuery.make),
        model: withNullAsEmptyString(searchQuery.model),
        lensModel: withNullAsEmptyString(searchQuery.lensModel),
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

  export const getQuery: () => SmartSearchDto | MetadataSearchDto = () => {
    let type: AssetTypeEnum | undefined = undefined;
    if (filter.mediaType === MediaType.Image) {
      type = AssetTypeEnum.Image;
    } else if (filter.mediaType === MediaType.Video) {
      type = AssetTypeEnum.Video;
    }

    const query = filter.query || undefined;

    return {
      query: filter.queryType === 'smart' ? query : undefined,
      queryAssetId: filter.queryAssetId || undefined,
      ocr: filter.queryType === 'ocr' ? query : undefined,
      originalFileName: filter.queryType === 'metadata' ? query : undefined,
      description: filter.queryType === 'description' ? query : undefined,
      originalPath: filter.queryType === 'fullPath' ? filter.query.trim() || undefined : undefined,
      country: emptyStringToNull(filter.location.country),
      state: emptyStringToNull(filter.location.state),
      city: emptyStringToNull(filter.location.city),
      make: emptyStringToNull(filter.camera.make),
      model: emptyStringToNull(filter.camera.model),
      lensModel: emptyStringToNull(filter.camera.lensModel),
      takenAfter: filter.date.takenAfter
        ? asLocalTimeISO(filter.date.takenAfter.startOf('day') as DateTime<true>)
        : undefined,
      takenBefore: filter.date.takenBefore
        ? asLocalTimeISO(filter.date.takenBefore.endOf('day') as DateTime<true>)
        : undefined,
      visibility: filter.display.isArchive ? AssetVisibility.Archive : undefined,
      isFavorite: filter.display.isFavorite || undefined,
      isNotInAlbum: filter.display.isNotInAlbum || undefined,
      personIds: filter.personIds.size > 0 ? [...filter.personIds] : undefined,
      tagIds: filter.tagIds === null ? null : filter.tagIds.size > 0 ? [...filter.tagIds] : undefined,
      type,
      rating: filter.rating,
    };
  };

  export const getSearchType = () => filter.queryType;

  let filter: SearchFilter = $state(asFilter(searchQuery));
  let activeFilter: string = $state('type');
  let people: Promise<PersonResponseDto[]> | undefined = $state(undefined);
  let tags: Promise<TagResponseDto[]> | undefined = $state(undefined);

  let typeTitle: string | undefined = $state(searchTypeTitle(filter.queryType));
  let peopleTitle: string | undefined = $state(undefined);
  let dateTitle: string | undefined = $state(
    searchDateTitle(
      getSearchDatePreset(filter.date.takenAfter, filter.date.takenBefore),
      filter.date.takenAfter,
      filter.date.takenBefore,
    ),
  );
  let placesTitle: string | undefined = $state(
    searchPlacesTitle(filter.location.city, filter.location.state, filter.location.country),
  );
  let tagsTitle: string | undefined = $state(undefined);
  let mediaTitle: string | undefined = $state(searchMediaTitle(filter.mediaType));

  let filters = [
    {
      name: 'type',
      icon: mdiMagnify,
      title: $t('search_type'),
      activeTitle: () => typeTitle,
    },
    {
      name: 'people',
      icon: mdiAccount,
      title: $t('people'),
      activeTitle: () => peopleTitle,
    },
    {
      name: 'date',
      icon: mdiCalendarBlank,
      title: $t('date'),
      activeTitle: () => dateTitle,
    },
    {
      name: 'places',
      icon: mdiMapMarker,
      title: $t('places'),
      activeTitle: () => placesTitle,
    },
    ...(authManager.authenticated && authManager.preferences.tags.enabled
      ? [
          {
            name: 'tags',
            icon: mdiTagMultiple,
            title: $t('tags'),
            activeTitle: () => tagsTitle,
          },
        ]
      : []),
    {
      name: 'media',
      icon: mdiImage,
      title: $t('media'),
      activeTitle: () => mediaTitle,
    },
  ];

  const advancedFiltersSet = $derived(
    filter.display.isArchive || filter.display.isFavorite || filter.display.isNotInAlbum || filter.rating,
  );

  const clear = () => {
    filter = asFilter({});
    typeTitle = peopleTitle = dateTitle = placesTitle = tagsTitle = mediaTitle = undefined;
  };

  onMount(() => {
    if (filter.personIds.size > 0) {
      if (!people) {
        people = getPeople(filter.personIds);
      }

      void people.then((res) => {
        peopleTitle = searchPeopleTitle(res, filter.personIds);
      });
    }

    if (filter.tagIds?.size) {
      if (!tags) {
        tags = getAllTags();
      }

      void tags.then((res) => {
        tagsTitle = searchTagsTitle(res, filter.tagIds!);
      });
    }
  });
</script>

<div role="listbox" {id}>
  {#if isOpen}
    <div
      transition:fly={{ y: 25, duration: 150 }}
      class="absolute z-1 w-full rounded-b-3xl bg-white shadow-[0_8px_20px_rgba(0,0,0,0.12)] transition-all dark:bg-immich-dark-gray dark:text-gray-300"
    >
      <SearchHistorySection
        bind:this={searchHistory}
        {searchBoxText}
        {onSelectSearchTerm}
        {onClearSearchTerm}
        {onClearAllSearchTerms}
        {onActiveSelectionChange}
      />
      <div class="px-5">
        <Text class="py-5" fontWeight="medium" aria-hidden={true}>{$t('filter_by')}</Text>
        <div class="flex flex-wrap gap-2">
          {#each filters as item (item.name)}
            <Button
              shape="round"
              color={activeFilter === item.name || item.activeTitle() ? 'primary' : 'secondary'}
              variant="outline"
              leadingIcon={item.icon}
              onclick={() => (activeFilter = item.name)}
              class="{activeFilter === item.name || item.activeTitle() ? undefined : 'bg-transparent'}
              {activeFilter === item.name ? 'border-2' : undefined}"
              >{item.activeTitle() ?? item.title}
            </Button>
          {/each}
        </div>
      </div>
      {#if activeFilter === 'advanced'}
        <div class="my-5 h-px w-full bg-light-200 dark:bg-dark-600"></div>
        <div class="px-5">
          <SearchCameraSection bind:filters={filter.camera} />
          {#if authManager.authenticated && authManager.preferences.ratings.enabled}
            <SearchRatingsSection bind:rating={filter.rating} />
          {/if}
          <SearchDisplaySection bind:filters={filter.display} />
        </div>
      {:else if activeFilter}
        <div class="px-5 pt-5">
          {#if activeFilter === 'type'}
            <SearchTextSection bind:title={typeTitle} bind:queryType={filter.queryType} />
          {:else if activeFilter === 'people'}
            <SearchPeopleSection
              bind:title={peopleTitle}
              bind:selectedPeople={filter.personIds}
              parentPromise={people}
            />
          {:else if activeFilter === 'date'}
            <SearchDateSection bind:title={dateTitle} bind:filters={filter.date} />
          {:else if activeFilter === 'places'}
            <SearchLocationSection bind:title={placesTitle} bind:filters={filter.location} />
          {:else if activeFilter === 'tags'}
            <SearchTagsSection bind:title={tagsTitle} bind:selectedTags={filter.tagIds} parentPromise={tags} />
          {:else if activeFilter === 'media'}
            <SearchMediaSection bind:title={mediaTitle} bind:filteredMedia={filter.mediaType} />
          {/if}
        </div>
      {/if}
      <div class="my-5 h-px w-full bg-light-200 dark:bg-dark-600"></div>
      <div class="flex gap-2 px-5 pb-5">
        <Button
          variant={advancedFiltersSet ? 'outline' : 'ghost'}
          leadingIcon={mdiTune}
          trailingIcon={activeFilter === 'advanced' ? mdiChevronUp : mdiChevronDown}
          onclick={() => (activeFilter = activeFilter === 'advanced' ? '' : 'advanced')}
          >{$t('advanced_filters')}</Button
        >
        <div class="flex-1"></div>
        <Button shape="round" variant="outline" color="secondary" class="bg-transparent" onclick={() => clear()}
          >{$t('clear_all')}</Button
        >
        <Button shape="round" onclick={() => onSearch()}>{$t('search')}</Button>
      </div>
    </div>
  {/if}
</div>
