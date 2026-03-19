<script lang="ts">
  import { afterNavigate, goto } from '$app/navigation';
  import { page } from '$app/state';
  import { shortcuts } from '$lib/actions/shortcut';
  import MemoryPhotoViewer from '$lib/components/memory-page/memory-photo-viewer.svelte';
  import MemoryVideoViewer from '$lib/components/memory-page/memory-video-viewer.svelte';
  import ButtonContextMenu from '$lib/components/shared-components/context-menu/button-context-menu.svelte';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import ControlAppBar from '$lib/components/shared-components/control-app-bar.svelte';
  import GalleryViewer from '$lib/components/shared-components/gallery-viewer/gallery-viewer.svelte';
  import ArchiveAction from '$lib/components/timeline/actions/ArchiveAction.svelte';
  import ChangeDate from '$lib/components/timeline/actions/ChangeDateAction.svelte';
  import ChangeDescription from '$lib/components/timeline/actions/ChangeDescriptionAction.svelte';
  import ChangeLocation from '$lib/components/timeline/actions/ChangeLocationAction.svelte';
  import CreateSharedLink from '$lib/components/timeline/actions/CreateSharedLinkAction.svelte';
  import DeleteAssets from '$lib/components/timeline/actions/DeleteAssetsAction.svelte';
  import DownloadAction from '$lib/components/timeline/actions/DownloadAction.svelte';
  import FavoriteAction from '$lib/components/timeline/actions/FavoriteAction.svelte';
  import TagAction from '$lib/components/timeline/actions/TagAction.svelte';
  import AssetSelectControlBar from '$lib/components/timeline/AssetSelectControlBar.svelte';
  import { QueryParameter } from '$lib/constants';
  import { assetMultiSelectManager } from '$lib/managers/asset-multi-select-manager.svelte';
  import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { eventManager } from '$lib/managers/event-manager.svelte';
  import { memoryManager, type MemoryAsset } from '$lib/managers/memory-manager.svelte';
  import type { TimelineAsset, Viewport } from '$lib/managers/timeline-manager/types';
  import { viewTransitionManager } from '$lib/managers/ViewTransitionManager.svelte';
  import { Route } from '$lib/route';
  import { getAssetBulkActions } from '$lib/services/asset.service';
  import { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { mediaQueryManager } from '$lib/stores/media-query-manager.svelte';
  import { memoryStore, type MemoryAsset } from '$lib/stores/memory.store.svelte';
  import { locale, videoViewerMuted, videoViewerVolume } from '$lib/stores/preferences.store';
  import { getAssetMediaUrl, handlePromiseError, memoryLaneTitle } from '$lib/utils';
  import { fromISODateTimeUTC, toTimelineAsset } from '$lib/utils/timeline-util';
  import { AssetMediaSize, AssetTypeEnum, getAssetInfo } from '@immich/sdk';
  import { ActionButton, IconButton, toastManager } from '@immich/ui';
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
    mdiSelectAll,
    mdiVolumeHigh,
    mdiVolumeOff,
  } from '@mdi/js';
  import type { NavigationTarget, Page } from '@sveltejs/kit';
  import { DateTime } from 'luxon';
  import { tick } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { Attachment } from 'svelte/attachments';
  import { Tween } from 'svelte/motion';

  let memoryGallery: HTMLElement | undefined = $state();
  let memoryWrapper: HTMLElement | undefined = $state();
  let galleryInView = $state(false);
  let galleryFirstLoad = $state(true);
  let playerInitialized = $state(false);
  let paused = $state(false);
  let current = $state<MemoryAsset | undefined>(undefined);
  const currentAssetId = $derived(current?.asset.id);
  const currentAssetDto = $derived(current ? current.memory.assets[current.assetIndex] : undefined);
  const currentMemoryAssetFull = $derived.by(async () =>
    currentAssetId ? await getAssetInfo({ ...authManager.params, id: currentAssetId }) : undefined,
  );
  let currentTimelineAssets = $derived(current?.memory.assets ?? []);
  let viewerAssets = $derived([
    ...(current?.previousMemory?.assets ?? []),
    ...(current?.memory.assets ?? []),
    ...(current?.nextMemory?.assets ?? []),
  ]);

  let isSaved = $derived(current?.memory.isSaved);
  let viewerHeight = $state(0);
  let transition = $state({
    name: undefined as string | undefined,
    previousPanel: undefined as string | undefined,
    nextPanel: undefined as string | undefined,
    active: false,
  });
  const showTransitionOverlays = $derived(transition.active || transition.name === 'hero');
  const showNavButtonOverlay = $derived(transition.name === 'hero');

  const viewport: Viewport = $state({ width: 0, height: 0 });
  // need to include padding in the viewport for gallery
  const galleryViewport: Viewport = $derived({ height: viewport.height, width: viewport.width - 32 });
  let progressBarController: Tween<number> | undefined = $state(undefined);
  let videoPlayer: HTMLVideoElement | undefined = $state();
  const asHref = (asset: { id: string }) => `?${QueryParameter.ID}=${asset.id}`;

  const setProgressDuration = (asset: TimelineAsset) => {
    if (asset.isVideo) {
      const timeParts = asset.duration!.split(':').map(Number);
      const durationInMilliseconds = (timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2]) * 1000;
      progressBarController = new Tween<number>(0, {
        duration: (from: number, to: number) => (to ? durationInMilliseconds * (to - from) : 0),
      });
    } else {
      progressBarController = new Tween<number>(0, {
        duration: (from: number, to: number) =>
          to ? authManager.preferences.memories.duration * 1000 * (to - from) : 0,
      });
    }
  };

  const scrollToTop = () => {
    if (window.scrollY === 0) {
      return Promise.resolve();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return new Promise<void>((resolve) => {
      const timeout = setTimeout(resolve, 500);
      window.addEventListener(
        'scrollend',
        () => {
          clearTimeout(timeout);
          resolve();
        },
        { once: true },
      );
    });
  };

  const withMemoryTransition = async (
    asset: { id: string } | undefined,
    config: Omit<Parameters<typeof viewTransitionManager.startTransition>[0], 'onFinished'> & {
      onFinished?: () => void;
    },
  ) => {
    if ($isViewing || !asset) {
      return;
    }

    await scrollToTop();

    transition.active = true;
    viewTransitionManager
      .startTransition({
        ...config,
        onFinished: () => {
          transition.previousPanel = undefined;
          transition.nextPanel = undefined;
          transition.name = undefined;
          transition.active = false;
          config.onFinished?.();
        },
      })
      .catch((error: unknown) => console.error('[Memory] transition failed:', error));
  };

  const navigateWithTransition = (asset?: { id: string }) =>
    withMemoryTransition(asset, {
      types: ['memory-nav'],
      prepareOldSnapshot: () => {
        transition.name = 'memory-fade-out';
      },
      performUpdate: async () => {
        await goto(asHref(asset!));
        await eventManager.untilNext('ViewerOpenTransitionReady');
      },
      prepareNewSnapshot: () => {
        transition.name = 'memory-fade-in';
      },
    });

  const handleNextAsset = () => {
    const next = current?.next;
    if (next && next.memory.id !== current?.memory.id) {
      void navigateToMemory('next', next.asset);
    } else {
      void navigateWithTransition(next?.asset);
    }
  };
  const handlePreviousAsset = () => {
    const previous = current?.previous;
    if (previous && previous.memory.id !== current?.memory.id) {
      void navigateToMemory('previous', previous.asset);
    } else {
      void navigateWithTransition(previous?.asset);
    }
  };
  const navigateToMemory = (direction: 'next' | 'previous', asset?: { id: string }) => {
    const isNext = direction === 'next';
    const useHeroMorph = !mediaQueryManager.reducedMotion;

    return withMemoryTransition(asset, {
      types: ['memory'],
      prepareOldSnapshot: () => {
        if (useHeroMorph) {
          if (isNext) {
            transition.nextPanel = 'hero';
            transition.previousPanel = 'memory-departing';
          } else {
            transition.previousPanel = 'hero';
            transition.nextPanel = 'memory-departing';
          }
          transition.name = 'hero-out';
        } else {
          transition.name = 'memory-fade-out';
        }
      },
      performUpdate: async () => {
        transition.nextPanel = undefined;
        transition.previousPanel = undefined;
        if (useHeroMorph) {
          if (isNext) {
            transition.previousPanel = 'hero-out';
          } else {
            transition.nextPanel = 'hero-out';
          }
        }
        transition.name = useHeroMorph ? 'hero' : 'memory-fade-in';
        await goto(asHref(asset!));
        await eventManager.untilNext('ViewerOpenTransitionReady');
      },
    });
  };

  const handleNextMemory = () => void navigateToMemory('next', current?.nextMemory?.assets[0]);
  const handlePreviousMemory = () => void navigateToMemory('previous', current?.previousMemory?.assets[0]);
  const closeMemoryViewer = () => {
    if (current && current.assetIndex > 0 && !mediaQueryManager.reducedMotion) {
      const firstAsset = current.memory.assets[0];
      void withMemoryTransition(firstAsset, {
        types: ['memory-nav', 'memory-nav-fast'],
        prepareOldSnapshot: () => {
          transition.name = 'memory-fade-out';
        },
        performUpdate: async () => {
          await goto(asHref(firstAsset));
          await eventManager.untilNext('ViewerOpenTransitionReady');
        },
        prepareNewSnapshot: () => {
          transition.name = 'memory-fade-in';
        },
        onFinished: () => closeToTimeline(),
      });
    } else {
      closeToTimeline();
    }
  };

  const closeToTimeline = () => {
    const memoryId = current?.memory.id;
    let cardImage: HTMLElement | null | undefined;

    void viewTransitionManager.startTransition({
      types: ['memory-enter'],
      prepareOldSnapshot: () => {
        transition.name = 'hero';
      },
      performUpdate: async () => {
        transition.name = undefined;
        await goto(Route.photos());
        await tick();

        const memoryCard = memoryId
          ? document.querySelector<HTMLElement>(`[data-memory-id="${CSS.escape(memoryId)}"]`)
          : null;
        memoryCard?.scrollIntoView({ behavior: 'instant', inline: 'nearest', block: 'nearest' });
        cardImage = memoryCard?.querySelector<HTMLElement>('img');
        if (cardImage) {
          cardImage.style.viewTransitionName = 'hero';
          await tick();
        }
      },
      onFinished: () => {
        if (cardImage) {
          cardImage.style.viewTransitionName = '';
          cardImage = null;
        }
      },
    });
  };

  const handleEscape = closeMemoryViewer;
  const handleSelectAll = () =>
    assetMultiSelectManager.selectAssets(current?.memory.assets.map((a) => toTimelineAsset(a)) || []);

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
          // or just default in certain browsers on page load without any DOM interaction by user.
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

  const handleProgress = (progress: number) => {
    if (!progressBarController) {
      return;
    }

    if (progress === 1 && !paused && !transition.active) {
      if (current?.next) {
        handleNextAsset();
      } else {
        handlePromiseError(handleAction('handleProgressLast', 'pause'));
      }
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
    memoryManager.hideAssetsFromMemory(ids);
    init(page);
  };

  const handleDeleteMemoryAsset = async () => {
    if (!current) {
      return;
    }

    await memoryManager.deleteAssetFromMemory(current.asset.id);
    init(page);
  };

  const handleDeleteMemory = async () => {
    if (!current) {
      return;
    }

    await memoryManager.deleteMemory(current.memory.id);
    toastManager.primary($t('removed_memory'));
    init(page);
  };

  const handleSaveMemory = async () => {
    if (!current) {
      return;
    }

    const newSavedState = !current.memory.isSaved;
    await memoryManager.updateMemorySaved(current.memory.id, newSavedState);
    toastManager.primary(newSavedState ? $t('added_to_favorites') : $t('removed_from_favorites'));
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

  const galleryObserver: Attachment<HTMLElement> = (element) => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          handleGalleryScrollsIntoView();
        } else {
          handleGalleryScrollsOutOfView();
        }
      },
      { rootMargin: '0px 0px -200px 0px' },
    );

    observer.observe(element);
    return () => observer.disconnect();
  };

  const loadFromParams = (page: Page | NavigationTarget | null) => {
    const assetId = page?.params?.assetId ?? page?.url.searchParams.get(QueryParameter.ID) ?? undefined;
    return memoryManager.getMemoryAsset(assetId);
  };

  const init = (target: Page | NavigationTarget | null) => {
    if (memoryManager.memories.length === 0) {
      return handlePromiseError(goto(Route.photos()));
    }

    current = loadFromParams(target);
    // Adjust the progress bar duration to the video length
    if (current) {
      setProgressDuration(current.asset);
    }
    playerInitialized = false;
  };

  const resolveTransitionIfPending = () => {
    if (viewTransitionManager.activeViewTransition) {
      transition.name = 'hero';
      eventManager.emit('ViewerOpenTransitionReady');
      requestAnimationFrame(() => {
        transition.name = undefined;
      });
    }
  };

  const handleMemoryImageReady = () => {
    resolveTransitionIfPending();
    handlePromiseError(handleAction('resetAndPlay', 'reset'));
    handlePromiseError(handleAction('resetAndPlay', 'play'));
  };

  const initPlayer = () => {
    const isVideo = current && current.asset.isVideo;
    const isVideoAssetButPlayerHasNotLoadedYet = isVideo && !videoPlayer;
    if (playerInitialized || isVideoAssetButPlayerHasNotLoadedYet) {
      return;
    }
    if (assetViewerManager.isViewing) {
      handlePromiseError(handleAction('initPlayer[AssetViewOpen]', 'pause'));
    } else if (isVideo) {
      // Image assets will start playing when the image is loaded. Only autostart video assets.
      handleMemoryImageReady();
    }
    playerInitialized = true;
  };

  afterNavigate(({ from, to }) => {
    memoryManager.ready().then(
      () => {
        let target;
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
      handleProgress(progressBarController.current);
    }
  });

  $effect(() => {
    if (videoPlayer) {
      videoPlayer.muted = $videoViewerMuted;
      initPlayer();
    }
  });
</script>

<svelte:document
  use:shortcuts={assetViewerManager.isViewing
    ? []
    : [
        { shortcut: { key: 'ArrowRight' }, onShortcut: () => handleNextAsset() },
        { shortcut: { key: 'd' }, onShortcut: () => handleNextAsset() },
        { shortcut: { key: 'ArrowLeft' }, onShortcut: () => handlePreviousAsset() },
        { shortcut: { key: 'a' }, onShortcut: () => handlePreviousAsset() },
        { shortcut: { key: 'Escape' }, onShortcut: () => handleEscape() },
      ]}
/>

{#if assetMultiSelectManager.selectionActive}
  <div class="sticky top-0 z-1 dark">
    <AssetSelectControlBar forceDark>
      {@const Actions = getAssetBulkActions($t)}
      <CreateSharedLink />
      <IconButton
        shape="round"
        color="secondary"
        variant="ghost"
        aria-label={$t('select_all')}
        icon={mdiSelectAll}
        onclick={handleSelectAll}
      />

      <ActionButton action={Actions.AddToAlbum} />

      <FavoriteAction removeFavorite={assetMultiSelectManager.isAllFavorite} />

      <ButtonContextMenu icon={mdiDotsVertical} title={$t('menu')}>
        <DownloadAction menuItem />
        <ChangeDate menuItem />
        <ChangeDescription menuItem />
        <ChangeLocation menuItem />
        <ArchiveAction
          menuItem
          unarchive={assetMultiSelectManager.isAllArchived}
          onArchive={handleDeleteOrArchiveAssets}
        />
        {#if authManager.preferences.tags.enabled && assetMultiSelectManager.isAllUserOwned}
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
  bind:clientHeight={viewport.height}
  bind:clientWidth={viewport.width}
>
  {#if current}
    <ControlAppBar onClose={closeMemoryViewer} forceDark multiRow>
      {#snippet leading()}
        {#if current}
          <p class="text-lg">
            {$memoryLaneTitle(current.memory)}
          </p>
        {/if}
      {/snippet}

      <div class="flex place-content-center place-items-center gap-2 overflow-hidden">
        <div class="w-12.5 dark">
          <IconButton
            shape="round"
            variant="ghost"
            color="secondary"
            aria-label={paused ? $t('play_memories') : $t('pause_memories')}
            icon={paused ? mdiPlay : mdiPause}
            onclick={() => handlePromiseError(handleAction('PlayPauseButtonClick', paused ? 'play' : 'pause'))}
          />
        </div>

        {#each current.memory.assets as asset, index (asset.id)}
          <a class="relative w-full py-2" href={asHref(asset)} aria-label={$t('view')}>
            <span class="absolute start-0 h-0.5 w-full bg-gray-500"></span>
            <span class="absolute start-0 h-0.5 bg-white" style:width={`${toProgressPercentage(index)}%`}></span>
          </a>
        {/each}

        <div>
          <p class="text-small">
            {(current.assetIndex + 1).toLocaleString($locale)}/{current.memory.assets.length.toLocaleString($locale)}
          </p>
        </div>

        {#if currentTimelineAssets.some((asset) => asset.type === AssetTypeEnum.Video)}
          <div class="w-12.5 dark">
            <IconButton
              shape="round"
              variant="ghost"
              color="secondary"
              aria-label={$videoViewerMuted ? $t('unmute_memories') : $t('mute_memories')}
              icon={$videoViewerMuted ? mdiVolumeOff : mdiVolumeHigh}
              onclick={() => ($videoViewerMuted = !$videoViewerMuted)}
            />
          </div>
        {/if}
      </div>
    </ControlAppBar>

    {#if galleryInView}
      <div
        class="fixed top-10 start-1/2 -translate-x-1/2 transition-opacity dark z-1"
        class:opacity-0={!galleryInView}
        class:opacity-100={galleryInView}
      >
        <button
          type="button"
          onclick={() => memoryWrapper?.scrollIntoView({ behavior: 'smooth' })}
          disabled={!galleryInView}
        >
          <IconButton
            shape="round"
            color="secondary"
            aria-label={$t('hide_gallery')}
            icon={mdiChevronUp}
            onclick={() => {}}
          />
        </button>
      </div>
    {/if}
    <!-- Viewer -->
    <section class="overflow-hidden pt-32 md:pt-20" bind:clientHeight={viewerHeight}>
      <div
        class="ms-[-100%] box-border flex h-[calc(100vh-224px)] md:h-[calc(100vh-180px)] w-[300%] items-center justify-center gap-10 overflow-hidden"
      >
        <!-- PREVIOUS MEMORY -->
        <div
          class="h-1/2 w-[20vw] rounded-2xl opacity-25 transition-opacity duration-150 hover:opacity-70 {current.previousMemory
            ? ''
            : 'opacity-0!'}"
        >
          <button
            type="button"
            class="relative h-full w-full rounded-2xl"
            disabled={!current.previousMemory}
            onclick={handlePreviousMemory}
          >
            {#if current.previousMemory && current.previousMemory.assets.length > 0}
              <img
                class="h-full w-full rounded-2xl object-cover"
                src={getAssetMediaUrl({ id: current.previousMemory.assets[0].id, size: AssetMediaSize.Preview })}
                alt={$t('previous_memory')}
                draggable="false"
                style:view-transition-name={transition.previousPanel}
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
              <div
                class="absolute bottom-4 end-4 text-start text-white"
                style:view-transition-name={transition.active ? 'memory-overlay-prev' : undefined}
              >
                <p class="uppercase text-xs font-semibold text-gray-200">{$t('previous')}</p>
                <p class="text-xl">{$memoryLaneTitle(current.previousMemory)}</p>
              </div>
            {/if}
          </button>
        </div>

        <!-- CURRENT MEMORY -->
        <div class="main-view relative isolate h-full w-[70vw] rounded-2xl bg-black">
          {#key current.asset.id}
            {#if current.asset.isVideo}
              <MemoryVideoViewer
                asset={current.asset}
                bind:videoPlayer
                videoViewerMuted={$videoViewerMuted}
                videoViewerVolume={$videoViewerVolume}
              />
            {:else if currentAssetDto}
              <MemoryPhotoViewer
                asset={currentAssetDto}
                transitionName={transition.name}
                onImageLoad={handleMemoryImageReady}
                onError={resolveTransitionIfPending}
              />
            {/if}
          {/key}

          <div
            class="absolute bottom-0 end-0 p-2 transition-all flex h-full justify-between flex-col items-end gap-2 dark"
            class:opacity-0={galleryInView}
            class:opacity-100={!galleryInView}
            style:view-transition-name={showTransitionOverlays ? 'memory-controls' : undefined}
          >
            <div class="flex items-center">
              <IconButton
                icon={isSaved ? mdiHeart : mdiHeartOutline}
                shape="round"
                variant="ghost"
                color="secondary"
                aria-label={isSaved ? $t('unfavorite') : $t('favorite')}
                onclick={() => handleSaveMemory()}
                class="w-12 h-12"
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
                title={$t('menu')}
                onclick={() => handlePromiseError(handleAction('ContextMenuClick', 'pause'))}
                direction="left"
                size="medium"
                align="bottom-right"
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
              {#await currentMemoryAssetFull then asset}
                {#if asset}
                  <IconButton
                    href={Route.photos({ at: asset.stack?.primaryAssetId ?? asset.id })}
                    icon={mdiImageSearch}
                    aria-label={$t('view_in_timeline')}
                    color="secondary"
                    variant="ghost"
                    shape="round"
                  />
                {/if}
              {/await}
            </div>
          </div>
          <!-- CONTROL BUTTONS -->
          <div
            class="absolute inset-0 pointer-events-none"
            style:view-transition-name={showNavButtonOverlay ? 'memory-nav-buttons' : undefined}
          >
            {#if current.previous}
              <div class="absolute top-1/2 inset-s-0 ms-4 dark pointer-events-auto">
                <IconButton
                  shape="round"
                  aria-label={$t('previous_memory')}
                  icon={mdiChevronLeft}
                  variant="ghost"
                  color="secondary"
                  size="giant"
                  onclick={handlePreviousAsset}
                />
              </div>
            {/if}

            {#if current.next}
              <div class="absolute top-1/2 inset-e-0 me-4 dark pointer-events-auto">
                <IconButton
                  shape="round"
                  aria-label={$t('next_memory')}
                  icon={mdiChevronRight}
                  variant="ghost"
                  color="secondary"
                  size="giant"
                  onclick={handleNextAsset}
                />
              </div>
            {/if}
          </div>

          <div
            class="absolute start-8 top-4 text-sm font-medium text-white"
            style:view-transition-name={showTransitionOverlays ? 'memory-overlay' : undefined}
          >
            <p>
              {fromISODateTimeUTC(current.memory.assets[0].localDateTime).toLocaleString(DateTime.DATE_FULL, {
                locale: $locale,
              })}
            </p>
            <p>
              {#await currentMemoryAssetFull then asset}
                {asset?.exifInfo?.city || ''}
                {asset?.exifInfo?.country || ''}
              {/await}
            </p>
          </div>
        </div>

        <!-- NEXT MEMORY -->
        <div
          class="h-1/2 w-[20vw] rounded-2xl opacity-25 transition-opacity duration-150 hover:opacity-70 {current.nextMemory
            ? ''
            : 'opacity-0!'}"
        >
          <button
            type="button"
            class="relative h-full w-full rounded-2xl"
            onclick={handleNextMemory}
            disabled={!current.nextMemory}
          >
            {#if current.nextMemory && current.nextMemory.assets.length > 0}
              <img
                class="h-full w-full rounded-2xl object-cover"
                src={getAssetMediaUrl({ id: current.nextMemory.assets[0].id, size: AssetMediaSize.Preview })}
                alt={$t('next_memory')}
                draggable="false"
                style:view-transition-name={transition.nextPanel}
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
              <div
                class="absolute bottom-4 start-4 text-start text-white"
                style:view-transition-name={transition.active ? 'memory-overlay-next' : undefined}
              >
                <p class="uppercase text-xs font-semibold text-gray-200">{$t('up_next')}</p>
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
      class="sticky mb-10 flex place-content-center place-items-center transition-all dark"
      class:opacity-0={galleryInView}
      class:opacity-100={!galleryInView}
    >
      <IconButton
        shape="round"
        color="secondary"
        aria-label={$t('show_gallery')}
        icon={mdiChevronDown}
        onclick={() => memoryGallery?.scrollIntoView({ behavior: 'smooth' })}
      />
    </div>

    <div id="gallery-memory" {@attach galleryObserver} bind:this={memoryGallery}>
      <GalleryViewer
        assets={currentTimelineAssets}
        {viewerAssets}
        viewport={galleryViewport}
        assetInteraction={assetMultiSelectManager}
        slidingWindowOffset={viewerHeight}
        arrowNavigation={false}
      />
    </div>
  </section>
{/if}

<style>
  .main-view {
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3)) drop-shadow(0 2px 6px rgba(0, 0, 0, 0.15));
  }
</style>
