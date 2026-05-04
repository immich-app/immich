<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import ActionMenuItem from '$lib/components/ActionMenuItem.svelte';
  import ActiveFiltersBar from '$lib/components/filter-panel/active-filters-bar.svelte';
  import FilterPanel from '$lib/components/filter-panel/filter-panel.svelte';
  import SmartSearchResults from '$lib/components/search/smart-search-results.svelte';
  import {
    buildFilterContext,
    clearFilters,
    createFilterState,
    getActiveFilterCount,
    type FilterPanelConfig,
    type FilterState,
  } from '$lib/components/filter-panel/filter-panel';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import ButtonContextMenu from '$lib/components/shared-components/context-menu/button-context-menu.svelte';
  import EmptyPlaceholder from '$lib/components/shared-components/empty-placeholder.svelte';
  import ArchiveAction from '$lib/components/timeline/actions/ArchiveAction.svelte';
  import ChangeDate from '$lib/components/timeline/actions/ChangeDateAction.svelte';
  import ChangeDescription from '$lib/components/timeline/actions/ChangeDescriptionAction.svelte';
  import ChangeLocation from '$lib/components/timeline/actions/ChangeLocationAction.svelte';
  import CreateSharedLink from '$lib/components/timeline/actions/CreateSharedLinkAction.svelte';
  import DeleteAssets from '$lib/components/timeline/actions/DeleteAssetsAction.svelte';
  import DownloadAction from '$lib/components/timeline/actions/DownloadAction.svelte';
  import FavoriteAction from '$lib/components/timeline/actions/FavoriteAction.svelte';
  import LinkLivePhotoAction from '$lib/components/timeline/actions/LinkLivePhotoAction.svelte';
  import RotateAction from '$lib/components/timeline/actions/RotateAction.svelte';
  import SelectAllAssets from '$lib/components/timeline/actions/SelectAllAction.svelte';
  import SetVisibilityAction from '$lib/components/timeline/actions/SetVisibilityAction.svelte';
  import StackAction from '$lib/components/timeline/actions/StackAction.svelte';
  import TagAction from '$lib/components/timeline/actions/TagAction.svelte';
  import AssetSelectControlBar from '$lib/components/timeline/AssetSelectControlBar.svelte';
  import Timeline from '$lib/components/timeline/Timeline.svelte';
  import { AssetAction } from '$lib/constants';
  import { assetMultiSelectManager } from '$lib/managers/asset-multi-select-manager.svelte';
  import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { registerSelectionContext } from '$lib/managers/command-context-manager.svelte';
  import { globalSearchManager } from '$lib/managers/global-search-manager.svelte';
  import { memoryManager } from '$lib/managers/memory-manager.svelte';
  import { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
  import { Route } from '$lib/route';
  import { getAssetBulkActions } from '$lib/services/asset.service';
  import { lang } from '$lib/stores/preferences.store';
  import { getAssetMediaUrl, memoryLaneTitle } from '$lib/utils';
  import {
    buildSearchablePageUrl,
    getSearchablePageFilterState,
    getSearchablePageState,
    preserveTransientTemporalFilters,
    type SearchablePageTransientTemporalState,
  } from '$lib/utils/searchable-page-search';
  import { consumeTypedSearchNamesInto } from '$lib/utils/typed-search/typed-search-name-cache';
  import {
    updateStackedAssetInTimeline,
    updateUnstackedAssetInTimeline,
    type OnLink,
    type OnUnlink,
  } from '$lib/utils/actions';
  import { openFileUploadDialog } from '$lib/utils/file-uploader';
  import {
    buildPhotosTimelineOptions,
    getPhotosPersonFilterThumbnailUrl,
    handlePhotosRemoveFilter,
  } from '$lib/utils/photos-filter-options';
  import {
    buildSmartSearchFacetKey,
    buildSmartSearchFacetsParams,
    mapSmartSearchFacetsToFilterSuggestions,
  } from '$lib/utils/space-search';
  import { getAltText } from '$lib/utils/thumbnail-util';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
  import {
    AssetTypeEnum,
    getFilterSuggestions,
    getSearchSuggestions,
    searchSmartFacets,
    SearchSuggestionType,
    type SmartSearchFacetsResponseDto,
  } from '@immich/sdk';
  import { ActionButton, CommandPaletteDefaultProvider, ImageCarousel } from '@immich/ui';
  import { mdiDotsVertical } from '@mdi/js';
  import { untrack } from 'svelte';
  import { t } from 'svelte-i18n';
  import { SvelteMap } from 'svelte/reactivity';

  let timelineManager = $state<TimelineManager>() as TimelineManager;

  // Filter state
  const initialSearchState = getSearchablePageState(page.url);
  const initialFilterState = getSearchablePageFilterState(page.url);
  let filters = $state<FilterState>({
    ...createFilterState(),
    ...initialFilterState,
    sortOrder: initialSearchState.sortOrder,
  });
  let committedQuery = $state(initialSearchState.query);
  let lastHandledSearchState = $state(`${initialSearchState.query}:${initialSearchState.sortOrder}:${page.url.search}`);
  let pendingFilterUrlSync = $state<
    { url: string; transientTemporal?: SearchablePageTransientTemporalState } | undefined
  >();
  let isLoading = $state(false);
  const showSearchResults = $derived(committedQuery.trim().length > 0);
  const options = $derived(buildPhotosTimelineOptions(filters));
  let personNames = new SvelteMap<string, string>();
  let tagNames = new SvelteMap<string, string>();
  consumeTypedSearchNamesInto(page.url.pathname + page.url.search, personNames, tagNames);
  $effect(() => globalSearchManager.registerSearchablePageFilters(() => filters));
  let smartFacets = $state<SmartSearchFacetsResponseDto>();
  let smartFacetKey = $state('');
  let smartFacetInFlight:
    | {
        key: string;
        controller: AbortController;
        promise: Promise<SmartSearchFacetsResponseDto | undefined>;
      }
    | undefined;

  const timelineBuckets = $derived(
    timelineManager?.months?.map((m) => ({
      timeBucket: `${m.yearMonth.year}-${String(m.yearMonth.month).padStart(2, '0')}-01T00:00:00.000Z`,
      count: m.assetsCount,
    })) ?? [],
  );
  const smartFacetBuckets = $derived(showSearchResults ? (smartFacets?.timeBuckets ?? []) : timelineBuckets);
  const smartFacetTotal = $derived(showSearchResults ? smartFacets?.total : undefined);

  const emptyFilterSuggestions = () => ({
    countries: [],
    cities: [],
    cameraMakes: [],
    cameraModels: [],
    tags: [],
    people: [],
    ratings: [],
    mediaTypes: [],
    hasUnnamedPeople: false,
  });

  const loadPhotoFilterSuggestions = async (nextFilters: FilterState) => {
    const context = buildFilterContext(nextFilters);
    const response = await getFilterSuggestions({
      personIds: nextFilters.personIds.length > 0 ? nextFilters.personIds : undefined,
      country: nextFilters.country,
      city: nextFilters.city,
      make: nextFilters.make,
      model: nextFilters.model,
      tagIds: nextFilters.tagIds.length > 0 ? nextFilters.tagIds : undefined,
      rating: nextFilters.rating,
      mediaType:
        nextFilters.mediaType === 'all'
          ? undefined
          : nextFilters.mediaType === 'image'
            ? AssetTypeEnum.Image
            : AssetTypeEnum.Video,
      isFavorite: nextFilters.isFavorite,
      takenAfter: context?.takenAfter,
      takenBefore: context?.takenBefore,
      ...(nextFilters.isFavorite === undefined ? { withSharedSpaces: true } : {}),
    });
    const mappedPeople = response.people.map((p) => ({
      id: p.id,
      name: p.name,
      thumbnailUrl: getPhotosPersonFilterThumbnailUrl(p),
    }));
    for (const p of response.people) {
      personNames.set(p.id, p.name);
    }
    for (const t of response.tags) {
      tagNames.set(t.id, t.value);
    }
    return {
      countries: response.countries,
      cameraMakes: response.cameraMakes,
      tags: response.tags.map((t) => ({ id: t.id, name: t.value })),
      people: mappedPeople,
      ratings: response.ratings,
      mediaTypes: response.mediaTypes,
      hasUnnamedPeople: response.hasUnnamedPeople,
    };
  };

  async function loadPhotoSmartFacets(nextFilters: FilterState): Promise<SmartSearchFacetsResponseDto | undefined> {
    const query = committedQuery.trim();
    if (!query) {
      return undefined;
    }

    const withSharedSpaces = nextFilters.isFavorite === undefined;
    const key = buildSmartSearchFacetKey({ query, filters: nextFilters, withSharedSpaces, language: $lang });
    if (smartFacets && smartFacetKey === key) {
      return smartFacets;
    }
    if (smartFacetInFlight?.key === key) {
      return smartFacetInFlight.promise;
    }

    smartFacetInFlight?.controller.abort();
    const controller = new AbortController();

    const promise = searchSmartFacets(
      {
        smartSearchFacetsDto: buildSmartSearchFacetsParams({
          query,
          filters: nextFilters,
          withSharedSpaces,
          language: $lang,
        }),
      },
      { signal: controller.signal },
    )
      .then((result) => {
        if (smartFacetInFlight?.key === key && !controller.signal.aborted) {
          smartFacets = result;
          smartFacetKey = key;
        }
        return result;
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          console.error('Failed to fetch smart search facets:', error);
        }
        return smartFacets;
      })
      .finally(() => {
        if (smartFacetInFlight?.key === key) {
          smartFacetInFlight = undefined;
        }
      });

    smartFacetInFlight = { key, controller, promise };
    return promise;
  }

  const normalProviders: NonNullable<FilterPanelConfig['providers']> = {
    cities: (country, context) =>
      getSearchSuggestions({
        $type: SearchSuggestionType.City,
        country,
        ...context,
        ...(context?.isFavorite === undefined ? { withSharedSpaces: true } : {}),
      }),
    cameraModels: (make, context) =>
      getSearchSuggestions({
        $type: SearchSuggestionType.CameraModel,
        make,
        ...context,
        ...(context?.isFavorite === undefined ? { withSharedSpaces: true } : {}),
      }),
  };

  const filterConfig: FilterPanelConfig = {
    sections: ['timeline', 'people', 'location', 'camera', 'tags', 'rating', 'media', 'favorites'],
    suggestionsProvider: async (nextFilters: FilterState) => {
      if (!showSearchResults) {
        return loadPhotoFilterSuggestions(nextFilters);
      }

      const facets = await loadPhotoSmartFacets(nextFilters);
      if (!facets) {
        return emptyFilterSuggestions();
      }

      for (const p of facets.people) {
        personNames.set(p.id, p.name);
      }
      for (const t of facets.tags) {
        tagNames.set(t.id, t.value);
      }
      return mapSmartSearchFacetsToFilterSuggestions(facets);
    },
    providers: {
      ...normalProviders,
      cities: async (country, context) => {
        if (!showSearchResults) {
          return normalProviders.cities?.(country, context) ?? [];
        }
        const query = committedQuery.trim();
        if (!query) {
          return [];
        }
        const facets = await searchSmartFacets({
          smartSearchFacetsDto: buildSmartSearchFacetsParams({
            query,
            filters: { ...filters, country },
            withSharedSpaces: filters.isFavorite === undefined,
            language: $lang,
          }),
        });
        return facets.cities;
      },
      cameraModels: async (make, context) => {
        if (!showSearchResults) {
          return normalProviders.cameraModels?.(make, context) ?? [];
        }
        const query = committedQuery.trim();
        if (!query) {
          return [];
        }
        const facets = await searchSmartFacets({
          smartSearchFacetsDto: buildSmartSearchFacetsParams({
            query,
            filters: { ...filters, make },
            withSharedSpaces: filters.isFavorite === undefined,
            language: $lang,
          }),
        });
        return facets.cameraModels;
      },
    },
  };

  const hasActiveFilters = $derived(getActiveFilterCount(filters) > 0 || showSearchResults);
  const totalAssetCount = $derived(timelineManager?.assetCount ?? 0);
  const isTimelineEmpty = $derived(timelineManager?.isInitialized && totalAssetCount === 0 && !hasActiveFilters);

  let selectedAssets = $derived(assetMultiSelectManager.assets);
  let isAssetStackSelected = $derived(selectedAssets.length === 1 && !!selectedAssets[0].stack);
  let isLinkActionAvailable = $derived.by(() => {
    const isLivePhoto = selectedAssets.length === 1 && !!selectedAssets[0].livePhotoVideoId;
    const isLivePhotoCandidate =
      selectedAssets.length === 2 &&
      selectedAssets.some((asset) => asset.isImage) &&
      selectedAssets.some((asset) => asset.isVideo);

    return assetMultiSelectManager.isAllUserOwned && (isLivePhoto || isLivePhotoCandidate);
  });

  const handleEscape = () => {
    if (assetViewerManager.isViewing) {
      return;
    }
    if (assetMultiSelectManager.selectionActive) {
      assetMultiSelectManager.clear();
      return;
    }
  };

  const handleLink: OnLink = ({ still, motion }) => {
    timelineManager.removeAssets([motion.id]);
    timelineManager.upsertAssets([still]);
  };

  const handleUnlink: OnUnlink = ({ still, motion }) => {
    timelineManager.upsertAssets([motion]);
    timelineManager.upsertAssets([still]);
  };

  const handleSetVisibility = (assetIds: string[]) => {
    timelineManager.removeAssets(assetIds);
    assetMultiSelectManager.clear();
  };

  registerSelectionContext({
    getAssets: () => assetMultiSelectManager.assets,
    clearSelection: () => assetMultiSelectManager.clear(),
    canAddToAlbum: () => true,
    canAddToSpace: () => true,
    getOnFavorite: () =>
      timelineManager
        ? (ids, isFavorite) => timelineManager.update(ids, (asset) => (asset.isFavorite = isFavorite))
        : undefined,
    getOnArchive: () =>
      timelineManager
        ? (ids, visibility) => timelineManager.update(ids, (asset) => (asset.visibility = visibility))
        : undefined,
    getOnDelete: () => (timelineManager ? (assetIds) => timelineManager.removeAssets(assetIds) : undefined),
    getOnUndoDelete: () => (timelineManager ? (assets) => timelineManager.upsertAssets(assets) : undefined),
  });

  function clearSearch() {
    isLoading = false;
    const nextUrl = buildSearchablePageUrl(page.url, '', filters.sortOrder, filters);
    if (!nextUrl) {
      return;
    }
    void goto(nextUrl, { replaceState: true, keepFocus: true, noScroll: true });
  }

  function syncFilterUrl(nextFilters: FilterState) {
    const currentSearchState = getSearchablePageState(page.url);
    const sortOrder =
      !committedQuery.trim() && nextFilters.sortOrder === 'desc' && !currentSearchState.hasExplicitSort
        ? 'relevance'
        : nextFilters.sortOrder;
    const nextUrl = buildSearchablePageUrl(page.url, committedQuery, sortOrder, nextFilters);
    if (!nextUrl || nextUrl === page.url.pathname + page.url.search) {
      return;
    }
    pendingFilterUrlSync = {
      url: nextUrl,
      transientTemporal: {
        selectedYear: nextFilters.selectedYear,
        selectedMonth: nextFilters.selectedMonth,
      },
    };
    void goto(nextUrl, { replaceState: true, keepFocus: true, noScroll: true });
  }

  $effect(() => {
    const nextSearchState = getSearchablePageState(page.url);
    const nextToken = `${nextSearchState.query}:${nextSearchState.sortOrder}:${page.url.search}`;
    const currentUrl = page.url.pathname + page.url.search;

    if (nextToken === lastHandledSearchState) {
      return;
    }

    const queryChanged = nextSearchState.query !== committedQuery;
    untrack(() => {
      const filterState = getSearchablePageFilterState(page.url);
      const transientTemporal =
        pendingFilterUrlSync?.url === currentUrl ? pendingFilterUrlSync.transientTemporal : undefined;
      committedQuery = nextSearchState.query;
      isLoading = false;
      filters = {
        ...createFilterState(),
        ...preserveTransientTemporalFilters(filterState, transientTemporal),
        sortOrder: nextSearchState.sortOrder,
      };
      if (pendingFilterUrlSync?.url === currentUrl) {
        pendingFilterUrlSync = undefined;
      }
      consumeTypedSearchNamesInto(page.url.pathname + page.url.search, personNames, tagNames);
      if (queryChanged) {
        smartFacetInFlight?.controller.abort();
        smartFacets = undefined;
        smartFacetKey = '';
        smartFacetInFlight = undefined;
      }
      lastHandledSearchState = nextToken;
    });
  });

  const items = $derived(
    memoryManager.memories.map((memory) => ({
      id: memory.id,
      title: $memoryLaneTitle(memory),
      href: Route.memoryViewer({ id: memory.assets[0].id }),
      alt: $t('memory_lane_title', { values: { title: $getAltText(toTimelineAsset(memory.assets[0])) } }),
      src: getAssetMediaUrl({ id: memory.assets[0].id }),
    })),
  );
</script>

<UserPageLayout hideNavbar={assetMultiSelectManager.selectionActive} scrollbar={false}>
  <div class="flex h-full">
    {#key showSearchResults ? `photos-search-${committedQuery.trim()}:${$lang}` : 'photos-browse'}
      <FilterPanel
        bind:filters
        config={filterConfig}
        timeBuckets={smartFacetBuckets}
        storageKey="gallery-filter-visible-sections-photos"
        hidden={isTimelineEmpty}
        {personNames}
        {tagNames}
        onFiltersChange={syncFilterUrl}
      />
    {/key}
    <div class="flex flex-1 flex-col overflow-hidden pl-4">
      {#if hasActiveFilters}
        <ActiveFiltersBar
          {filters}
          searchQuery={committedQuery}
          onClearSearch={clearSearch}
          resultCount={showSearchResults ? smartFacetTotal : totalAssetCount}
          {personNames}
          {tagNames}
          onRemoveFilter={(type, id) => {
            const nextFilters = handlePhotosRemoveFilter(filters, type, id);
            filters = nextFilters;
            syncFilterUrl(nextFilters);
          }}
          onClearAll={() => {
            const nextFilters = clearFilters(filters);
            filters = nextFilters;
            if (!committedQuery.trim()) {
              syncFilterUrl(nextFilters);
            }
          }}
        />
      {/if}
      {#if showSearchResults}
        <SmartSearchResults
          bind:isLoading
          searchQuery={committedQuery}
          {filters}
          language={$lang}
          isShared={false}
          withSharedSpaces={filters.isFavorite === undefined}
          total={smartFacetTotal}
        />
      {:else}
        <Timeline
          enableRouting={true}
          bind:timelineManager
          {options}
          assetInteraction={assetMultiSelectManager}
          removeAction={AssetAction.ARCHIVE}
          onEscape={handleEscape}
          withStacked
        >
          {#if authManager.preferences.memories.enabled && !hasActiveFilters}
            <ImageCarousel {items} />
          {/if}
          {#snippet empty()}
            <EmptyPlaceholder
              text={$t('no_assets_message')}
              onClick={() => openFileUploadDialog()}
              class="mt-10 mx-auto"
            />
          {/snippet}
        </Timeline>
      {/if}
    </div>
  </div>
</UserPageLayout>

{#if assetMultiSelectManager.selectionActive}
  <AssetSelectControlBar>
    {@const Actions = getAssetBulkActions($t)}
    <CommandPaletteDefaultProvider name={$t('assets')} actions={Object.values(Actions)} />

    <CreateSharedLink />
    <SelectAllAssets {timelineManager} assetInteraction={assetMultiSelectManager} />
    <ActionButton action={Actions.AddToAlbum} />

    {#if assetMultiSelectManager.isAllUserOwned}
      <FavoriteAction
        removeFavorite={assetMultiSelectManager.isAllFavorite}
        onFavorite={(ids, isFavorite) => timelineManager.update(ids, (asset) => (asset.isFavorite = isFavorite))}
      />

      <ButtonContextMenu icon={mdiDotsVertical} title={$t('menu')}>
        <DownloadAction menuItem />
        {#if assetMultiSelectManager.assets.length > 1 || isAssetStackSelected}
          <StackAction
            unstack={isAssetStackSelected}
            onStack={(result) => updateStackedAssetInTimeline(timelineManager, result)}
            onUnstack={(assets) => updateUnstackedAssetInTimeline(timelineManager, assets)}
          />
        {/if}
        {#if isLinkActionAvailable}
          <LinkLivePhotoAction
            menuItem
            unlink={assetMultiSelectManager.assets.length === 1}
            onLink={handleLink}
            onUnlink={handleUnlink}
          />
        {/if}
        <RotateAction />
        <ChangeDate menuItem />
        <ChangeDescription menuItem />
        <ChangeLocation menuItem />
        <ArchiveAction
          menuItem
          onArchive={(ids, visibility) => timelineManager.update(ids, (asset) => (asset.visibility = visibility))}
        />
        {#if authManager.preferences.tags.enabled}
          <TagAction menuItem />
        {/if}
        <DeleteAssets
          menuItem
          onAssetDelete={(assetIds) => timelineManager.removeAssets(assetIds)}
          onUndoDelete={(assets) => timelineManager.upsertAssets(assets)}
        />
        <SetVisibilityAction menuItem onVisibilitySet={handleSetVisibility} />
        <hr />
        <ActionMenuItem action={Actions.RegenerateThumbnailJob} />
        <ActionMenuItem action={Actions.RefreshMetadataJob} />
        <ActionMenuItem action={Actions.TranscodeVideoJob} />
      </ButtonContextMenu>
    {:else}
      <DownloadAction />
    {/if}
  </AssetSelectControlBar>
{/if}
