<script lang="ts">
  import { afterNavigate, goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { intersectionObserver } from '$lib/actions/intersection-observer';
  import { resizeObserver } from '$lib/actions/resize-observer';
  import { shortcuts } from '$lib/actions/shortcut';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import AddToAlbum from '$lib/components/photos-page/actions/add-to-album.svelte';
  import ArchiveAction from '$lib/components/photos-page/actions/archive-action.svelte';
  import ChangeDate from '$lib/components/photos-page/actions/change-date-action.svelte';
  import ChangeLocation from '$lib/components/photos-page/actions/change-location-action.svelte';
  import CreateSharedLink from '$lib/components/photos-page/actions/create-shared-link.svelte';
  import DeleteAssets from '$lib/components/photos-page/actions/delete-assets.svelte';
  import DownloadAction from '$lib/components/photos-page/actions/download-action.svelte';
  import FavoriteAction from '$lib/components/photos-page/actions/favorite-action.svelte';
  import TagAction from '$lib/components/photos-page/actions/tag-action.svelte';
  import AssetSelectControlBar from '$lib/components/photos-page/asset-select-control-bar.svelte';
  import ButtonContextMenu from '$lib/components/shared-components/context-menu/button-context-menu.svelte';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import ControlAppBar from '$lib/components/shared-components/control-app-bar.svelte';
  import GalleryViewer from '$lib/components/shared-components/gallery-viewer/gallery-viewer.svelte';
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { AppRoute, QueryParameter } from '$lib/constants';
  import { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { type Viewport } from '$lib/stores/assets-store.svelte';
  import { loadMemories, memoryStore } from '$lib/stores/memory.store';
  import { locale, videoViewerMuted } from '$lib/stores/preferences.store';
  import { preferences } from '$lib/stores/user.store';
  import { getAssetPlaybackUrl, getAssetThumbnailUrl, handlePromiseError, memoryLaneTitle } from '$lib/utils';
  import { cancelMultiselect } from '$lib/utils/asset-utils';
  import { fromLocalDateTime } from '$lib/utils/timeline-util';
  import {
    AssetMediaSize,
    AssetTypeEnum,
    deleteMemory,
    removeMemoryAssets,
    updateMemory,
    type AssetResponseDto,
    type MemoryResponseDto,
  } from '@immich/sdk';
  import { IconButton } from '@immich/ui';
  import {
    mdiCardsOutline,
    mdiChevronDown,
    mdiChevronLeft,
    mdiChevronRight,
    mdiChevronUp,
    mdiDotsVertical,
    mdiHeart,
    mdiHeartOutline,
    mdiImageMinusOutline,
    mdiImageSearch,
    mdiPause,
    mdiPlay,
    mdiPlus,
    mdiSelectAll,
    mdiVolumeOff,
    mdiVolumeHigh,
  } from '@mdi/js';
  import type { NavigationTarget } from '@sveltejs/kit';
  import { DateTime } from 'luxon';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { tweened } from 'svelte/motion';
  import { derived as storeDerived } from 'svelte/store';
  import { fade } from 'svelte/transition';

  type MemoryIndex = {
    memoryIndex: number;
    assetIndex: number;
  };

  type MemoryAsset = MemoryIndex & {
    memory: MemoryResponseDto;
    asset: AssetResponseDto;
    previousMemory?: MemoryResponseDto;
    previous?: MemoryAsset;
    next?: MemoryAsset;
    nextMemory?: MemoryResponseDto;
  };

  let memoryGallery: HTMLElement | undefined = $state();
  let memoryWrapper: HTMLElement | undefined = $state();
  let galleryInView = $state(false);
  let paused = $state(false);
  let current = $state<MemoryAsset | undefined>(undefined);
  let isSaved = $derived(current?.memory.isSaved);
  let resetPromise = $state(Promise.resolve());

  const { isViewing } = assetViewingStore;
  const viewport: Viewport = $state({ width: 0, height: 0 });
  const assetInteraction = new AssetInteraction();
  let progressBarController = tweened<number>(0, {
    duration: (from: number, to: number) => (to ? 5000 * (to - from) : 0),
  });
  let videoPlayer: HTMLVideoElement | undefined = $state();
  const memories = storeDerived(memoryStore, (memories) => {
    memories = memories ?? [];
    const memoryAssets: MemoryAsset[] = [];
    let previous: MemoryAsset | undefined;
    for (const [memoryIndex, memory] of memories.entries()) {
      for (const [assetIndex, asset] of memory.assets.entries()) {
        const current = {
          memory,
          memoryIndex,
          previousMemory: memories[memoryIndex - 1],
          nextMemory: memories[memoryIndex + 1],
          asset,
          assetIndex,
          previous,
        };

        memoryAssets.push(current);

        if (previous) {
          previous.next = current;
        }

        previous = current;
      }
    }

    return memoryAssets;
  });

  const loadFromParams = (memories: MemoryAsset[], page: typeof $page | NavigationTarget | null) => {
    const assetId = page?.params?.assetId ?? page?.url.searchParams.get(QueryParameter.ID) ?? undefined;
    handlePromiseError(handleAction($isViewing ? 'pause' : 'reset'));
    return memories.find((memory) => memory.asset.id === assetId) ?? memories[0];
  };
  const asHref = (asset: AssetResponseDto) => `?${QueryParameter.ID}=${asset.id}`;
  const handleNavigate = async (asset?: AssetResponseDto) => {
    if ($isViewing) {
      return asset;
    }

    await handleAction('reset');
    if (!asset) {
      return;
    }

    // Adjust the progress bar duration to the video length
    setProgressDuration(asset);

    await goto(asHref(asset));
  };
  const setProgressDuration = (asset: AssetResponseDto) => {
    if (asset.type === AssetTypeEnum.Video) {
      const timeParts = asset.duration.split(':').map(Number);
      const durationInMilliseconds = (timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2]) * 1000;
      progressBarController = tweened<number>(0, {
        duration: (from: number, to: number) => (to ? durationInMilliseconds * (to - from) : 0),
      });
    } else {
      progressBarController = tweened<number>(0, {
        duration: (from: number, to: number) => (to ? 5000 * (to - from) : 0),
      });
    }
  };
  const handleNextAsset = () => handleNavigate(current?.next?.asset);
  const handlePreviousAsset = () => handleNavigate(current?.previous?.asset);
  const handleNextMemory = () => handleNavigate(current?.nextMemory?.assets[0]);
  const handlePreviousMemory = () => handleNavigate(current?.previousMemory?.assets[0]);
  const handleEscape = async () => goto(AppRoute.PHOTOS);
  const handleSelectAll = () => assetInteraction.selectAssets(current?.memory.assets || []);
  const handleAction = async (action: 'reset' | 'pause' | 'play') => {
    switch (action) {
      case 'play': {
        paused = false;
        await videoPlayer?.play();
        await progressBarController.set(1);
        break;
      }

      case 'pause': {
        paused = true;
        videoPlayer?.pause();
        await progressBarController.set($progressBarController);
        break;
      }

      case 'reset': {
        paused = false;
        videoPlayer?.pause();
        resetPromise = progressBarController.set(0);
        break;
      }
    }
  };
  const handleProgress = async (progress: number) => {
    if (progress === 0 && !paused) {
      await handleAction('play');
      return;
    }

    if (progress === 1) {
      await progressBarController.set(0);
      await (current?.next ? handleNextAsset() : handleAction('pause'));
    }
  };
  const handleUpdate = () => {
    if (!current) {
      return;
    }
    // eslint-disable-next-line no-self-assign
    current.memory.assets = current.memory.assets;
  };

  const handleRemove = (ids: string[]) => {
    if (!current) {
      return;
    }
    const idSet = new Set(ids);
    current.memory.assets = current.memory.assets.filter((asset) => !idSet.has(asset.id));
    init();
  };

  const init = () => {
    $memoryStore = $memoryStore.filter((memory) => memory.assets.length > 0);
    if ($memoryStore.length === 0) {
      return handlePromiseError(goto(AppRoute.PHOTOS));
    }

    current = loadFromParams($memories, $page);

    // Adjust the progress bar duration to the video length
    setProgressDuration(current.asset);
  };

  const handleDeleteMemoryAsset = async (current?: MemoryAsset) => {
    if (!current) {
      return;
    }

    if (current.memory.assets.length === 1) {
      return handleDeleteMemory(current);
    }

    if (current.previous) {
      current.previous.next = current.next;
    }
    if (current.next) {
      current.next.previous = current.previous;
    }

    current.memory.assets = current.memory.assets.filter((asset) => asset.id !== current.asset.id);

    // eslint-disable-next-line no-self-assign
    $memoryStore = $memoryStore;

    await removeMemoryAssets({ id: current.memory.id, bulkIdsDto: { ids: [current.asset.id] } });
  };

  const handleDeleteMemory = async (current?: MemoryAsset) => {
    if (!current) {
      return;
    }

    await deleteMemory({ id: current.memory.id });

    notificationController.show({ message: $t('removed_memory'), type: NotificationType.Info });

    await loadMemories();
    init();
  };

  const handleSaveMemory = async (current?: MemoryAsset) => {
    if (!current) {
      return;
    }

    current.memory.isSaved = !current.memory.isSaved;

    await updateMemory({
      id: current.memory.id,
      memoryUpdateDto: {
        isSaved: current.memory.isSaved,
      },
    });

    notificationController.show({
      message: current.memory.isSaved ? $t('added_to_favorites') : $t('removed_from_favorites'),
      type: NotificationType.Info,
    });
  };

  onMount(async () => {
    if (!$memoryStore) {
      await loadMemories();
    }

    init();
  });

  afterNavigate(({ from, to }) => {
    let target = null;
    if (to?.params?.assetId) {
      target = to;
    } else if (from?.params?.assetId) {
      target = from;
    } else {
      target = $page;
    }

    current = loadFromParams($memories, target);
  });

  $effect(() => {
    handlePromiseError(handleProgress($progressBarController));
  });

  $effect(() => {
    handlePromiseError(handleAction(galleryInView ? 'pause' : 'play'));
  });

  $effect(() => {
    if (videoPlayer) {
      videoPlayer.muted = $videoViewerMuted;
    }
  });
</script>

<svelte:window
  use:shortcuts={$isViewing
    ? []
    : [
        { shortcut: { key: 'ArrowRight' }, onShortcut: () => handleNextAsset() },
        { shortcut: { key: 'd' }, onShortcut: () => handleNextAsset() },
        { shortcut: { key: 'ArrowLeft' }, onShortcut: () => handlePreviousAsset() },
        { shortcut: { key: 'a' }, onShortcut: () => handlePreviousAsset() },
        { shortcut: { key: 'Escape' }, onShortcut: () => handleEscape() },
      ]}
/>

{#if assetInteraction.selectionActive}
  <div class="sticky top-0 z-[90]">
    <AssetSelectControlBar
      assets={assetInteraction.selectedAssets}
      clearSelect={() => cancelMultiselect(assetInteraction)}
    >
      <CreateSharedLink />
      <CircleIconButton title={$t('select_all')} icon={mdiSelectAll} onclick={handleSelectAll} />

      <ButtonContextMenu icon={mdiPlus} title={$t('add_to')}>
        <AddToAlbum />
        <AddToAlbum shared />
      </ButtonContextMenu>

      <FavoriteAction removeFavorite={assetInteraction.isAllFavorite} onFavorite={handleUpdate} />

      <ButtonContextMenu icon={mdiDotsVertical} title={$t('menu')}>
        <DownloadAction menuItem />
        <ChangeDate menuItem />
        <ChangeLocation menuItem />
        <ArchiveAction menuItem unarchive={assetInteraction.isAllArchived} onArchive={handleRemove} />
        {#if $preferences.tags.enabled && assetInteraction.isAllUserOwned}
          <TagAction menuItem />
        {/if}
        <DeleteAssets menuItem onAssetDelete={handleRemove} />
      </ButtonContextMenu>
    </AssetSelectControlBar>
  </div>
{/if}

<section id="memory-viewer" class="w-full bg-immich-dark-gray" bind:this={memoryWrapper}>
  {#if current && current.memory.assets.length > 0}
    <ControlAppBar onClose={() => goto(AppRoute.PHOTOS)} forceDark multiRow>
      {#snippet leading()}
        {#if current}
          <p class="text-lg">
            {$memoryLaneTitle(current.memory)}
          </p>
        {/if}
      {/snippet}

      <div class="flex place-content-center place-items-center gap-2 overflow-hidden">
        <CircleIconButton
          title={paused ? $t('play_memories') : $t('pause_memories')}
          icon={paused ? mdiPlay : mdiPause}
          onclick={() => handleAction(paused ? 'play' : 'pause')}
          class="hover:text-black"
        />

        {#each current.memory.assets as asset, index (asset.id)}
          <a class="relative w-full py-2" href={asHref(asset)}>
            <span class="absolute left-0 h-[2px] w-full bg-gray-500"></span>
            {#await resetPromise}
              <span class="absolute left-0 h-[2px] bg-white" style:width={`${index < current.assetIndex ? 100 : 0}%`}
              ></span>
            {:then}
              <span
                class="absolute left-0 h-[2px] bg-white"
                style:width={`${index < current.assetIndex ? 100 : index > current.assetIndex ? 0 : $progressBarController * 100}%`}
              ></span>
            {/await}
          </a>
        {/each}

        <div>
          <p class="text-small">
            {(current.assetIndex + 1).toLocaleString($locale)}/{current.memory.assets.length.toLocaleString($locale)}
          </p>
        </div>
        <CircleIconButton
          title={$videoViewerMuted ? $t('unmute_memories') : $t('mute_memories')}
          icon={$videoViewerMuted ? mdiVolumeOff : mdiVolumeHigh}
          onclick={() => ($videoViewerMuted = !$videoViewerMuted)}
        />
      </div>
    </ControlAppBar>

    {#if galleryInView}
      <div
        class="fixed top-20 z-30 left-1/2 -translate-x-1/2 transition-opacity"
        class:opacity-0={!galleryInView}
        class:opacity-100={galleryInView}
      >
        <button
          type="button"
          onclick={() => memoryWrapper?.scrollIntoView({ behavior: 'smooth' })}
          disabled={!galleryInView}
        >
          <CircleIconButton title={$t('hide_gallery')} icon={mdiChevronUp} color="light" onclick={() => {}} />
        </button>
      </div>
    {/if}
    <!-- Viewer -->
    <section class="overflow-hidden pt-32 md:pt-20">
      <div
        class="ml-[-100%] box-border flex h-[calc(100vh_-_224px)] md:h-[calc(100vh_-_180px)] w-[300%] items-center justify-center gap-10 overflow-hidden"
      >
        <!-- PREVIOUS MEMORY -->
        <div class="h-1/2 w-[20vw] rounded-2xl {current.previousMemory ? 'opacity-25 hover:opacity-70' : 'opacity-0'}">
          <button
            type="button"
            class="relative h-full w-full rounded-2xl"
            disabled={!current.previousMemory}
            onclick={handlePreviousMemory}
          >
            {#if current.previousMemory && current.previousMemory.assets.length > 0}
              <img
                class="h-full w-full rounded-2xl object-cover"
                src={getAssetThumbnailUrl({ id: current.previousMemory.assets[0].id, size: AssetMediaSize.Preview })}
                alt={$t('previous_memory')}
                draggable="false"
              />
            {:else}
              <enhanced:img
                class="h-full w-full rounded-2xl object-cover"
                src="$lib/assets/no-thumbnail.png"
                sizes="min(271px,186px)"
                alt={$t('previous_memory')}
                draggable="false"
              />
            {/if}

            {#if current.previousMemory}
              <div class="absolute bottom-4 right-4 text-left text-white">
                <p class="text-xs font-semibold text-gray-200">{$t('previous').toUpperCase()}</p>
                <p class="text-xl">{$memoryLaneTitle(current.previousMemory)}</p>
              </div>
            {/if}
          </button>
        </div>

        <!-- CURRENT MEMORY -->
        <div
          class="main-view relative flex h-full w-[70vw] place-content-center place-items-center rounded-2xl bg-black"
        >
          <div class="relative h-full w-full rounded-2xl bg-black">
            {#key current.asset.id}
              <div transition:fade class="h-full w-full">
                {#if current.asset.type == AssetTypeEnum.Video}
                  <video
                    bind:this={videoPlayer}
                    autoplay
                    playsinline
                    class="h-full w-full rounded-2xl object-contain transition-all"
                    src={getAssetPlaybackUrl({ id: current.asset.id })}
                    poster={getAssetThumbnailUrl({ id: current.asset.id, size: AssetMediaSize.Preview })}
                    draggable="false"
                    muted={$videoViewerMuted}
                    transition:fade
                  ></video>
                {:else}
                  <img
                    class="h-full w-full rounded-2xl object-contain transition-all"
                    src={getAssetThumbnailUrl({ id: current.asset.id, size: AssetMediaSize.Preview })}
                    alt={current.asset.exifInfo?.description}
                    draggable="false"
                    transition:fade
                  />
                {/if}
              </div>
            {/key}

            <div
              class="absolute bottom-0 right-0 p-2 transition-all flex h-full justify-between flex-col items-end gap-2"
              class:opacity-0={galleryInView}
              class:opacity-100={!galleryInView}
            >
              <div class="flex items-center">
                <IconButton
                  icon={isSaved ? mdiHeart : mdiHeartOutline}
                  shape="round"
                  variant="ghost"
                  color="secondary"
                  aria-label={isSaved ? $t('unfavorite') : $t('favorite')}
                  onclick={() => handleSaveMemory(current)}
                  class="text-white dark:text-white"
                />
                <!-- <IconButton
                  icon={mdiShareVariantOutline}
                  shape="round"
                  variant="ghost"
                  size="giant"
                  color="secondary"
                  aria-label={$t('share')}
                /> -->
                <ButtonContextMenu
                  icon={mdiDotsVertical}
                  padding="3"
                  title={$t('menu')}
                  onclick={() => handleAction('pause')}
                  direction="left"
                  size="20"
                  align="bottom-right"
                  class="text-white dark:text-white"
                >
                  <MenuOption onClick={() => handleDeleteMemory(current)} text="Remove memory" icon={mdiCardsOutline} />
                  <MenuOption
                    onClick={() => handleDeleteMemoryAsset(current)}
                    text="Remove photo from this memory"
                    icon={mdiImageMinusOutline}
                  />
                  <!-- shortcut={{ key: 'l', shift: shared }} -->
                </ButtonContextMenu>
              </div>

              <div>
                <IconButton
                  href="{AppRoute.PHOTOS}?at={current.asset.id}"
                  icon={mdiImageSearch}
                  aria-label={$t('view_in_timeline')}
                  color="secondary"
                  variant="ghost"
                  shape="round"
                  class="text-white dark:text-white"
                />
              </div>
            </div>
            <!-- CONTROL BUTTONS -->
            {#if current.previous}
              <div class="absolute top-1/2 left-0 ml-4">
                <CircleIconButton
                  title={$t('previous_memory')}
                  icon={mdiChevronLeft}
                  color="dark"
                  onclick={handlePreviousAsset}
                />
              </div>
            {/if}

            {#if current.next}
              <div class="absolute top-1/2 right-0 mr-4">
                <CircleIconButton
                  title={$t('next_memory')}
                  icon={mdiChevronRight}
                  color="dark"
                  onclick={handleNextAsset}
                />
              </div>
            {/if}

            <div class="absolute left-8 top-4 text-sm font-medium text-white">
              <p>
                {fromLocalDateTime(current.memory.assets[0].localDateTime).toLocaleString(DateTime.DATE_FULL)}
              </p>
              <p>
                {current.asset.exifInfo?.city || ''}
                {current.asset.exifInfo?.country || ''}
              </p>
            </div>
          </div>
        </div>

        <!-- NEXT MEMORY -->
        <div class="h-1/2 w-[20vw] rounded-2xl {current.nextMemory ? 'opacity-25 hover:opacity-70' : 'opacity-0'}">
          <button
            type="button"
            class="relative h-full w-full rounded-2xl"
            onclick={handleNextMemory}
            disabled={!current.nextMemory}
          >
            {#if current.nextMemory && current.nextMemory.assets.length > 0}
              <img
                class="h-full w-full rounded-2xl object-cover"
                src={getAssetThumbnailUrl({ id: current.nextMemory.assets[0].id, size: AssetMediaSize.Preview })}
                alt={$t('next_memory')}
                draggable="false"
              />
            {:else}
              <enhanced:img
                class="h-full w-full rounded-2xl object-cover"
                src="$lib/assets/no-thumbnail.png"
                sizes="min(271px,186px)"
                alt={$t('next_memory')}
                draggable="false"
              />
            {/if}

            {#if current.nextMemory}
              <div class="absolute bottom-4 left-4 text-left text-white">
                <p class="text-xs font-semibold text-gray-200">{$t('up_next').toUpperCase()}</p>
                <p class="text-xl">{$memoryLaneTitle(current.nextMemory)}</p>
              </div>
            {/if}
          </button>
        </div>
      </div>
    </section>

    <!-- GALLERY VIEWER -->
    <section class="bg-immich-dark-gray p-4">
      <div
        class="sticky mb-10 flex place-content-center place-items-center transition-all"
        class:opacity-0={galleryInView}
        class:opacity-100={!galleryInView}
      >
        <CircleIconButton
          title={$t('show_gallery')}
          icon={mdiChevronDown}
          color="light"
          onclick={() => memoryGallery?.scrollIntoView({ behavior: 'smooth' })}
        />
      </div>

      <div
        id="gallery-memory"
        use:intersectionObserver={{
          onIntersect: () => (galleryInView = true),
          onSeparate: () => (galleryInView = false),
          bottom: '-200px',
        }}
        use:resizeObserver={({ height, width }) => ((viewport.height = height), (viewport.width = width))}
        bind:this={memoryGallery}
      >
        <GalleryViewer
          onNext={handleNextAsset}
          onPrevious={handlePreviousAsset}
          assets={current.memory.assets}
          {viewport}
          {assetInteraction}
        />
      </div>
    </section>
  {/if}
</section>

<style>
  .main-view {
    box-shadow:
      0 4px 4px 0 rgba(0, 0, 0, 0.3),
      0 8px 12px 6px rgba(0, 0, 0, 0.15);
  }
</style>
