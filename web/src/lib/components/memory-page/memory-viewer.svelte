<script lang="ts">
  import { afterNavigate, goto } from '$app/navigation';
  import { page } from '$app/state';
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
  import { type MemoryAsset, memoryStore } from '$lib/stores/memory.store.svelte';
  import { locale, videoViewerMuted, videoViewerVolume } from '$lib/stores/preferences.store';
  import { preferences } from '$lib/stores/user.store';
  import { getAssetPlaybackUrl, getAssetThumbnailUrl, handlePromiseError, memoryLaneTitle } from '$lib/utils';
  import { cancelMultiselect } from '$lib/utils/asset-utils';
  import { fromLocalDateTime } from '$lib/utils/timeline-util';
  import { AssetMediaSize, type AssetResponseDto, AssetTypeEnum } from '@immich/sdk';
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
    mdiVolumeHigh,
    mdiVolumeOff,
  } from '@mdi/js';
  import type { NavigationTarget, Page } from '@sveltejs/kit';
  import { DateTime } from 'luxon';
  import { t } from 'svelte-i18n';
  import { Tween } from 'svelte/motion';
  import { fade } from 'svelte/transition';

  let memoryGallery: HTMLElement | undefined = $state();
  let memoryWrapper: HTMLElement | undefined = $state();
  let galleryInView = $state(false);
  let galleryFirstLoad = $state(true);
  let playerInitialized = $state(false);
  let paused = $state(false);
  let current = $state<MemoryAsset | undefined>(undefined);
  let isSaved = $derived(current?.memory.isSaved);
  let viewerHeight = $state(0);

  const { isViewing } = assetViewingStore;
  const viewport: Viewport = $state({ width: 0, height: 0 });
  // need to include padding in the viewport for gallery
  const galleryViewport: Viewport = $derived({ height: viewport.height, width: viewport.width - 32 });
  const assetInteraction = new AssetInteraction();
  let progressBarController: Tween<number> | undefined = $state(undefined);
  let videoPlayer: HTMLVideoElement | undefined = $state();
  const asHref = (asset: AssetResponseDto) => `?${QueryParameter.ID}=${asset.id}`;
  const handleNavigate = async (asset?: AssetResponseDto) => {
    if ($isViewing) {
      return asset;
    }

    if (!asset) {
      return;
    }

    await goto(asHref(asset));
  };
  const setProgressDuration = (asset: AssetResponseDto) => {
    if (asset.type === AssetTypeEnum.Video) {
      const timeParts = asset.duration.split(':').map(Number);
      const durationInMilliseconds = (timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2]) * 1000;
      progressBarController = new Tween<number>(0, {
        duration: (from: number, to: number) => (to ? durationInMilliseconds * (to - from) : 0),
      });
    } else {
      progressBarController = new Tween<number>(0, {
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
  const handleAction = async (callingContext: string, action: 'reset' | 'pause' | 'play') => {
    // leaving these log statements here as comments. Very useful to figure out what's going on during dev!
    // console.log(`handleAction[${callingContext}] called with: ${action}`);
    if (!progressBarController) {
      // console.log(`handleAction[${callingContext}] NOT READY!`);
      return;
    }

    switch (action) {
      case 'play': {
        try {
          paused = false;
          await videoPlayer?.play();
          await progressBarController.set(1);
        } catch (error) {
          // this may happen if browser blocks auto-play of the video on first page load. This can either be a setting
          // or just defaut in certain browsers on page load without any DOM interaction by user.
          console.error(`handleAction[${callingContext}] videoPlayer play problem: ${error}`);
          paused = true;
          await progressBarController.set(0);
        }
        break;
      }

      case 'pause': {
        paused = true;
        videoPlayer?.pause();
        await progressBarController.set(progressBarController.current);
        break;
      }

      case 'reset': {
        paused = false;
        videoPlayer?.pause();
        await progressBarController.set(0);
        break;
      }
    }
  };
  const handleProgress = async (progress: number) => {
    if (!progressBarController) {
      return;
    }

    if (progress === 1 && !paused) {
      await (current?.next ? handleNextAsset() : handlePromiseError(handleAction('handleProgressLast', 'pause')));
    }
  };

  const toProgressPercentage = (index: number) => {
    if (!progressBarController || current?.assetIndex === undefined) {
      return 0;
    }
    if (index < current?.assetIndex) {
      return 100;
    }
    if (index > current?.assetIndex) {
      return 0;
    }
    return progressBarController.current * 100;
  };

  const handleDeleteOrArchiveAssets = (ids: string[]) => {
    if (!current) {
      return;
    }
    memoryStore.hideAssetsFromMemory(ids);
    init(page);
  };
  const handleDeleteMemoryAsset = async () => {
    if (!current) {
      return;
    }

    await memoryStore.deleteAssetFromMemory(current.asset.id);
    init(page);
  };
  const handleDeleteMemory = async () => {
    if (!current) {
      return;
    }

    await memoryStore.deleteMemory(current.memory.id);
    notificationController.show({ message: $t('removed_memory'), type: NotificationType.Info });
    init(page);
  };
  const handleSaveMemory = async () => {
    if (!current) {
      return;
    }

    const newSavedState = !current.memory.isSaved;
    await memoryStore.updateMemorySaved(current.memory.id, newSavedState);
    notificationController.show({
      message: newSavedState ? $t('added_to_favorites') : $t('removed_from_favorites'),
      type: NotificationType.Info,
    });
    init(page);
  };
  const handleGalleryScrollsIntoView = () => {
    galleryInView = true;
    handlePromiseError(handleAction('galleryInView', 'pause'));
  };
  const handleGalleryScrollsOutOfView = () => {
    galleryInView = false;
    // only call play after the first page load. When page first loads the gallery will not be visible
    // and calling play here will result in duplicate invocation.
    if (!galleryFirstLoad) {
      handlePromiseError(handleAction('galleryOutOfView', 'play'));
    }
    galleryFirstLoad = false;
  };

  const loadFromParams = (page: Page | NavigationTarget | null) => {
    const assetId = page?.params?.assetId ?? page?.url.searchParams.get(QueryParameter.ID) ?? undefined;
    return memoryStore.getMemoryAsset(assetId);
  };

  const init = (target: Page | NavigationTarget | null) => {
    if (memoryStore.memories.length === 0) {
      return handlePromiseError(goto(AppRoute.PHOTOS));
    }

    current = loadFromParams(target);
    // Adjust the progress bar duration to the video length
    if (current) {
      setProgressDuration(current.asset);
    }
    playerInitialized = false;
  };

  const initPlayer = () => {
    const isVideoAssetButPlayerHasNotLoadedYet = current && current.asset.type === AssetTypeEnum.Video && !videoPlayer;
    if (playerInitialized || isVideoAssetButPlayerHasNotLoadedYet) {
      return;
    }
    if ($isViewing) {
      handlePromiseError(handleAction('initPlayer[AssetViewOpen]', 'pause'));
    } else {
      handlePromiseError(handleAction('initPlayer[AssetViewClosed]', 'reset'));
      handlePromiseError(handleAction('initPlayer[AssetViewClosed]', 'play'));
    }
    playerInitialized = true;
  };

  afterNavigate(({ from, to, type }) => {
    if (type === 'enter') {
      // afterNavigate triggers twice on first page load (once when mounted with 'enter' and then a second time
      // with the actual 'goto' to URL).
      return;
    }
    memoryStore.initialize().then(
      () => {
        let target = null;
        if (to?.params?.assetId) {
          target = to;
        } else if (from?.params?.assetId) {
          target = from;
        } else {
          target = page;
        }

        init(target);
        initPlayer();
      },
      (error) => {
        console.error(`Error loading memories: ${error}`);
      },
    );
  });

  $effect(() => {
    if (progressBarController) {
      handlePromiseError(handleProgress(progressBarController.current));
    }
  });

  $effect(() => {
    if (videoPlayer) {
      videoPlayer.muted = $videoViewerMuted;
      initPlayer();
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

      <FavoriteAction removeFavorite={assetInteraction.isAllFavorite} />

      <ButtonContextMenu icon={mdiDotsVertical} title={$t('menu')}>
        <DownloadAction menuItem />
        <ChangeDate menuItem />
        <ChangeLocation menuItem />
        <ArchiveAction menuItem unarchive={assetInteraction.isAllArchived} onArchive={handleDeleteOrArchiveAssets} />
        {#if $preferences.tags.enabled && assetInteraction.isAllUserOwned}
          <TagAction menuItem />
        {/if}
        <DeleteAssets menuItem onAssetDelete={handleDeleteOrArchiveAssets} />
      </ButtonContextMenu>
    </AssetSelectControlBar>
  </div>
{/if}

<section
  id="memory-viewer"
  class="w-full bg-immich-dark-gray"
  bind:this={memoryWrapper}
  use:resizeObserver={({ height, width }) => ((viewport.height = height), (viewport.width = width))}
>
  {#if current}
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
          onclick={() => handlePromiseError(handleAction('PlayPauseButtonClick', paused ? 'play' : 'pause'))}
          class="hover:text-black"
        />

        {#each current.memory.assets as asset, index (asset.id)}
          <a class="relative w-full py-2" href={asHref(asset)} aria-label={$t('view')}>
            <span class="absolute start-0 h-[2px] w-full bg-gray-500"></span>
            <span class="absolute start-0 h-[2px] bg-white" style:width={`${toProgressPercentage(index)}%`}></span>
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
        class="fixed top-20 z-30 start-1/2 -translate-x-1/2 transition-opacity"
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
    <section class="overflow-hidden pt-32 md:pt-20" bind:clientHeight={viewerHeight}>
      <div
        class="ms-[-100%] box-border flex h-[calc(100vh_-_224px)] md:h-[calc(100vh_-_180px)] w-[300%] items-center justify-center gap-10 overflow-hidden"
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
              <div class="absolute bottom-4 end-4 text-start text-white">
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
                {#if current.asset.type === AssetTypeEnum.Video}
                  <video
                    bind:this={videoPlayer}
                    autoplay
                    playsinline
                    class="h-full w-full rounded-2xl object-contain transition-all"
                    src={getAssetPlaybackUrl({ id: current.asset.id })}
                    poster={getAssetThumbnailUrl({ id: current.asset.id, size: AssetMediaSize.Preview })}
                    draggable="false"
                    muted={$videoViewerMuted}
                    volume={$videoViewerVolume}
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
              class="absolute bottom-0 end-0 p-2 transition-all flex h-full justify-between flex-col items-end gap-2"
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
                  onclick={() => handleSaveMemory()}
                  class="text-white dark:text-white w-[48px] h-[48px]"
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
                  onclick={() => handlePromiseError(handleAction('ContextMenuClick', 'pause'))}
                  direction="left"
                  size="20"
                  align="bottom-right"
                  class="text-white dark:text-white"
                >
                  <MenuOption onClick={() => handleDeleteMemory()} text={$t('remove_memory')} icon={mdiCardsOutline} />
                  <MenuOption
                    onClick={() => handleDeleteMemoryAsset()}
                    text={$t('remove_photo_from_memory')}
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
              <div class="absolute top-1/2 start-0 ms-4">
                <CircleIconButton
                  title={$t('previous_memory')}
                  icon={mdiChevronLeft}
                  color="dark"
                  onclick={handlePreviousAsset}
                />
              </div>
            {/if}

            {#if current.next}
              <div class="absolute top-1/2 end-0 me-4">
                <CircleIconButton
                  title={$t('next_memory')}
                  icon={mdiChevronRight}
                  color="dark"
                  onclick={handleNextAsset}
                />
              </div>
            {/if}

            <div class="absolute start-8 top-4 text-sm font-medium text-white">
              <p>
                {fromLocalDateTime(current.memory.assets[0].localDateTime).toLocaleString(DateTime.DATE_FULL, {
                  locale: $locale,
                })}
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
              <div class="absolute bottom-4 start-4 text-start text-white">
                <p class="text-xs font-semibold text-gray-200">{$t('up_next').toUpperCase()}</p>
                <p class="text-xl">{$memoryLaneTitle(current.nextMemory)}</p>
              </div>
            {/if}
          </button>
        </div>
      </div>
    </section>
  {/if}
</section>
{#if current}
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
        onIntersect: handleGalleryScrollsIntoView,
        onSeparate: handleGalleryScrollsOutOfView,
        bottom: '-200px',
      }}
      bind:this={memoryGallery}
    >
      <GalleryViewer
        onNext={handleNextAsset}
        onPrevious={handlePreviousAsset}
        assets={current.memory.assets}
        viewport={galleryViewport}
        {assetInteraction}
        slidingWindowOffset={viewerHeight}
      />
    </div>
  </section>
{/if}

<style>
  .main-view {
    box-shadow:
      0 4px 4px 0 rgba(0, 0, 0, 0.3),
      0 8px 12px 6px rgba(0, 0, 0, 0.15);
  }
</style>
