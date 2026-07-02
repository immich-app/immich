<script lang="ts">
  import ActionMenuItem from '$lib/components/ActionMenuItem.svelte';
  import ButtonContextMenu from '$lib/components/shared-components/context-menu/ButtonContextMenu.svelte';
  import type { SelectionBBox } from '$lib/components/shared-components/map/types';
  import ArchiveAction from '$lib/components/timeline/actions/ArchiveAction.svelte';
  import ChangeDate from '$lib/components/timeline/actions/ChangeDateAction.svelte';
  import ChangeDescription from '$lib/components/timeline/actions/ChangeDescriptionAction.svelte';
  import ChangeLocation from '$lib/components/timeline/actions/ChangeLocationAction.svelte';
  import CreateSharedLink from '$lib/components/timeline/actions/CreateSharedLinkAction.svelte';
  import DeleteAssets from '$lib/components/timeline/actions/DeleteAssetsAction.svelte';
  import DownloadAction from '$lib/components/timeline/actions/DownloadAction.svelte';
  import FavoriteAction from '$lib/components/timeline/actions/FavoriteAction.svelte';
  import LinkLivePhotoAction from '$lib/components/timeline/actions/LinkLivePhotoAction.svelte';
  import SelectAllAssets from '$lib/components/timeline/actions/SelectAllAction.svelte';
  import SetVisibilityAction from '$lib/components/timeline/actions/SetVisibilityAction.svelte';
  import StackAction from '$lib/components/timeline/actions/StackAction.svelte';
  import TagAction from '$lib/components/timeline/actions/TagAction.svelte';
  import AssetSelectControlBar from '$lib/components/timeline/AssetSelectControlBar.svelte';
  import Timeline from '$lib/components/timeline/Timeline.svelte';
  import Portal from '$lib/elements/Portal.svelte';
  import { assetMultiSelectManager } from '$lib/managers/asset-multi-select-manager.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';

  import { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import { getAssetBulkActions } from '$lib/services/asset.service';
  import { mapSettings } from '$lib/stores/preferences.store';
  import EmptyPlaceholder from '$lib/components/shared-components/EmptyPlaceholder.svelte';
  import {
    updateStackedAssetInTimeline,
    updateUnstackedAssetInTimeline,
    type OnLink,
    type OnUnlink,
  } from '$lib/utils/actions';
  import { AssetVisibility } from '@immich/sdk';
  import { ActionButton, CloseButton, CommandPaletteDefaultProvider, Icon, LoadingSpinner } from '@immich/ui';
  import { mdiDotsVertical, mdiImageMultiple } from '@mdi/js';
  import { ceil, floor, clamp } from 'lodash-es';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  interface Props {
    bbox?: SelectionBBox;
    selectedClusterIds: Set<string>;
    panelWidth?: number;
    assetCount: number;
    onClose: () => void;
    onSelect?: (assetIds: string[]) => void;
    sheetHeight?: number;
    isDraggingSheet?: boolean;
    isMobile: boolean;
  }

  let {
    bbox,
    selectedClusterIds,
    panelWidth = 384,
    assetCount,
    onClose,
    onSelect,
    sheetHeight = $bindable(50),
    isDraggingSheet = $bindable(false),
    isMobile,
  }: Props = $props();

  let timelineManager = $state<TimelineManager>();

  const SHEET_MIN_HEIGHT = 15;
  const SHEET_COLLAPSED_HEIGHT = 30;
  const SHEET_DEFAULT_HEIGHT = 50;
  const SHEET_EXPANDED_HEIGHT = 65;
  const SHEET_DISMISS_THRESHOLD = 20;
  const SHEET_COLLAPSE_THRESHOLD = 40;
  const SHEET_EXPAND_THRESHOLD = 58;
  const SHEET_STEP = 10;

  let startY = 0;
  let startHeight = 0;

  function handlePointerDown(e: PointerEvent) {
    startY = e.clientY;
    startHeight = sheetHeight;
    isDraggingSheet = true;
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  }

  function handlePointerMove(e: PointerEvent) {
    if (!isDraggingSheet) {
      return;
    }
    const deltaY = startY - e.clientY;
    const deltaVh = (deltaY / globalThis.innerHeight) * 100;
    sheetHeight = clamp(startHeight + deltaVh, SHEET_MIN_HEIGHT, SHEET_EXPANDED_HEIGHT);
  }

  function handlePointerUp() {
    if (!isDraggingSheet) {
      return;
    }
    isDraggingSheet = false;

    if (sheetHeight < SHEET_DISMISS_THRESHOLD) {
      onClose();
    } else if (sheetHeight < SHEET_COLLAPSE_THRESHOLD) {
      sheetHeight = SHEET_COLLAPSED_HEIGHT;
    } else if (sheetHeight > SHEET_EXPAND_THRESHOLD) {
      sheetHeight = SHEET_EXPANDED_HEIGHT;
    } else {
      sheetHeight = SHEET_DEFAULT_HEIGHT;
    }
  }

  function handleSheetKeydown(event: KeyboardEvent) {
    if (!isMobile) {
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      sheetHeight = clamp(sheetHeight + SHEET_STEP, SHEET_MIN_HEIGHT, SHEET_EXPANDED_HEIGHT);
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      sheetHeight = clamp(sheetHeight - SHEET_STEP, SHEET_MIN_HEIGHT, SHEET_EXPANDED_HEIGHT);
      if (sheetHeight <= SHEET_DISMISS_THRESHOLD) {
        onClose();
      }
    }
  }

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

  const displayedAssetCount = $derived(
    selectedClusterIds.size > 0 ? assetCount : (timelineManager?.assetCount ?? assetCount),
  );

  const handleLink: OnLink = ({ still, motion }) => {
    timelineManager!.removeAssets([motion.id]);
    timelineManager!.upsertAssets([still]);
  };

  const handleUnlink: OnUnlink = ({ still, motion }) => {
    timelineManager!.upsertAssets([motion]);
    timelineManager!.upsertAssets([still]);
  };

  const handleSetVisibility = (assetIds: string[]) => {
    timelineManager!.removeAssets(assetIds);
    assetMultiSelectManager.clear();
  };

  const handleEscape = () => {
    assetMultiSelectManager.clear();
  };

  const handleThumbnailClick = (asset: TimelineAsset) => {
    onSelect?.([asset.id]);
  };

  const timelineBoundingBox = $derived.by(() => {
    if (!bbox) {
      return '';
    }
    return `${floor(bbox.west, 6)},${floor(bbox.south, 6)},${ceil(bbox.east, 6)},${ceil(bbox.north, 6)}`;
  });

  const timelineOptions = $derived.by(() => {
    if (!timelineBoundingBox) {
      return undefined;
    }
    const assetFilter = selectedClusterIds.size > 0 ? selectedClusterIds : undefined;
    return {
      bbox: timelineBoundingBox,
      visibility: $mapSettings.includeArchived ? undefined : AssetVisibility.Timeline,
      isFavorite: $mapSettings.onlyFavorites || undefined,
      withPartners: $mapSettings.withPartners || undefined,
      assetFilter,
    };
  });

  const timelineLayoutOptions = $derived.by(() => {
    const usableWidth = (panelWidth || 384) - 48;
    const rowHeight = clamp(Math.round(usableWidth * 0.55), 180, 280);
    const headerHeight = 36;
    const gap = 4;
    return { rowHeight, headerHeight, gap };
  });

  $effect.pre(() => {
    void timelineOptions;
    assetMultiSelectManager.clear();
  });
</script>

<svelte:window onpointermove={handlePointerMove} onpointerup={handlePointerUp} />

<div
  class="flex min-w-0 flex-col overflow-hidden bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.12)] ease-out sm:shadow-none dark:bg-immich-dark-bg"
  class:transition-all={!isDraggingSheet}
  class:duration-300={!isDraggingSheet}
  style:height={isMobile ? `${sheetHeight}vh` : '100%'}
  style:border-top-left-radius={isMobile ? '24px' : '0'}
  style:border-top-right-radius={isMobile ? '24px' : '0'}
>
  {#if isMobile}
    <div
      class="flex cursor-grab touch-none justify-center pt-4 pb-2"
      class:cursor-grabbing={isDraggingSheet}
      onpointerdown={handlePointerDown}
      onkeydown={handleSheetKeydown}
      role="slider"
      aria-orientation="vertical"
      aria-label="Drag to resize"
      aria-valuenow={sheetHeight}
      aria-valuemin={SHEET_MIN_HEIGHT}
      aria-valuemax={SHEET_EXPANDED_HEIGHT}
      tabindex="0"
    >
      <div class="h-1.5 w-12 rounded-full bg-gray-300 dark:bg-gray-600"></div>
    </div>
  {/if}

  <div class="flex items-center justify-between px-6 py-2 sm:pt-6">
    <div class="flex items-center gap-3">
      <Icon icon={mdiImageMultiple} size="24" class="text-immich-primary dark:text-immich-dark-primary" />
      <h2 class="text-lg font-medium text-immich-primary dark:text-immich-dark-primary">
        {$t('assets_count', { values: { count: displayedAssetCount } })}
      </h2>
    </div>
    <CloseButton onclick={onClose} />
  </div>

  <div class="relative min-h-0 min-w-0 flex-1 overflow-y-auto px-6">
    <div class="size-full">
      {#if timelineOptions}
        <Timeline
          bind:timelineManager
          enableRouting={false}
          options={timelineOptions}
          layoutOptions={timelineLayoutOptions}
          onEscape={handleEscape}
          assetInteraction={assetMultiSelectManager}
          showArchiveIcon
          onSelect={handleThumbnailClick}
        >
          {#snippet empty()}
            <div
              in:fade={{ duration: 200 }}
              class="flex h-full flex-col items-center justify-center text-center opacity-60"
            >
              <EmptyPlaceholder text="No photos in this area" />
            </div>
          {/snippet}
        </Timeline>
      {/if}
    </div>

    {#if !timelineManager?.isInitialized}
      <div
        transition:fade={{ duration: 200 }}
        class="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-md dark:bg-immich-dark-bg/50"
      >
        <LoadingSpinner />
      </div>
    {/if}
  </div>
</div>

{#if assetMultiSelectManager.selectionActive}
  {@const Actions = getAssetBulkActions($t)}
  <CommandPaletteDefaultProvider name={$t('assets')} actions={Object.values(Actions)} />

  <Portal target="body">
    <AssetSelectControlBar>
      <CreateSharedLink />
      <SelectAllAssets timelineManager={timelineManager!} assetInteraction={assetMultiSelectManager} />
      <ActionButton action={Actions.AddToAlbum} />

      {#if assetMultiSelectManager.isAllUserOwned}
        <FavoriteAction
          removeFavorite={assetMultiSelectManager.isAllFavorite}
          onFavorite={(ids, isFavorite) => timelineManager!.update(ids, (asset) => (asset.isFavorite = isFavorite))}
        />

        <ButtonContextMenu icon={mdiDotsVertical} title={$t('menu')}>
          <DownloadAction menuItem />
          {#if assetMultiSelectManager.assets.length > 1 || isAssetStackSelected}
            <StackAction
              unstack={isAssetStackSelected}
              onStack={(result) => updateStackedAssetInTimeline(timelineManager!, result)}
              onUnstack={(assets) => updateUnstackedAssetInTimeline(timelineManager!, assets)}
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
          <ChangeDate menuItem />
          <ChangeDescription menuItem />
          <ChangeLocation menuItem />
          <ArchiveAction
            menuItem
            unarchive={assetMultiSelectManager.isAllArchived}
            onArchive={(ids, visibility) => timelineManager!.update(ids, (asset) => (asset.visibility = visibility))}
          />
          {#if authManager.preferences.tags.enabled}
            <TagAction menuItem />
          {/if}
          <DeleteAssets
            menuItem
            onAssetDelete={(assetIds) => timelineManager!.removeAssets(assetIds)}
            onUndoDelete={(assets) => timelineManager!.upsertAssets(assets)}
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
  </Portal>
{/if}
