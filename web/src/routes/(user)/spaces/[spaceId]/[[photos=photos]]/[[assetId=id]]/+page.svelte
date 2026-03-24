<script lang="ts">
  import { goto } from '$app/navigation';
  import FilterPanel from '$lib/components/filter-panel/filter-panel.svelte';
  import ActiveFiltersBar from '$lib/components/filter-panel/active-filters-bar.svelte';
  import SortToggle from '$lib/components/filter-panel/sort-toggle.svelte';
  import {
    createFilterState,
    clearFilters,
    getActiveFilterCount,
    type FilterPanelConfig,
  } from '$lib/components/filter-panel/filter-panel';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import ControlAppBar from '$lib/components/shared-components/control-app-bar.svelte';
  import ButtonContextMenu from '$lib/components/shared-components/context-menu/button-context-menu.svelte';
  import SpaceHero from '$lib/components/spaces/space-hero.svelte';
  import SpaceMap from '$lib/components/spaces/space-map.svelte';
  import SpaceNewAssetsDivider from '$lib/components/spaces/space-new-assets-divider.svelte';
  import SpaceOnboardingBanner from '$lib/components/spaces/space-onboarding-banner.svelte';
  import SpacePanel from '$lib/components/spaces/space-panel.svelte';
  import SpacePeopleStrip from '$lib/components/spaces/space-people-strip.svelte';
  import SearchBar from '$lib/elements/SearchBar.svelte';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import ArchiveAction from '$lib/components/timeline/actions/ArchiveAction.svelte';
  import ChangeDate from '$lib/components/timeline/actions/ChangeDateAction.svelte';
  import ChangeDescription from '$lib/components/timeline/actions/ChangeDescriptionAction.svelte';
  import ChangeLocation from '$lib/components/timeline/actions/ChangeLocationAction.svelte';
  import DownloadAction from '$lib/components/timeline/actions/DownloadAction.svelte';
  import FavoriteAction from '$lib/components/timeline/actions/FavoriteAction.svelte';
  import RemoveFromSpaceAction from '$lib/components/timeline/actions/RemoveFromSpaceAction.svelte';
  import SelectAllAssets from '$lib/components/timeline/actions/SelectAllAction.svelte';
  import TagAction from '$lib/components/timeline/actions/TagAction.svelte';
  import AssetSelectControlBar from '$lib/components/timeline/AssetSelectControlBar.svelte';
  import Timeline from '$lib/components/timeline/Timeline.svelte';
  import { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
  import { eventManager } from '$lib/managers/event-manager.svelte';
  import { Route } from '$lib/route';
  import { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import { preferences, user } from '$lib/stores/user.store';
  import { cancelMultiselect } from '$lib/utils/asset-utils';
  import { handleError } from '$lib/utils/handle-error';
  import LoadingSpinner from '$lib/components/shared-components/LoadingSpinner.svelte';
  import {
    addAssets,
    AssetOrder,
    AssetTypeEnum,
    AssetVisibility,
    getAllTags,
    getMembers,
    getSearchSuggestions,
    getSpace,
    getSpaceActivities,
    getSpacePeople,
    markSpaceViewed,
    removeSpace,
    Role,
    SearchSuggestionType,
    searchSmart,
    updateMemberTimeline,
    updateSpace,
    UserAvatarColor,
    type AssetResponseDto,
    type SharedSpaceActivityResponseDto,
    type SharedSpaceMemberResponseDto,
    type SharedSpacePersonResponseDto,
    type SharedSpaceResponseDto,
  } from '@immich/sdk';
  import { IconButton, modalManager, toastManager } from '@immich/ui';
  import {
    mdiAccountMultipleOutline,
    mdiArrowLeft,
    mdiDeleteOutline,
    mdiDotsVertical,
    mdiEyeOffOutline,
    mdiEyeOutline,
    mdiFaceRecognition,
    mdiImageOutline,
    mdiImagePlusOutline,
    mdiPlus,
  } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  type ViewMode = 'view' | 'select-assets' | 'select-cover';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
  let space: SharedSpaceResponseDto = $state(data.space);
  let members: SharedSpaceMemberResponseDto[] = $state(data.members);
  let viewMode = $state<ViewMode>('view');
  let panelOpen = $state(false);
  let repositioning = $state(false);

  let activities = $state<SharedSpaceActivityResponseDto[]>([]);
  let hasMoreActivities = $state(false);
  let activityOffset = $state(0);
  const ACTIVITY_PAGE_SIZE = 50;
  let initializedSpaceId = $state('');

  let spacePeople = $state<SharedSpacePersonResponseDto[]>([]);

  let timelineManager = $state<TimelineManager>() as TimelineManager;

  // Filter state
  let filters = $state(createFilterState());
  let personNames = $state(new Map<string, string>());
  let tagNames = $state(new Map<string, string>());

  let heroCollapsed = $state(false);
  let prevFilterCount = 0;

  $effect(() => {
    const count = getActiveFilterCount(filters);
    if (count > 0 && prevFilterCount === 0) {
      heroCollapsed = true;
    }
    prevFilterCount = count;
  });

  const filterConfig: FilterPanelConfig = {
    sections: ['timeline', 'people', 'location', 'camera', 'tags', 'rating', 'media'],
    providers: {
      people: async () => {
        const people = await getSpacePeople({ id: space.id });
        for (const p of people) {
          personNames.set(p.id, p.name || 'Unknown');
        }
        return people.map((p) => ({ id: p.id, name: p.name || 'Unknown', thumbnailPath: p.thumbnailPath }));
      },
      locations: async () => {
        const countries = await getSearchSuggestions({ $type: SearchSuggestionType.Country, spaceId: space.id });
        return countries.filter(Boolean).map((c) => ({ value: c!, type: 'country' as const }));
      },
      cameras: async () => {
        const makes = await getSearchSuggestions({ $type: SearchSuggestionType.CameraMake, spaceId: space.id });
        return makes.filter(Boolean).map((m) => ({ value: m!, type: 'make' as const }));
      },
      tags: async () => {
        const tags = await getAllTags();
        for (const t of tags) {
          tagNames.set(t.id, t.value);
        }
        return tags.map((t) => ({ id: t.id, name: t.value }));
      },
    },
  };

  function handleRemoveFilter(type: string, id?: string) {
    switch (type) {
      case 'person': {
        filters = { ...filters, personIds: filters.personIds.filter((p) => p !== id) };
        break;
      }
      case 'location': {
        filters = { ...filters, city: undefined, country: undefined };
        break;
      }
      case 'camera': {
        filters = { ...filters, make: undefined, model: undefined };
        break;
      }
      case 'tag': {
        filters = { ...filters, tagIds: filters.tagIds.filter((t) => t !== id) };
        break;
      }
      case 'rating': {
        filters = { ...filters, rating: undefined };
        break;
      }
      case 'media':
      case 'mediaType': {
        filters = { ...filters, mediaType: 'all' };
        break;
      }
    }
  }

  const assetInteraction = new AssetInteraction();
  const timelineInteraction = new AssetInteraction();

  const currentMember = $derived(members.find((m) => m.userId === $user.id));
  const isOwner = $derived(currentMember?.role === Role.Owner);
  const isEditor = $derived(currentMember?.role === Role.Owner || currentMember?.role === Role.Editor);
  const showInTimeline = $derived(currentMember?.showInTimeline ?? true);

  const totalAssetCount = $derived(timelineManager?.assetCount ?? 0);

  const options = $derived.by(() => {
    if (viewMode === 'select-assets') {
      return { visibility: AssetVisibility.Timeline, timelineSpaceId: space.id };
    }
    const base: Record<string, unknown> = { spaceId: space.id, withStacked: true };
    // Apply filter state — personIds maps to spacePersonIds for Spaces context
    if (filters.personIds.length > 0) {
      base.spacePersonIds = filters.personIds;
    }
    if (filters.city) {
      base.city = filters.city;
    }
    if (filters.country) {
      base.country = filters.country;
    }
    if (filters.make) {
      base.make = filters.make;
    }
    if (filters.model) {
      base.model = filters.model;
    }
    if (filters.tagIds.length > 0) {
      base.tagIds = filters.tagIds;
    }
    if (filters.rating !== undefined) {
      base.rating = filters.rating;
    }
    if (filters.mediaType !== 'all') {
      base.$type = filters.mediaType === 'image' ? AssetTypeEnum.Image : AssetTypeEnum.Video;
    }
    base.order = filters.sortOrder === 'asc' ? AssetOrder.Asc : AssetOrder.Desc;

    // Temporal date-range filtering
    if (filters.selectedYear && filters.selectedMonth) {
      const start = new Date(filters.selectedYear, filters.selectedMonth - 1, 1);
      const end = new Date(filters.selectedYear, filters.selectedMonth, 0, 23, 59, 59, 999);
      base.takenAfter = start.toISOString();
      base.takenBefore = end.toISOString();
    } else if (filters.selectedYear) {
      base.takenAfter = new Date(filters.selectedYear, 0, 1).toISOString();
      base.takenBefore = new Date(filters.selectedYear, 11, 31, 23, 59, 59, 999).toISOString();
    }

    return base;
  });

  const currentAssetInteraction = $derived(viewMode === 'select-assets' ? timelineInteraction : assetInteraction);
  const isSelectionMode = $derived(viewMode === 'select-assets' || viewMode === 'select-cover');

  const refreshSpace = async () => {
    space = await getSpace({ id: space.id });
  };

  async function loadActivities() {
    try {
      const result = await getSpaceActivities({ id: space.id, limit: ACTIVITY_PAGE_SIZE, offset: 0 });
      activities = result;
      hasMoreActivities = result.length === ACTIVITY_PAGE_SIZE;
      activityOffset = result.length;
    } catch (error) {
      handleError(error, 'Failed to load activities');
    }
  }

  async function loadMoreActivities() {
    try {
      const result = await getSpaceActivities({ id: space.id, limit: ACTIVITY_PAGE_SIZE, offset: activityOffset });
      activities = [...activities, ...result];
      hasMoreActivities = result.length === ACTIVITY_PAGE_SIZE;
      activityOffset += result.length;
    } catch (error) {
      handleError(error, 'Failed to load activities');
    }
  }

  async function loadSpacePeople() {
    if (!space.faceRecognitionEnabled) {
      spacePeople = [];
      return;
    }
    try {
      spacePeople = await getSpacePeople({ id: space.id });
    } catch (error) {
      handleError(error, 'Failed to load space people');
    }
  }

  const handlePersonClick = (personId: string) => {
    const current = filters.personIds;
    filters = {
      ...filters,
      personIds: current.includes(personId) ? current.filter((id) => id !== personId) : [...current, personId],
    };
  };

  const handleEscape = () => {
    if (showSearchResults) {
      clearSearch();
      return;
    }
    if (viewMode === 'select-assets') {
      handleCloseSelectAssets();
      return;
    }
    if (viewMode === 'select-cover') {
      handleCloseSelectCover();
      return;
    }
    if (assetInteraction.selectionActive) {
      cancelMultiselect(assetInteraction);
      return;
    }
    void goto(Route.spaces());
  };

  const handleCloseSelectAssets = () => {
    timelineInteraction.clearMultiselect();
    viewMode = 'view';
  };

  const handleCloseSelectCover = () => {
    assetInteraction.clearMultiselect();
    viewMode = 'view';
  };

  const handleReposition = () => {
    repositioning = true;
  };

  const handleSavePosition = async (cropY: number) => {
    try {
      await updateSpace({
        id: space.id,
        sharedSpaceUpdateDto: { thumbnailCropY: cropY },
      });
      space = { ...space, thumbnailCropY: cropY };
      repositioning = false;
      toastManager.success($t('space_cover_updated'));
    } catch (error) {
      handleError(error, $t('errors.unable_to_update_space_cover'));
    }
  };

  const handleCancelReposition = () => {
    repositioning = false;
  };

  const handleSetCoverFromSelection = async () => {
    const assets = assetInteraction.selectedAssets;
    if (assets.length !== 1) {
      return;
    }

    try {
      await updateSpace({
        id: space.id,
        sharedSpaceUpdateDto: { thumbnailAssetId: assets[0].id },
      });
      space = { ...space, thumbnailAssetId: assets[0].id, thumbnailCropY: null };
      toastManager.success($t('space_cover_updated'));
      assetInteraction.clearMultiselect();
      viewMode = 'view';
      repositioning = true;
    } catch (error) {
      handleError(error, $t('errors.unable_to_update_space_cover'));
    }
  };

  const handleAddAssets = async () => {
    const assetIds = timelineInteraction.selectedAssets.map((a) => a.id);
    if (assetIds.length === 0) {
      return;
    }
    try {
      await addAssets({ id: space.id, sharedSpaceAssetAddDto: { assetIds } });
      eventManager.emit('SpaceAddAssets', { assetIds, spaceId: space.id });
      toastManager.success($t('added_to_space_count', { values: { count: assetIds.length } }));
    } catch (error) {
      handleError(error, $t('errors.error_adding_assets_to_space'));
    }
  };

  const handleDelete = async () => {
    const confirmed = await modalManager.showDialog({
      prompt: $t('spaces_delete_confirmation', { values: { name: space.name } }),
      title: $t('spaces_delete'),
    });

    if (!confirmed) {
      return;
    }

    await removeSpace({ id: space.id });
    await goto(Route.spaces());
  };

  const handleToggleTimeline = async () => {
    try {
      const updated = await updateMemberTimeline({
        id: space.id,
        sharedSpaceMemberTimelineDto: { showInTimeline: !showInTimeline },
      });
      members = members.map((m) => (m.userId === updated.userId ? updated : m));
    } catch (error) {
      handleError(error, $t('errors.unable_to_update_timeline_display_status'));
    }
  };

  const handleToggleFaceRecognition = async () => {
    try {
      const updated = await updateSpace({
        id: space.id,
        sharedSpaceUpdateDto: { faceRecognitionEnabled: !space.faceRecognitionEnabled },
      });
      space = { ...space, faceRecognitionEnabled: updated.faceRecognitionEnabled };
      await loadSpacePeople();
    } catch (error) {
      handleError(error, 'Failed to update face recognition');
    }
  };

  const handleShowMembers = () => {
    panelOpen = !panelOpen;
  };

  const handleRemoveAssets = async (assetIds: string[]) => {
    timelineManager.removeAssets(assetIds);
    await refreshSpace();
    await loadActivities();
  };

  const handleSetAsCover = async () => {
    const assets = assetInteraction.selectedAssets;
    if (assets.length !== 1) {
      return;
    }

    try {
      await updateSpace({
        id: space.id,
        sharedSpaceUpdateDto: { thumbnailAssetId: assets[0].id },
      });
      space = { ...space, thumbnailAssetId: assets[0].id, thumbnailCropY: null };
      toastManager.success($t('space_cover_updated'));
      cancelMultiselect(assetInteraction);
      repositioning = true;
    } catch (error) {
      handleError(error, $t('errors.unable_to_update_space_cover'));
    }
  };

  const onSpaceAddAssets = async () => {
    await Promise.all([refreshSpace(), loadActivities()]);
    timelineInteraction.clearMultiselect();
    viewMode = 'view';
  };

  const onSpaceRemoveAssets = async ({ assetIds }: { assetIds: string[]; spaceId: string }) => {
    timelineManager.removeAssets(assetIds);
    await Promise.all([refreshSpace(), loadActivities()]);
  };

  let searchQuery = $state('');
  let searchResults = $state<AssetResponseDto[]>([]);
  let isSearching = $state(false);
  let showSearchResults = $state(false);

  const handleSearchSubmit = async () => {
    const query = searchQuery.trim();
    if (!query) {
      clearSearch();
      return;
    }

    isSearching = true;
    showSearchResults = true;
    try {
      const { assets } = await searchSmart({
        smartSearchDto: { query, spaceId: space.id },
      });
      searchResults = assets.items;
    } catch {
      searchResults = [];
    } finally {
      isSearching = false;
    }
  };

  const clearSearch = () => {
    searchQuery = '';
    searchResults = [];
    showSearchResults = false;
  };

  const gradientClasses: Record<string, string> = {
    [UserAvatarColor.Primary]: 'from-immich-primary/60 to-immich-primary',
    [UserAvatarColor.Pink]: 'from-pink-300 to-pink-500',
    [UserAvatarColor.Red]: 'from-red-400 to-red-600',
    [UserAvatarColor.Yellow]: 'from-yellow-300 to-yellow-500',
    [UserAvatarColor.Blue]: 'from-blue-400 to-blue-600',
    [UserAvatarColor.Green]: 'from-green-400 to-green-700',
    [UserAvatarColor.Purple]: 'from-purple-400 to-purple-700',
    [UserAvatarColor.Orange]: 'from-orange-400 to-orange-600',
    [UserAvatarColor.Gray]: 'from-gray-400 to-gray-600',
    [UserAvatarColor.Amber]: 'from-amber-400 to-amber-600',
  };

  const spaceGradient = $derived(gradientClasses[space.color ?? 'primary'] ?? gradientClasses[UserAvatarColor.Primary]);

  $effect(() => {
    if (space?.id && space.id !== initializedSpaceId) {
      initializedSpaceId = space.id;
      void markSpaceViewed({ id: space.id });
      void loadActivities();
      void loadSpacePeople();
    }
  });
</script>

<OnEvents {onSpaceAddAssets} {onSpaceRemoveAssets} onAssetsDelete={refreshSpace} />

<UserPageLayout
  hideNavbar={assetInteraction.selectionActive || viewMode === 'select-assets' || viewMode === 'select-cover'}
  title={viewMode === 'select-assets' || viewMode === 'select-cover' ? undefined : space.name}
  scrollbar={false}
>
  {#snippet leading()}
    {#if viewMode === 'view' && !assetInteraction.selectionActive}
      <IconButton
        variant="ghost"
        shape="round"
        color="secondary"
        aria-label={$t('back')}
        onclick={() => goto(Route.spaces())}
        icon={mdiArrowLeft}
      />
    {/if}
  {/snippet}

  {#snippet buttons()}
    {#if viewMode === 'view' && !assetInteraction.selectionActive}
      <div class="flex items-center gap-1">
        {#if (space.assetCount ?? 0) > 0}
          <div class="hidden h-10 sm:block sm:w-40 xl:w-60">
            <SearchBar
              placeholder={$t('search')}
              bind:name={searchQuery}
              showLoadingSpinner={isSearching}
              onSearch={({ force }) => {
                if (force) {
                  void handleSearchSubmit();
                }
              }}
              onReset={clearSearch}
            />
          </div>
        {/if}

        <SortToggle
          sortOrder={filters.sortOrder}
          onToggle={(order) => {
            filters = { ...filters, sortOrder: order };
          }}
        />

        {#if isEditor}
          <IconButton
            variant="ghost"
            shape="round"
            color="secondary"
            aria-label={$t('add_photos')}
            onclick={() => {
              viewMode = 'select-assets';
            }}
            icon={mdiImagePlusOutline}
          />
        {/if}

        <SpaceMap spaceId={space.id} />

        <IconButton
          variant="ghost"
          shape="round"
          color="secondary"
          aria-label={showInTimeline ? $t('spaces_hide_from_timeline') : $t('spaces_show_on_timeline')}
          title={showInTimeline ? $t('spaces_hide_from_timeline') : $t('spaces_show_on_timeline')}
          onclick={handleToggleTimeline}
          icon={showInTimeline ? mdiEyeOutline : mdiEyeOffOutline}
        />

        <IconButton
          variant="ghost"
          shape="round"
          color="secondary"
          aria-label={$t('members')}
          onclick={handleShowMembers}
          icon={mdiAccountMultipleOutline}
          data-testid="space-members-button"
        />

        {#if isOwner}
          <IconButton
            variant="ghost"
            shape="round"
            color={space.faceRecognitionEnabled ? 'primary' : 'secondary'}
            aria-label={space.faceRecognitionEnabled ? 'Disable face recognition' : 'Enable face recognition'}
            title={space.faceRecognitionEnabled ? 'Disable face recognition' : 'Enable face recognition'}
            onclick={handleToggleFaceRecognition}
            icon={mdiFaceRecognition}
          />

          <IconButton
            variant="ghost"
            shape="round"
            color="secondary"
            aria-label={$t('spaces_delete')}
            onclick={handleDelete}
            icon={mdiDeleteOutline}
          />
        {/if}
      </div>
    {/if}
  {/snippet}

  <div class="flex h-full" data-testid="discovery-timeline">
    <!-- Filter Panel (left sidebar) -->
    {#if viewMode === 'view'}
      <FilterPanel
        config={filterConfig}
        bind:filters
        timeBuckets={timelineManager?.months?.map((m) => ({
          timeBucket: `${m.yearMonth.year}-${String(m.yearMonth.month).padStart(2, '0')}-01T00:00:00.000Z`,
          count: m.assetsCount,
        })) ?? []}
      />
    {/if}

    <!-- Main Content — pl-4 adds breathing room between filter panel and content -->
    <div class="flex flex-1 flex-col overflow-hidden pl-4">
      <!-- Active filter chips -->
      {#if viewMode === 'view' && getActiveFilterCount(filters) > 0}
        <ActiveFiltersBar
          {filters}
          resultCount={totalAssetCount}
          {personNames}
          {tagNames}
          onRemoveFilter={handleRemoveFilter}
          onClearAll={() => {
            filters = clearFilters(filters);
          }}
        />
      {/if}

      {#if showSearchResults}
        <section class="px-4 py-4">
          {#if isSearching}
            <div class="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          {:else if searchResults.length === 0}
            <p class="mt-8 text-center text-gray-500 dark:text-gray-400">{$t('search_no_result')}</p>
          {:else}
            <p class="mb-4 text-sm text-gray-500 dark:text-gray-400">
              {searchResults.length} results
            </p>
            <div class="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-1">
              {#each searchResults as asset (asset.id)}
                <a
                  href="{Route.viewSpace({ id: space.id })}/photos/{asset.id}"
                  class="aspect-square cursor-pointer overflow-hidden rounded"
                >
                  <img
                    src="/api/assets/{asset.id}/thumbnail"
                    alt={asset.originalFileName}
                    class="h-full w-full object-cover"
                  />
                </a>
              {/each}
            </div>
          {/if}
        </section>
      {/if}

      {#if !showSearchResults}
        {#if totalAssetCount === 0 && getActiveFilterCount(filters) > 0}
          <div class="flex flex-1 flex-col items-center justify-center gap-2" data-testid="empty-state-message">
            <p class="text-sm text-[var(--fg-muted)]">No photos match your filters</p>
            <button
              type="button"
              class="text-sm text-[var(--primary)]"
              onclick={() => {
                filters = clearFilters(filters);
              }}
            >
              Clear all filters
            </button>
          </div>
        {:else}
          <Timeline
            enableRouting={false}
            bind:timelineManager
            {options}
            assetInteraction={currentAssetInteraction}
            {isSelectionMode}
            onEscape={handleEscape}
          >
            {#if viewMode === 'view'}
              <section class="px-4 pt-4">
                <SpaceHero
                  {space}
                  memberCount={members.length}
                  assetCount={space.assetCount ?? 0}
                  currentRole={currentMember?.role}
                  gradientClass={spaceGradient}
                  onSetCover={isEditor ? () => (viewMode = 'select-cover') : undefined}
                  onReposition={isEditor && space.thumbnailAssetId ? handleReposition : undefined}
                  {repositioning}
                  onSavePosition={handleSavePosition}
                  onCancelReposition={handleCancelReposition}
                  peopleCount={spacePeople.length}
                  faceRecognitionEnabled={space.faceRecognitionEnabled}
                  spaceId={space.id}
                  collapsed={heroCollapsed}
                  onToggleCollapse={() => (heroCollapsed = !heroCollapsed)}
                />

                {#if space.faceRecognitionEnabled && spacePeople.length > 0}
                  <SpacePeopleStrip
                    people={spacePeople}
                    spaceId={space.id}
                    selectedPersonIds={filters.personIds}
                    onPersonClick={handlePersonClick}
                  />
                {/if}
              </section>

              {#if isOwner}
                <SpaceOnboardingBanner
                  {space}
                  gradientClass={spaceGradient}
                  onAddPhotos={() => (viewMode = 'select-assets')}
                  onInviteMembers={() => (panelOpen = true)}
                  onSetCover={() => (viewMode = 'select-cover')}
                />
              {/if}

              {#if (space.newAssetCount ?? 0) > 0 && space.lastViewedAt}
                <SpaceNewAssetsDivider
                  newAssetCount={space.newAssetCount ?? 0}
                  lastViewedAt={space.lastViewedAt}
                  spaceColor={space.color ?? 'primary'}
                />
              {/if}
            {/if}

            {#snippet empty()}
              {#if viewMode === 'view'}
                <div class="mx-auto max-w-md py-16 text-center">
                  <p class="text-gray-500 dark:text-gray-400">{$t('spaces_no_assets')}</p>
                </div>
              {/if}
            {/snippet}
          </Timeline>
        {/if}
      {/if}
    </div>
  </div>
</UserPageLayout>

{#if assetInteraction.selectionActive && viewMode === 'view'}
  <AssetSelectControlBar
    assets={assetInteraction.selectedAssets}
    clearSelect={() => assetInteraction.clearMultiselect()}
  >
    <SelectAllAssets {timelineManager} {assetInteraction} />
    {#if isEditor}
      <RemoveFromSpaceAction spaceId={space.id} onRemove={handleRemoveAssets} />
    {/if}
    {#if assetInteraction.isAllUserOwned}
      <FavoriteAction
        removeFavorite={assetInteraction.isAllFavorite}
        onFavorite={(ids, isFavorite) => timelineManager.update(ids, (asset) => (asset.isFavorite = isFavorite))}
      />
    {/if}
    <ButtonContextMenu icon={mdiDotsVertical} title={$t('menu')} offset={{ x: 175, y: 25 }}>
      <DownloadAction menuItem />
      {#if assetInteraction.isAllUserOwned}
        <ChangeDate menuItem />
        <ChangeDescription menuItem />
        <ChangeLocation menuItem />
        <ArchiveAction
          menuItem
          unarchive={assetInteraction.isAllArchived}
          onArchive={(ids, visibility) => timelineManager.update(ids, (asset) => (asset.visibility = visibility))}
        />
      {/if}
      {#if $preferences.tags.enabled && assetInteraction.isAllUserOwned}
        <TagAction menuItem />
      {/if}
      {#if isEditor && assetInteraction.selectedAssets.length === 1}
        <MenuOption text={$t('set_as_space_cover')} icon={mdiImageOutline} onClick={handleSetAsCover} />
      {/if}
    </ButtonContextMenu>
  </AssetSelectControlBar>
{/if}

<SpacePanel
  {space}
  {members}
  {activities}
  currentUserId={$user.id}
  {isOwner}
  open={panelOpen}
  onClose={() => (panelOpen = false)}
  onMembersChanged={async () => {
    members = await getMembers({ id: space.id });
    await refreshSpace();
    await loadActivities();
  }}
  onLibrariesChanged={async () => {
    await refreshSpace();
    await loadActivities();
  }}
  onLoadMoreActivities={loadMoreActivities}
  {hasMoreActivities}
/>

{#if viewMode === 'select-assets'}
  <ControlAppBar onClose={handleCloseSelectAssets}>
    {#snippet leading()}
      <p class="text-lg dark:text-immich-dark-fg">
        {#if !timelineInteraction.selectionActive}
          {$t('add_to_space')}
        {:else}
          {$t('selected_count', { values: { count: timelineInteraction.selectedAssets.length } })}
        {/if}
      </p>
    {/snippet}

    {#snippet trailing()}
      <IconButton
        variant="ghost"
        shape="round"
        color="secondary"
        aria-label={$t('add_to_space')}
        onclick={handleAddAssets}
        icon={mdiPlus}
        disabled={!timelineInteraction.selectionActive}
      />
    {/snippet}
  </ControlAppBar>
{/if}

{#if viewMode === 'select-cover'}
  <ControlAppBar onClose={handleCloseSelectCover}>
    {#snippet leading()}
      <p class="text-lg dark:text-immich-dark-fg">
        {#if !assetInteraction.selectionActive}
          {$t('set_cover_photo')}
        {:else}
          {$t('selected_count', { values: { count: assetInteraction.selectedAssets.length } })}
        {/if}
      </p>
    {/snippet}

    {#snippet trailing()}
      <IconButton
        variant="ghost"
        shape="round"
        color="secondary"
        aria-label={$t('set_cover_photo')}
        onclick={handleSetCoverFromSelection}
        icon={mdiImageOutline}
        disabled={assetInteraction.selectedAssets.length !== 1}
      />
    {/snippet}
  </ControlAppBar>
{/if}
