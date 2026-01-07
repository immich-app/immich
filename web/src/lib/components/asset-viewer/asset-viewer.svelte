<script lang="ts">
  import { goto } from '$app/navigation';
  import { focusTrap } from '$lib/actions/focus-trap';
  import type { Action, OnAction, PreAction } from '$lib/components/asset-viewer/actions/action';
  import NextAssetAction from '$lib/components/asset-viewer/actions/next-asset-action.svelte';
  import PreviousAssetAction from '$lib/components/asset-viewer/actions/previous-asset-action.svelte';
  import AssetViewerNavBar from '$lib/components/asset-viewer/asset-viewer-nav-bar.svelte';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import { AppRoute, AssetAction, ProjectionType } from '$lib/constants';
  import { activityManager } from '$lib/managers/activity-manager.svelte';
  import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { preloadManager } from '$lib/managers/PreloadManager.svelte';
  import { closeEditorCofirm } from '$lib/stores/asset-editor.store';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { ocrManager } from '$lib/stores/ocr.svelte';
  import { alwaysLoadOriginalVideo } from '$lib/stores/preferences.store';
  import { SlideshowNavigation, SlideshowState, slideshowStore } from '$lib/stores/slideshow.store';
  import { user } from '$lib/stores/user.store';
  import { getAssetJobMessage, getAssetUrl, getSharedLink, handlePromiseError } from '$lib/utils';
  import type { OnUndoDelete } from '$lib/utils/actions';
  import { handleError } from '$lib/utils/handle-error';
  import { InvocationTracker } from '$lib/utils/invocationTracker';
  import { SlideshowHistory } from '$lib/utils/slideshow-history';
  import { preloadImageUrl } from '$lib/utils/sw-messaging';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
  import {
    AssetJobName,
    AssetTypeEnum,
    getAllAlbums,
    getAssetInfo,
    getStack,
    runAssetJobs,
    type AlbumResponseDto,
    type AssetResponseDto,
    type PersonResponseDto,
    type StackResponseDto,
  } from '@immich/sdk';
  import { toastManager } from '@immich/ui';
  import { onDestroy, onMount, untrack } from 'svelte';
  import { t } from 'svelte-i18n';
  import { fly } from 'svelte/transition';
  import Thumbnail from '../assets/thumbnail/thumbnail.svelte';
  import ActivityStatus from './activity-status.svelte';
  import ActivityViewer from './activity-viewer.svelte';
  import DetailPanel from './detail-panel.svelte';
  import CropArea from './editor/crop-tool/crop-area.svelte';
  import EditorPanel from './editor/editor-panel.svelte';
  import ImagePanoramaViewer from './image-panorama-viewer.svelte';
  import OcrButton from './ocr-button.svelte';
  import PhotoViewer from './photo-viewer.svelte';
  import SlideshowBar from './slideshow-bar.svelte';
  import VideoViewer from './video-wrapper-viewer.svelte';

  type HasAsset = boolean;

  export type AssetCursor = {
    current: AssetResponseDto;
    nextAsset?: AssetResponseDto;
    previousAsset?: AssetResponseDto;
  };

  interface Props {
    cursor: AssetCursor;
    showNavigation?: boolean;
    withStacked?: boolean;
    isShared?: boolean;
    album?: AlbumResponseDto;
    person?: PersonResponseDto;
    preAction?: PreAction;
    onAction?: OnAction;
    onUndoDelete?: OnUndoDelete;
    onClose?: (asset: AssetResponseDto) => void;
    onNext: () => Promise<HasAsset>;
    onPrevious: () => Promise<HasAsset>;
    onRandom: () => Promise<{ id: string } | undefined>;
    copyImage?: () => Promise<void>;
  }

  let {
    cursor,
    showNavigation = true,
    withStacked = false,
    isShared = false,
    album,
    person,
    preAction,
    onAction,
    onUndoDelete,
    onClose,
    onNext,
    onPrevious,
    onRandom,
    copyImage = $bindable(),
  }: Props = $props();

  const { setAssetId } = assetViewingStore;
  const {
    restartProgress: restartSlideshowProgress,
    stopProgress: stopSlideshowProgress,
    slideshowNavigation,
    slideshowState,
    slideshowTransition,
  } = slideshowStore;
  const stackThumbnailSize = 60;
  const stackSelectedThumbnailSize = 65;

  let asset = $derived(cursor.current);
  let appearsInAlbums: AlbumResponseDto[] = $state([]);
  let sharedLink = getSharedLink();
  let previewStackedAsset: AssetResponseDto | undefined = $state();
  let isShowEditor = $state(false);
  let fullscreenElement = $state<Element>();
  let unsubscribes: (() => void)[] = [];
  let selectedEditType: string = $state('');
  let stack: StackResponseDto | null = $state(null);

  let zoomToggle = $state(() => void 0);
  let playOriginalVideo = $state($alwaysLoadOriginalVideo);

  const setPlayOriginalVideo = (value: boolean) => {
    playOriginalVideo = value;
  };

  const refreshStack = async () => {
    if (authManager.isSharedLink) {
      return;
    }

    if (asset.stack) {
      stack = await getStack({ id: asset.stack.id });
    }

    if (!stack?.assets.some(({ id }) => id === asset.id)) {
      stack = null;
    }

    untrack(() => {
      if (stack && stack?.assets.length > 1) {
        preloadImageUrl(getAssetUrl({ asset: stack.assets[1] }));
      }
    });
  };

  const handleFavorite = async () => {
    if (album && album.isActivityEnabled) {
      try {
        await activityManager.toggleLike();
      } catch (error) {
        handleError(error, $t('errors.unable_to_change_favorite'));
      }
    }
  };

  onMount(async () => {
    unsubscribes.push(
      slideshowState.subscribe((value) => {
        if (value === SlideshowState.PlaySlideshow) {
          slideshowHistory.reset();
          slideshowHistory.queue(toTimelineAsset(asset));
          handlePromiseError(handlePlaySlideshow());
        } else if (value === SlideshowState.StopSlideshow) {
          handlePromiseError(handleStopSlideshow());
        }
      }),
      slideshowNavigation.subscribe((value) => {
        if (value === SlideshowNavigation.Shuffle) {
          slideshowHistory.reset();
          slideshowHistory.queue(toTimelineAsset(asset));
        }
      }),
    );

    if (!sharedLink) {
      await handleGetAllAlbums();
    }
  });

  onDestroy(() => {
    for (const unsubscribe of unsubscribes) {
      unsubscribe();
    }

    activityManager.reset();
  });

  const handleGetAllAlbums = async () => {
    if (authManager.isSharedLink) {
      return;
    }

    try {
      appearsInAlbums = await getAllAlbums({ assetId: asset.id });
    } catch (error) {
      console.error('Error getting album that asset belong to', error);
    }
  };

  const closeViewer = () => {
    onClose?.(asset);
  };

  const closeEditor = () => {
    closeEditorCofirm(() => {
      isShowEditor = false;
    });
  };

  const tracker = new InvocationTracker();

  const navigateAsset = (order?: 'previous' | 'next', e?: Event) => {
    if (!order) {
      if ($slideshowState === SlideshowState.PlaySlideshow) {
        order = $slideshowNavigation === SlideshowNavigation.AscendingOrder ? 'previous' : 'next';
      } else {
        return;
      }
    }

    e?.stopPropagation();
    preloadManager.cancel(asset);
    if (tracker.isActive()) {
      return;
    }

    void tracker.invoke(async () => {
      let hasNext = false;

      if ($slideshowState === SlideshowState.PlaySlideshow && $slideshowNavigation === SlideshowNavigation.Shuffle) {
        hasNext = order === 'previous' ? slideshowHistory.previous() : slideshowHistory.next();
        if (!hasNext) {
          const asset = await onRandom();
          if (asset) {
            slideshowHistory.queue(asset);
            hasNext = true;
          }
        }
      } else {
        hasNext = order === 'previous' ? await onPrevious() : await onNext();
      }

      if ($slideshowState === SlideshowState.PlaySlideshow) {
        if (hasNext) {
          $restartSlideshowProgress = true;
        } else {
          await handleStopSlideshow();
        }
      }
    });
  };

  const handleRunJob = async (name: AssetJobName) => {
    try {
      await runAssetJobs({ assetJobsDto: { assetIds: [asset.id], name } });
      toastManager.success($getAssetJobMessage(name));
    } catch (error) {
      handleError(error, $t('errors.unable_to_submit_job'));
    }
  };

  /**
   * Slide show mode
   */

  let assetViewerHtmlElement = $state<HTMLElement>();

  const slideshowHistory = new SlideshowHistory((asset) => {
    handlePromiseError(setAssetId(asset.id).then(() => ($restartSlideshowProgress = true)));
  });

  const handleVideoStarted = () => {
    if ($slideshowState === SlideshowState.PlaySlideshow) {
      $stopSlideshowProgress = true;
    }
  };

  const handlePlaySlideshow = async () => {
    try {
      await assetViewerHtmlElement?.requestFullscreen?.();
    } catch (error) {
      handleError(error, $t('errors.unable_to_enter_fullscreen'));
      $slideshowState = SlideshowState.StopSlideshow;
    }
  };

  const handleStopSlideshow = async () => {
    try {
      if (document.fullscreenElement) {
        document.body.style.cursor = '';
        await document.exitFullscreen();
      }
    } catch (error) {
      handleError(error, $t('errors.unable_to_exit_fullscreen'));
    } finally {
      $stopSlideshowProgress = true;
      $slideshowState = SlideshowState.None;
    }
  };

  const handleStackedAssetMouseEvent = (isMouseOver: boolean, asset: AssetResponseDto) => {
    previewStackedAsset = isMouseOver ? asset : undefined;
  };
  const handlePreAction = (action: Action) => {
    preAction?.(action);
  };
  const handleAction = async (action: Action) => {
    switch (action.type) {
      case AssetAction.ADD_TO_ALBUM: {
        await handleGetAllAlbums();
        break;
      }
      case AssetAction.REMOVE_ASSET_FROM_STACK: {
        stack = action.stack;
        if (stack) {
          asset = stack.assets[0];
        }
        break;
      }
      case AssetAction.STACK:
      case AssetAction.SET_STACK_PRIMARY_ASSET: {
        stack = action.stack;
        break;
      }
      case AssetAction.SET_PERSON_FEATURED_PHOTO: {
        const assetInfo = await getAssetInfo({ id: asset.id });
        asset = { ...asset, people: assetInfo.people };
        break;
      }
      case AssetAction.RATING: {
        asset = {
          ...asset,
          exifInfo: {
            ...asset.exifInfo,
            rating: action.rating,
          },
        };
        break;
      }
      case AssetAction.KEEP_THIS_DELETE_OTHERS:
      case AssetAction.UNSTACK: {
        closeViewer();
        break;
      }
    }

    onAction?.(action);
  };

  const handleUpdateSelectedEditType = (type: string) => {
    selectedEditType = type;
  };

  const handleAssetReplace = async ({ oldAssetId, newAssetId }: { oldAssetId: string; newAssetId: string }) => {
    if (oldAssetId !== asset.id) {
      return;
    }

    await new Promise((promise) => setTimeout(promise, 500));
    await goto(`${AppRoute.PHOTOS}/${newAssetId}`);
  };

  let isFullScreen = $derived(fullscreenElement !== null);

  $effect(() => {
    if (album && !album.isActivityEnabled && activityManager.commentCount === 0) {
      assetViewerManager.closeActivityPanel();
    }
  });
  $effect(() => {
    if (album && isShared && asset.id) {
      handlePromiseError(activityManager.init(album.id, asset.id));
    }
  });

  const refresh = async () => {
    await refreshStack();
    await handleGetAllAlbums();
    ocrManager.clear();
    if (!sharedLink) {
      if (previewStackedAsset) {
        await ocrManager.getAssetOcr(previewStackedAsset.id);
      }
      await ocrManager.getAssetOcr(asset.id);
    }
  };

  $effect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    asset;
    untrack(() => handlePromiseError(refresh()));
    preloadManager.preload(cursor.nextAsset);
    preloadManager.preload(cursor.previousAsset);
  });
</script>

<OnEvents onAssetReplace={handleAssetReplace} />

<svelte:document bind:fullscreenElement />

<section
  id="immich-asset-viewer"
  class="fixed start-0 top-0 grid size-full grid-cols-4 grid-rows-[64px_1fr] overflow-hidden bg-black"
  use:focusTrap
  bind:this={assetViewerHtmlElement}
>
  <!-- Top navigation bar -->
  {#if $slideshowState === SlideshowState.None && !isShowEditor}
    <div class="col-span-4 col-start-1 row-span-1 row-start-1 transition-transform">
      <AssetViewerNavBar
        {asset}
        {album}
        {person}
        {stack}
        showSlideshow={true}
        onZoomImage={zoomToggle}
        onCopyImage={copyImage}
        preAction={handlePreAction}
        onAction={handleAction}
        {onUndoDelete}
        onRunJob={handleRunJob}
        onPlaySlideshow={() => ($slideshowState = SlideshowState.PlaySlideshow)}
        onClose={onClose ? () => onClose(asset) : undefined}
        {playOriginalVideo}
        {setPlayOriginalVideo}
      />
    </div>
  {/if}

  {#if $slideshowState != SlideshowState.None}
    <div class="absolute w-full flex">
      <SlideshowBar
        {isFullScreen}
        assetType={previewStackedAsset?.type ?? asset.type}
        onSetToFullScreen={() => assetViewerHtmlElement?.requestFullscreen?.()}
        onPrevious={() => navigateAsset('previous')}
        onNext={() => navigateAsset('next')}
        onClose={() => ($slideshowState = SlideshowState.StopSlideshow)}
      />
    </div>
  {/if}

  {#if $slideshowState === SlideshowState.None && showNavigation && !isShowEditor}
    <div class="my-auto column-span-1 col-start-1 row-span-full row-start-1 justify-self-start">
      <PreviousAssetAction onPreviousAsset={() => navigateAsset('previous')} />
    </div>
  {/if}

  <!-- Asset Viewer -->
  <div class="z-[-1] relative col-start-1 col-span-4 row-start-1 row-span-full">
    {#if previewStackedAsset}
      {#key previewStackedAsset.id}
        {#if previewStackedAsset.type === AssetTypeEnum.Image}
          <PhotoViewer
            bind:zoomToggle
            bind:copyImage
            cursor={{ ...cursor, current: previewStackedAsset }}
            onPreviousAsset={() => navigateAsset('previous')}
            onNextAsset={() => navigateAsset('next')}
            haveFadeTransition={false}
            {sharedLink}
          />
        {:else}
          <VideoViewer
            assetId={previewStackedAsset.id}
            cacheKey={previewStackedAsset.thumbhash}
            projectionType={previewStackedAsset.exifInfo?.projectionType}
            loopVideo={true}
            onPreviousAsset={() => navigateAsset('previous')}
            onNextAsset={() => navigateAsset('next')}
            onClose={closeViewer}
            onVideoEnded={() => navigateAsset()}
            onVideoStarted={handleVideoStarted}
            {playOriginalVideo}
          />
        {/if}
      {/key}
    {:else}
      {#key asset.id}
        {#if asset.type === AssetTypeEnum.Image}
          {#if assetViewerManager.isPlayingMotionPhoto && asset.livePhotoVideoId}
            <VideoViewer
              assetId={asset.livePhotoVideoId}
              cacheKey={asset.thumbhash}
              projectionType={asset.exifInfo?.projectionType}
              loopVideo={$slideshowState !== SlideshowState.PlaySlideshow}
              onPreviousAsset={() => navigateAsset('previous')}
              onNextAsset={() => navigateAsset('next')}
              onVideoEnded={() => (assetViewerManager.isPlayingMotionPhoto = false)}
              {playOriginalVideo}
            />
          {:else if asset.exifInfo?.projectionType === ProjectionType.EQUIRECTANGULAR || (asset.originalPath && asset.originalPath
                .toLowerCase()
                .endsWith('.insp'))}
            <ImagePanoramaViewer bind:zoomToggle {asset} />
          {:else if isShowEditor && selectedEditType === 'crop'}
            <CropArea {asset} />
          {:else}
            <PhotoViewer
              bind:zoomToggle
              bind:copyImage
              {cursor}
              onPreviousAsset={() => navigateAsset('previous')}
              onNextAsset={() => navigateAsset('next')}
              {sharedLink}
              haveFadeTransition={$slideshowState !== SlideshowState.None && $slideshowTransition}
            />
          {/if}
        {:else}
          <VideoViewer
            assetId={asset.id}
            cacheKey={asset.thumbhash}
            projectionType={asset.exifInfo?.projectionType}
            loopVideo={$slideshowState !== SlideshowState.PlaySlideshow}
            onPreviousAsset={() => navigateAsset('previous')}
            onNextAsset={() => navigateAsset('next')}
            onClose={closeViewer}
            onVideoEnded={() => navigateAsset()}
            onVideoStarted={handleVideoStarted}
            {playOriginalVideo}
          />
        {/if}

        {#if $slideshowState === SlideshowState.None && isShared && ((album && album.isActivityEnabled) || activityManager.commentCount > 0) && !activityManager.isLoading}
          <div class="absolute bottom-0 end-0 mb-20 me-8">
            <ActivityStatus
              disabled={!album?.isActivityEnabled}
              isLiked={activityManager.isLiked}
              numberOfComments={activityManager.commentCount}
              numberOfLikes={activityManager.likeCount}
              onFavorite={handleFavorite}
            />
          </div>
        {/if}

        {#if $slideshowState === SlideshowState.None && asset.type === AssetTypeEnum.Image && !isShowEditor && ocrManager.hasOcrData}
          <div class="absolute bottom-0 end-0 mb-6 me-6">
            <OcrButton />
          </div>
        {/if}
      {/key}
    {/if}
  </div>

  {#if $slideshowState === SlideshowState.None && showNavigation && !isShowEditor}
    <div class="my-auto col-span-1 col-start-4 row-span-full row-start-1 justify-self-end">
      <NextAssetAction onNextAsset={() => navigateAsset('next')} />
    </div>
  {/if}

  {#if asset.hasMetadata && $slideshowState === SlideshowState.None && assetViewerManager.isShowDetailPanel && !isShowEditor}
    <div
      transition:fly={{ duration: 150 }}
      id="detail-panel"
      class="row-start-1 row-span-4 w-[360px] overflow-y-auto transition-all dark:border-l dark:border-s-immich-dark-gray bg-light"
      translate="yes"
    >
      <DetailPanel {asset} currentAlbum={album} albums={appearsInAlbums} />
    </div>
  {/if}

  {#if isShowEditor}
    <div
      transition:fly={{ duration: 150 }}
      id="editor-panel"
      class="row-start-1 row-span-4 w-[400px] overflow-y-auto transition-all dark:border-l dark:border-s-immich-dark-gray"
      translate="yes"
    >
      <EditorPanel {asset} onUpdateSelectedType={handleUpdateSelectedEditType} onClose={closeEditor} />
    </div>
  {/if}

  {#if stack && withStacked}
    {@const stackedAssets = stack.assets}
    <div id="stack-slideshow" class="absolute bottom-0 w-full col-span-4 col-start-1">
      <div class="relative flex flex-row no-wrap overflow-x-auto overflow-y-hidden horizontal-scrollbar">
        {#each stackedAssets as stackedAsset (stackedAsset.id)}
          <div
            class={['inline-block px-1 relative transition-all pb-2']}
            style:bottom={stackedAsset.id === asset.id ? '0' : '-10px'}
          >
            <Thumbnail
              imageClass={{ 'border-2 border-white': stackedAsset.id === asset.id }}
              brokenAssetClass="text-xs"
              dimmed={stackedAsset.id !== asset.id}
              asset={toTimelineAsset(stackedAsset)}
              onClick={() => {
                asset = stackedAsset;
                previewStackedAsset = undefined;
              }}
              onMouseEvent={({ isMouseOver }) => handleStackedAssetMouseEvent(isMouseOver, stackedAsset)}
              readonly
              thumbnailSize={stackedAsset.id === asset.id ? stackSelectedThumbnailSize : stackThumbnailSize}
              showStackedIcon={false}
              disableLinkMouseOver
            />

            {#if stackedAsset.id === asset.id}
              <div class="w-full flex place-items-center place-content-center">
                <div class="w-2 h-2 bg-white rounded-full flex mt-0.5"></div>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}

  {#if isShared && album && assetViewerManager.isShowActivityPanel && $user}
    <div
      transition:fly={{ duration: 150 }}
      id="activity-panel"
      class="row-start-1 row-span-5 w-[360px] md:w-[460px] overflow-y-auto transition-all dark:border-l dark:border-s-immich-dark-gray"
      translate="yes"
    >
      <ActivityViewer
        user={$user}
        disabled={!album.isActivityEnabled}
        assetType={asset.type}
        albumOwnerId={album.ownerId}
        albumId={album.id}
        assetId={asset.id}
      />
    </div>
  {/if}
</section>

<style>
  #immich-asset-viewer {
    contain: layout;
  }

  .horizontal-scrollbar::-webkit-scrollbar {
    width: 8px;
    height: 10px;
  }

  /* Track */
  .horizontal-scrollbar::-webkit-scrollbar-track {
    background: #000000;
    border-radius: 16px;
  }

  /* Handle */
  .horizontal-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(159, 159, 159, 0.408);
    border-radius: 16px;
  }

  /* Handle on hover */
  .horizontal-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #adcbfa;
    border-radius: 16px;
  }
</style>
