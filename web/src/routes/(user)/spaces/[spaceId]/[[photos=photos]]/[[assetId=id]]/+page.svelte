<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import FilterPanel from '$lib/components/filter-panel/filter-panel.svelte';
  import ActiveFiltersBar from '$lib/components/filter-panel/active-filters-bar.svelte';
  import {
    buildFilterContext,
    createFilterState,
    clearFilters,
    getActiveFilterCount,
    type FilterPanelConfig,
    type FilterState,
  } from '$lib/components/filter-panel/filter-panel';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import SmartSearchResults from '$lib/components/search/smart-search-results.svelte';
  import ControlAppBar from '$lib/components/shared-components/control-app-bar.svelte';
  import ButtonContextMenu from '$lib/components/shared-components/context-menu/button-context-menu.svelte';
  import SpaceHero from '$lib/components/spaces/space-hero.svelte';
  import SpaceMap from '$lib/components/spaces/space-map.svelte';
  import SpaceNewAssetsDivider from '$lib/components/spaces/space-new-assets-divider.svelte';
  import SpaceOnboardingBanner from '$lib/components/spaces/space-onboarding-banner.svelte';
  import SpaceAssetLimitWarning, {
    MAX_SPACE_ASSETS_PER_REQUEST,
  } from '$lib/components/spaces/space-asset-limit-warning.svelte';
  import SpacePanel from '$lib/components/spaces/space-panel.svelte';
  import SpacePeopleStrip from '$lib/components/spaces/space-people-strip.svelte';
  import SpaceLinkedLibrariesModal from '$lib/modals/SpaceLinkedLibrariesModal.svelte';
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
  import { registerSpaceContext } from '$lib/managers/command-context-manager.svelte';
  import { eventManager } from '$lib/managers/event-manager.svelte';
  import { Route } from '$lib/route';
  import { assetMultiSelectManager } from '$lib/managers/asset-multi-select-manager.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { createUrl } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import { buildSearchablePageUrl, getSearchablePageState } from '$lib/utils/searchable-page-search';
  import { loadHeroCollapsed, persistHeroCollapsed } from '$lib/utils/space-hero-storage';
  import {
    addAssets,
    bulkAddAssets,
    AssetOrder,
    AssetTypeEnum,
    AssetVisibility,
    getFilterSuggestions,
    getMembers,
    getSearchSuggestions,
    getSpace,
    getSpaceActivities,
    getSpacePeople,
    markSpaceViewed,
    removeSpace,
    SharedSpaceRole,
    SearchSuggestionType,
    updateMemberTimeline,
    updateSpace,
    UserAvatarColor,
    type SharedSpaceActivityResponseDto,
    type SharedSpaceMemberResponseDto,
    type SharedSpacePersonResponseDto,
    type SharedSpaceResponseDto,
  } from '@immich/sdk';
  import { IconButton, modalManager, toastManager } from '@immich/ui';
  import {
    mdiAccountMultipleOutline,
    mdiArrowLeft,
    mdiBookshelf,
    mdiAccountSupervisorCircleOutline,
    mdiDeleteOutline,
    mdiDotsVertical,
    mdiEyeOffOutline,
    mdiEyeOutline,
    mdiFaceRecognition,
    mdiImageMultipleOutline,
    mdiImageOutline,
    mdiImagePlusOutline,
    mdiPaw,
    mdiPlus,
  } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { untrack } from 'svelte';
  import { SvelteMap } from 'svelte/reactivity';
  import type { PageData } from './$types';

  type ViewMode = 'view' | 'select-assets' | 'select-cover';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
  let space: SharedSpaceResponseDto = $state(data.space);
  let members: SharedSpaceMemberResponseDto[] = $state(data.members);

  registerSpaceContext(
    () => space,
    () => members,
  );
  const initialSearchState = getSearchablePageState(page.url);

  // Sync when navigating between spaces (component persists, data updates)
  $effect(() => {
    if (data.space.id !== space.id) {
      const nextSearchState = getSearchablePageState(page.url);
      space = data.space;
      members = data.members;
      filters = {
        ...createFilterState(),
        sortOrder: nextSearchState.sortOrder,
      };
      activities = [];
      hasMoreActivities = false;
      activityOffset = 0;
      spacePeople = [];
      personNames.clear();
      tagNames.clear();
      isLoading = false;
      committedSearchQuery = nextSearchState.query;
      lastHandledSearchState = `${nextSearchState.query}:${nextSearchState.sortOrder}`;
      heroCollapsed = loadHeroCollapsed(data.space.id);
      panelOpen = false;
      viewMode = 'view';
      repositioning = false;
      assetMultiSelectManager.clear();
    }
  });

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
  let filters = $state<FilterState>({
    ...createFilterState(),
    sortOrder: initialSearchState.sortOrder,
  });
  let personNames = new SvelteMap<string, string>();
  let tagNames = new SvelteMap<string, string>();

  let heroCollapsed = $state(loadHeroCollapsed(data.space.id));

  function toggleHeroCollapsed() {
    heroCollapsed = !heroCollapsed;
    persistHeroCollapsed(space.id, heroCollapsed);
  }

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
        spaceId: space.id,
      });
      const mappedPeople = response.people.map((p) => ({
        id: p.id,
        name: p.name,
        thumbnailUrl: createUrl(`/shared-spaces/${space.id}/people/${p.id}/thumbnail`),
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
          spaceId: space.id,
          ...context,
        }),
      cameraModels: (make, context) =>
        getSearchSuggestions({
          $type: SearchSuggestionType.CameraModel,
          make,
          spaceId: space.id,
          ...context,
        }),
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
      case 'timeline': {
        filters = { ...filters, selectedYear: undefined, selectedMonth: undefined };
        break;
      }
    }
  }

  const currentMember = $derived(members.find((m) => m.userId === authManager.user.id));
  const isOwner = $derived(currentMember?.role === SharedSpaceRole.Owner);
  const isEditor = $derived(
    currentMember?.role === SharedSpaceRole.Owner || currentMember?.role === SharedSpaceRole.Editor,
  );
  const showInTimeline = $derived(currentMember?.showInTimeline ?? true);

  const totalAssetCount = $derived(timelineManager?.assetCount ?? 0);
  const isTimelineEmpty = $derived(
    timelineManager?.isInitialized && totalAssetCount === 0 && getActiveFilterCount(filters) === 0,
  );

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
      spacePeople = await getSpacePeople({ id: space.id, limit: 10 });
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
    if (assetMultiSelectManager.selectionActive) {
      assetMultiSelectManager.clear();
      return;
    }
    void goto(Route.spaces());
  };

  const handleCloseSelectAssets = () => {
    assetMultiSelectManager.clear();
    viewMode = 'view';
  };

  const handleCloseSelectCover = () => {
    assetMultiSelectManager.clear();
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
    const assets = assetMultiSelectManager.assets;
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
      assetMultiSelectManager.clear();
      viewMode = 'view';
      repositioning = true;
    } catch (error) {
      handleError(error, $t('errors.unable_to_update_space_cover'));
    }
  };

  const handleAddAssets = async () => {
    const assetIds = assetMultiSelectManager.assets.map((a) => a.id);
    if (assetIds.length === 0 || assetIds.length > MAX_SPACE_ASSETS_PER_REQUEST) {
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

  const handleBulkAddAssets = async () => {
    const confirmed = await modalManager.showDialog({
      title: $t('add_all_photos'),
      prompt: $t('bulk_add_confirmation'),
    });

    if (!confirmed) {
      return;
    }

    try {
      await bulkAddAssets({ id: space.id });
      toastManager.success($t('bulk_add_started'));
    } catch (error) {
      handleError(error, $t('errors.error_adding_assets_to_space'));
    }
  };

  const handleLinkLibraries = async () => {
    const changed = await modalManager.show(SpaceLinkedLibrariesModal, { space });
    if (changed) {
      await refreshSpace();
      await loadActivities();
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

  const handleTogglePets = async () => {
    try {
      const updated = await updateSpace({
        id: space.id,
        sharedSpaceUpdateDto: { petsEnabled: !space.petsEnabled },
      });
      space = { ...space, petsEnabled: updated.petsEnabled };
      await loadSpacePeople();
    } catch (error) {
      handleError(error, 'Failed to update pets setting');
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
    const assets = assetMultiSelectManager.assets;
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
      assetMultiSelectManager.clear();
      repositioning = true;
    } catch (error) {
      handleError(error, $t('errors.unable_to_update_space_cover'));
    }
  };

  const onSpaceAddAssets = async () => {
    await Promise.all([refreshSpace(), loadActivities()]);
    assetMultiSelectManager.clear();
    viewMode = 'view';
  };

  const onSpaceRemoveAssets = async ({ assetIds }: { assetIds: string[]; spaceId: string }) => {
    timelineManager.removeAssets(assetIds);
    await Promise.all([refreshSpace(), loadActivities()]);
  };

  let committedSearchQuery = $state(initialSearchState.query);
  let lastHandledSearchState = $state(`${initialSearchState.query}:${initialSearchState.sortOrder}`);
  let isLoading = $state(false);
  const showSearchResults = $derived(committedSearchQuery.trim().length > 0);

  const clearSearch = () => {
    isLoading = false;
    const nextUrl = buildSearchablePageUrl(page.url, '');
    if (!nextUrl) {
      return;
    }
    void goto(nextUrl, {
      replaceState: true,
      keepFocus: true,
      noScroll: true,
    });
  };

  $effect(() => {
    const nextSearchState = getSearchablePageState(page.url);
    const nextToken = `${nextSearchState.query}:${nextSearchState.sortOrder}`;
    if (nextToken === lastHandledSearchState) {
      return;
    }

    untrack(() => {
      committedSearchQuery = nextSearchState.query;
      isLoading = false;
      filters = {
        ...filters,
        sortOrder: nextSearchState.sortOrder,
      };
      lastHandledSearchState = nextToken;
    });
  });

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
  hideNavbar={assetMultiSelectManager.selectionActive || viewMode === 'select-assets' || viewMode === 'select-cover'}
  title={viewMode === 'select-assets' || viewMode === 'select-cover' ? undefined : space.name}
  scrollbar={false}
>
  {#snippet leading()}
    {#if viewMode === 'view' && !assetMultiSelectManager.selectionActive}
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
    {#if viewMode === 'view' && !assetMultiSelectManager.selectionActive}
      <div class="flex items-center gap-1">
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
          aria-label={$t('members')}
          onclick={handleShowMembers}
          icon={mdiAccountMultipleOutline}
          data-testid="space-members-button"
        />

        <ButtonContextMenu direction="left" align="top-right" color="secondary" title="More" icon={mdiDotsVertical}>
          <MenuOption
            text={showInTimeline ? $t('spaces_hide_from_timeline') : $t('spaces_show_on_timeline')}
            icon={showInTimeline ? mdiEyeOutline : mdiEyeOffOutline}
            onClick={handleToggleTimeline}
          />
          {#if isEditor || authManager.user?.isAdmin}
            <hr class="my-1 border-gray-300" />
          {/if}
          {#if isEditor}
            <MenuOption text={$t('add_all_photos')} icon={mdiImageMultipleOutline} onClick={handleBulkAddAssets} />
          {/if}
          {#if authManager.user?.isAdmin}
            <MenuOption text="Link Libraries" icon={mdiBookshelf} onClick={handleLinkLibraries} />
          {/if}
          {#if space.faceRecognitionEnabled}
            <MenuOption
              text={$t('people')}
              icon={mdiAccountSupervisorCircleOutline}
              onClick={() => goto(`/spaces/${space.id}/people`)}
            />
          {/if}
          {#if isOwner}
            <hr class="my-1 border-gray-300" />
            <MenuOption
              text={space.faceRecognitionEnabled ? 'Hide people' : 'Show people'}
              icon={mdiFaceRecognition}
              onClick={handleToggleFaceRecognition}
            />
            {#if space.faceRecognitionEnabled && space.hasPets}
              <MenuOption
                text={space.petsEnabled ? 'Hide pets' : 'Show pets'}
                icon={mdiPaw}
                onClick={handleTogglePets}
              />
            {/if}
            <hr class="my-1 border-gray-300" />
            <MenuOption
              text={$t('spaces_delete')}
              icon={mdiDeleteOutline}
              textColor="text-red-500"
              onClick={handleDelete}
            />
          {/if}
        </ButtonContextMenu>
      </div>
    {/if}
  {/snippet}

  <div class="flex h-full" data-testid="discovery-timeline">
    <!-- Filter Panel (left sidebar) -->
    {#if viewMode === 'view'}
      {#key space.id}
        <FilterPanel
          config={filterConfig}
          bind:filters
          timeBuckets={timelineManager?.months?.map((m) => ({
            timeBucket: `${m.yearMonth.year}-${String(m.yearMonth.month).padStart(2, '0')}-01T00:00:00.000Z`,
            count: m.assetsCount,
          })) ?? []}
          hidden={isTimelineEmpty}
        />
      {/key}
    {/if}

    <!-- Main Content — pl-4 adds breathing room between filter panel and content -->
    <div class="flex flex-1 flex-col overflow-hidden pl-4">
      <!-- Active filter chips -->
      {#if viewMode === 'view' && (getActiveFilterCount(filters) > 0 || committedSearchQuery.trim().length > 0)}
        <ActiveFiltersBar
          {filters}
          resultCount={showSearchResults ? undefined : totalAssetCount}
          {personNames}
          {tagNames}
          onRemoveFilter={handleRemoveFilter}
          onClearAll={() => {
            filters = clearFilters(filters);
          }}
          searchQuery={committedSearchQuery}
          onClearSearch={clearSearch}
        />
      {/if}

      {#if showSearchResults}
        <SmartSearchResults
          searchQuery={committedSearchQuery}
          bind:isLoading
          {filters}
          spaceId={space.id}
          isShared={true}
        />
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
            assetInteraction={assetMultiSelectManager}
            {isSelectionMode}
            onEscape={handleEscape}
            spaceId={space.id}
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
                  faceRecognitionEnabled={space.faceRecognitionEnabled}
                  spaceId={space.id}
                  onShowMembers={handleShowMembers}
                  collapsed={heroCollapsed}
                  onToggleCollapse={toggleHeroCollapsed}
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

{#if assetMultiSelectManager.selectionActive && viewMode === 'view'}
  <AssetSelectControlBar>
    <SelectAllAssets {timelineManager} assetInteraction={assetMultiSelectManager} />
    {#if isEditor}
      <RemoveFromSpaceAction spaceId={space.id} onRemove={handleRemoveAssets} />
    {/if}
    {#if assetMultiSelectManager.isAllUserOwned}
      <FavoriteAction
        removeFavorite={assetMultiSelectManager.isAllFavorite}
        onFavorite={(ids, isFavorite) => timelineManager.update(ids, (asset) => (asset.isFavorite = isFavorite))}
      />
    {/if}
    <ButtonContextMenu icon={mdiDotsVertical} title={$t('menu')} offset={{ x: 175, y: 25 }}>
      <DownloadAction menuItem />
      {#if assetMultiSelectManager.isAllUserOwned}
        <ChangeDate menuItem />
        <ChangeDescription menuItem />
        <ChangeLocation menuItem />
        <ArchiveAction
          menuItem
          unarchive={assetMultiSelectManager.isAllArchived}
          onArchive={(ids, visibility) => timelineManager.update(ids, (asset) => (asset.visibility = visibility))}
        />
      {/if}
      {#if authManager.preferences.tags.enabled && assetMultiSelectManager.isAllUserOwned}
        <TagAction menuItem />
      {/if}
      {#if isEditor && assetMultiSelectManager.assets.length === 1}
        <MenuOption text={$t('set_as_space_cover')} icon={mdiImageOutline} onClick={handleSetAsCover} />
      {/if}
    </ButtonContextMenu>
  </AssetSelectControlBar>
{/if}

<SpacePanel
  {space}
  {members}
  {activities}
  currentUserId={authManager.user.id}
  {isOwner}
  open={panelOpen}
  onClose={() => (panelOpen = false)}
  onMembersChanged={async () => {
    members = await getMembers({ id: space.id });
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
        {#if !assetMultiSelectManager.selectionActive}
          {$t('add_to_space')}
        {:else}
          {$t('selected_count', { values: { count: assetMultiSelectManager.assets.length } })}
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
        disabled={!assetMultiSelectManager.selectionActive ||
          assetMultiSelectManager.assets.length > MAX_SPACE_ASSETS_PER_REQUEST}
      />
    {/snippet}
  </ControlAppBar>
  <SpaceAssetLimitWarning selectedCount={assetMultiSelectManager.assets.length} />
{/if}

{#if viewMode === 'select-cover'}
  <ControlAppBar onClose={handleCloseSelectCover}>
    {#snippet leading()}
      <p class="text-lg dark:text-immich-dark-fg">
        {#if !assetMultiSelectManager.selectionActive}
          {$t('set_cover_photo')}
        {:else}
          {$t('selected_count', { values: { count: assetMultiSelectManager.assets.length } })}
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
        disabled={assetMultiSelectManager.assets.length !== 1}
      />
    {/snippet}
  </ControlAppBar>
{/if}
