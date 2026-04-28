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
  import { memoryManager } from '$lib/managers/memory-manager.svelte';
  import { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
  import { Route } from '$lib/route';
  import { getAssetBulkActions } from '$lib/services/asset.service';
  import { createUrl, getAssetMediaUrl, memoryLaneTitle } from '$lib/utils';
  import { buildSearchablePageUrl, getSearchablePageState } from '$lib/utils/searchable-page-search';
  import {
    updateStackedAssetInTimeline,
    updateUnstackedAssetInTimeline,
    type OnLink,
    type OnUnlink,
  } from '$lib/utils/actions';
  import { openFileUploadDialog } from '$lib/utils/file-uploader';
  import { buildPhotosTimelineOptions, handlePhotosRemoveFilter } from '$lib/utils/photos-filter-options';
  import { getAltText } from '$lib/utils/thumbnail-util';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
  import { AssetTypeEnum, getFilterSuggestions, getSearchSuggestions, SearchSuggestionType } from '@immich/sdk';
  import { ActionButton, CommandPaletteDefaultProvider, ImageCarousel } from '@immich/ui';
  import { mdiDotsVertical } from '@mdi/js';
  import { untrack } from 'svelte';
  import { t } from 'svelte-i18n';
  import { SvelteMap } from 'svelte/reactivity';

  let timelineManager = $state<TimelineManager>() as TimelineManager;

  // Filter state
  const initialSearchState = getSearchablePageState(page.url);
  let filters = $state<FilterState>({
    ...createFilterState(),
    sortOrder: initialSearchState.sortOrder,
  });
  let committedQuery = $state(initialSearchState.query);
  let lastHandledSearchState = $state(`${initialSearchState.query}:${initialSearchState.sortOrder}`);
  let isLoading = $state(false);
  const showSearchResults = $derived(committedQuery.trim().length > 0);
  const options = $derived(buildPhotosTimelineOptions(filters));
  let personNames = new SvelteMap<string, string>();
  let tagNames = new SvelteMap<string, string>();

  const filterConfig: FilterPanelConfig = {
    sections: ['timeline', 'people', 'location', 'camera', 'tags', 'rating', 'media', 'favorites'],
    suggestionsProvider: async (filters: FilterState) => {
      const context = buildFilterContext(filters);
      const response = await getFilterSuggestions({
        personIds: filters.personIds.length > 0 ? filters.personIds : undefined,
        country: filters.country,
        city: filters.city,
        make: filters.make,
        model: filters.model,
        tagIds: filters.tagIds.length > 0 ? filters.tagIds : undefined,
        rating: filters.rating,
        mediaType:
          filters.mediaType === 'all'
            ? undefined
            : filters.mediaType === 'image'
              ? AssetTypeEnum.Image
              : AssetTypeEnum.Video,
        isFavorite: filters.isFavorite,
        takenAfter: context?.takenAfter,
        takenBefore: context?.takenBefore,
        ...(filters.isFavorite === undefined ? { withSharedSpaces: true } : {}),
      });
      const mappedPeople = response.people.map((p) => ({
        id: p.id,
        name: p.name,
        thumbnailUrl: createUrl(`/people/${p.id}/thumbnail`),
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
    },
    providers: {
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
    const nextUrl = buildSearchablePageUrl(page.url, '');
    if (!nextUrl) {
      return;
    }
    void goto(nextUrl, { replaceState: true, keepFocus: true, noScroll: true });
  }

  $effect(() => {
    const nextSearchState = getSearchablePageState(page.url);
    const nextToken = `${nextSearchState.query}:${nextSearchState.sortOrder}`;

    if (nextToken === lastHandledSearchState) {
      return;
    }

    untrack(() => {
      committedQuery = nextSearchState.query;
      isLoading = false;
      filters = { ...filters, sortOrder: nextSearchState.sortOrder };
      lastHandledSearchState = nextToken;
    });
  });

  const items = $derived(
    memoryManager.memories.map((memory) => ({
      id: memory.id,
      title: $memoryLaneTitle(memory),
      href: Route.memories({ id: memory.assets[0].id }),
      alt: $t('memory_lane_title', { values: { title: $getAltText(toTimelineAsset(memory.assets[0])) } }),
      src: getAssetMediaUrl({ id: memory.assets[0].id }),
    })),
  );
</script>

<UserPageLayout hideNavbar={assetMultiSelectManager.selectionActive} scrollbar={false}>
  <div class="flex h-full">
    <FilterPanel
      bind:filters
      config={filterConfig}
      timeBuckets={timelineManager?.months?.map((m) => ({
        timeBucket: `${m.yearMonth.year}-${String(m.yearMonth.month).padStart(2, '0')}-01T00:00:00.000Z`,
        count: m.assetsCount,
      })) ?? []}
      storageKey="gallery-filter-visible-sections-photos"
      hidden={isTimelineEmpty}
    />
    <div class="flex flex-1 flex-col overflow-hidden pl-4">
      {#if hasActiveFilters}
        <ActiveFiltersBar
          {filters}
          searchQuery={committedQuery}
          onClearSearch={clearSearch}
          resultCount={showSearchResults ? undefined : totalAssetCount}
          {personNames}
          {tagNames}
          onRemoveFilter={(type, id) => {
            filters = handlePhotosRemoveFilter(filters, type, id);
          }}
          onClearAll={() => {
            filters = clearFilters(filters);
          }}
        />
      {/if}
      {#if showSearchResults}
        <SmartSearchResults
          bind:isLoading
          searchQuery={committedQuery}
          {filters}
          isShared={false}
          withSharedSpaces={filters.isFavorite === undefined}
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
