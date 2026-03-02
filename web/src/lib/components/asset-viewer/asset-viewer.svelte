<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { focusTrap } from '$lib/actions/focus-trap';
  import type { Action, OnAction, PreAction } from '$lib/components/asset-viewer/actions/action';
  import NextAssetAction from '$lib/components/asset-viewer/actions/next-asset-action.svelte';
  import PreviousAssetAction from '$lib/components/asset-viewer/actions/previous-asset-action.svelte';
  import AssetViewerNavBar from '$lib/components/asset-viewer/asset-viewer-nav-bar.svelte';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import { AssetAction, ProjectionType } from '$lib/constants';
  import { activityManager } from '$lib/managers/activity-manager.svelte';
  import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { editManager, EditToolType } from '$lib/managers/edit/edit-manager.svelte';
  import { eventManager } from '$lib/managers/event-manager.svelte';
  import { imageManager } from '$lib/managers/ImageManager.svelte';
  import { Route } from '$lib/route';
  import { getAssetActions } from '$lib/services/asset.service';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { ocrManager } from '$lib/stores/ocr.svelte';
  import { alwaysLoadOriginalVideo } from '$lib/stores/preferences.store';
  import { SlideshowNavigation, SlideshowState, slideshowStore } from '$lib/stores/slideshow.store';
  import { user } from '$lib/stores/user.store';
  import { getSharedLink, handlePromiseError } from '$lib/utils';
  import type { OnUndoDelete } from '$lib/utils/actions';
  import { navigateToAsset } from '$lib/utils/asset-utils';
  import { handleError } from '$lib/utils/handle-error';
  import { InvocationTracker } from '$lib/utils/invocationTracker';
  import { SlideshowHistory } from '$lib/utils/slideshow-history';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
  import {
    AssetTypeEnum,
    getAllAlbums,
    getAssetInfo,
    getStack,
    type AlbumResponseDto,
    type AssetResponseDto,
    type PersonResponseDto,
    type StackResponseDto,
  } from '@immich/sdk';
  import { CommandPaletteDefaultProvider } from '@immich/ui';
  import { onDestroy, onMount, untrack } from 'svelte';
  import { t } from 'svelte-i18n';
  import { fly } from 'svelte/transition';
  import Thumbnail from '../assets/thumbnail/thumbnail.svelte';
  import ActivityStatus from './activity-status.svelte';
  import ActivityViewer from './activity-viewer.svelte';
  import DetailPanel from './detail-panel.svelte';
  import EditorPanel from './editor/editor-panel.svelte';
  import CropArea from './editor/transform-tool/crop-area.svelte';
  import ImagePanoramaViewer from './image-panorama-viewer.svelte';
  import OcrButton from './ocr-button.svelte';
  import PhotoViewer from './photo-viewer.svelte';
  import SlideshowBar from './slideshow-bar.svelte';
  import VideoViewer from './video-wrapper-viewer.svelte';

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
    onAssetChange?: (asset: AssetResponseDto) => void;
    preAction?: PreAction;
    onAction?: OnAction;
    onUndoDelete?: OnUndoDelete;
    onClose?: (asset: AssetResponseDto) => void;
    onRandom?: () => Promise<{ id: string } | undefined>;
  }

  let {
    cursor,
    showNavigation = true,
    withStacked = false,
    isShared = false,
    album,
    person,
    onAssetChange,
    preAction,
    onAction,
    onUndoDelete,
    onClose,
    onRandom,
  }: Props = $props();

  const { setAssetId } = assetViewingStore;
  const {
    restartProgress: restartSlideshowProgress,
    stopProgress: stopSlideshowProgress,
    slideshowNavigation,
    slideshowState,
    slideshowTransition,
    slideshowRepeat,
  } = slideshowStore;
  const stackThumbnailSize = 60;
  const stackSelectedThumbnailSize = 65;

  const asset = $derived(cursor.current);
  const nextAsset = $derived(cursor.nextAsset);
  const previousAsset = $derived(cursor.previousAsset);
  let appearsInAlbums: AlbumResponseDto[] = $state([]);
  let sharedLink = getSharedLink();
  let previewStackedAsset: AssetResponseDto | undefined = $state();
  let fullscreenElement = $state<Element>();
  let unsubscribes: (() => void)[] = [];
  let stack: StackResponseDto | null = $state(null);

  let playOriginalVideo = $state($alwaysLoadOriginalVideo);
  let slideshowStartAssetId = $state<string>();

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
      imageManager.preload(stack?.assets[1]);
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
    syncAssetViewerOpenClass(true);
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

    await onAlbumAddAssets();
  });

  onDestroy(() => {
    for (const unsubscribe of unsubscribes) {
      unsubscribe();
    }

    activityManager.reset();
    assetViewerManager.closeEditor();
    syncAssetViewerOpenClass(false);
  });

  const onAlbumAddAssets = async () => {
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

  const closeEditor = async () => {
    if (editManager.hasAppliedEdits) {
      const refreshedAsset = await getAssetInfo({ id: asset.id });
      onAssetChange?.(refreshedAsset);
      assetViewingStore.setAsset(refreshedAsset);
    }
    assetViewerManager.closeEditor();
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
    imageManager.cancel(asset);
    if (tracker.isActive()) {
      return;
    }

    void tracker.invoke(async () => {
      let hasNext: boolean;

      if ($slideshowState === SlideshowState.PlaySlideshow && $slideshowNavigation === SlideshowNavigation.Shuffle) {
        hasNext = order === 'previous' ? slideshowHistory.previous() : slideshowHistory.next();
        if (!hasNext) {
          const asset = await onRandom?.();
          if (asset) {
            slideshowHistory.queue(asset);
            hasNext = true;
          }
        }
      } else {
        hasNext =
          order === 'previous' ? await navigateToAsset(cursor.previousAsset) : await navigateToAsset(cursor.nextAsset);
      }

      if ($slideshowState === SlideshowState.PlaySlideshow) {
        if (hasNext) {
          $restartSlideshowProgress = true;
        } else if ($slideshowRepeat && slideshowStartAssetId) {
          // Loop back to starting asset
          await setAssetId(slideshowStartAssetId);
          $restartSlideshowProgress = true;
        } else {
          await handleStopSlideshow();
        }
      }
    }, $t('error_while_navigating'));
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
    slideshowStartAssetId = asset.id;
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
      case AssetAction.DELETE:
      case AssetAction.TRASH: {
        eventManager.emit('AssetsDelete', [asset.id]);
        break;
      }
      case AssetAction.REMOVE_ASSET_FROM_STACK: {
        stack = action.stack;
        if (stack) {
          cursor.current = stack.assets[0];
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
        cursor.current = { ...asset, people: assetInfo.people };
        break;
      }
      case AssetAction.RATING: {
        cursor.current = {
          ...asset,
          exifInfo: {
            ...asset.exifInfo,
            rating: action.rating,
          },
        };
        break;
      }
      case AssetAction.UNSTACK: {
        closeViewer();
        break;
      }
    }

    onAction?.(action);
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

  const syncAssetViewerOpenClass = (isOpen: boolean) => {
    if (browser) {
      document.body.classList.toggle('asset-viewer-open', isOpen);
    }
  };

  const refresh = async () => {
    await refreshStack();
    await onAlbumAddAssets();
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
    imageManager.preload(cursor.nextAsset);
    imageManager.preload(cursor.previousAsset);
  });

  const onAssetReplace = async ({ oldAssetId, newAssetId }: { oldAssetId: string; newAssetId: string }) => {
    if (oldAssetId !== asset.id) {
      return;
    }

    await new Promise((promise) => setTimeout(promise, 500));
    await goto(Route.viewAsset({ id: newAssetId }));
  };

  const onAssetUpdate = (update: AssetResponseDto) => {
    if (asset.id === update.id) {
      cursor = { ...cursor, current: update };
    }
  };

  const viewerKind = $derived.by(() => {
    if (previewStackedAsset) {
      return asset.type === AssetTypeEnum.Image ? 'StackPhotoViewer' : 'StackVideoViewer';
    }
    if (asset.type === AssetTypeEnum.Video) {
      return 'VideoViewer';
    }
    if (assetViewerManager.isPlayingMotionPhoto && asset.livePhotoVideoId) {
      return 'LiveVideoViewer';
    }
    if (
      asset.exifInfo?.projectionType === ProjectionType.EQUIRECTANGULAR ||
      (asset.originalPath && asset.originalPath.toLowerCase().endsWith('.insp'))
    ) {
      return 'ImagePanaramaViewer';
    }
    if (assetViewerManager.isShowEditor && editManager.selectedTool?.type === EditToolType.Transform) {
      return 'CropArea';
    }
    return 'PhotoViewer';
  });

  const showActivityStatus = $derived(
    $slideshowState === SlideshowState.None &&
      isShared &&
      ((album && album.isActivityEnabled) || activityManager.commentCount > 0) &&
      !activityManager.isLoading,
  );

  const showOcrButton = $derived(
    $slideshowState === SlideshowState.None &&
      asset.type === AssetTypeEnum.Image &&
      !assetViewerManager.isShowEditor &&
      ocrManager.hasOcrData,
  );

  const { Tag } = $derived(getAssetActions($t, asset));
  const showDetailPanel = $derived(
    asset.hasMetadata &&
      $slideshowState === SlideshowState.None &&
      assetViewerManager.isShowDetailPanel &&
      !assetViewerManager.isShowEditor,
  );
</script>

<CommandPaletteDefaultProvider name={$t('assets')} actions={[Tag]} />
<OnEvents {onAssetReplace} {onAssetUpdate} {onAlbumAddAssets} />

<svelte:document bind:fullscreenElement />

<section
  id="immich-asset-viewer"
  class="fixed start-0 top-0 grid size-full grid-cols-4 grid-rows-[64px_1fr] overflow-hidden bg-black"
  use:focusTrap
  bind:this={assetViewerHtmlElement}
>
  <!-- Top navigation bar -->
  {#if $slideshowState === SlideshowState.None && !assetViewerManager.isShowEditor}
    <div class="col-span-4 col-start-1 row-span-1 row-start-1 transition-transform">
      <AssetViewerNavBar
        {asset}
        {album}
        {person}
        {stack}
        showSlideshow={true}
        preAction={handlePreAction}
        onAction={handleAction}
        {onUndoDelete}
        onPlaySlideshow={() => ($slideshowState = SlideshowState.PlaySlideshow)}
        onClose={onClose ? () => onClose(asset) : undefined}
        {playOriginalVideo}
        {setPlayOriginalVideo}
      />
    </div>
  {/if}

  {#if $slideshowState != SlideshowState.None}
    <div class="absolute w-full flex justify-center">
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

  {#if $slideshowState === SlideshowState.None && showNavigation && !assetViewerManager.isShowEditor && previousAsset}
    <div class="my-auto col-span-1 col-start-1 row-span-full row-start-1 justify-self-start">
      <PreviousAssetAction onPreviousAsset={() => navigateAsset('previous')} />
    </div>
  {/if}

  <!-- Asset Viewer -->
  <div class="z-[-1] relative col-start-1 col-span-4 row-start-1 row-span-full">
    {#if viewerKind === 'StackPhotoViewer'}
      <PhotoViewer
        cursor={{ ...cursor, current: previewStackedAsset! }}
        onPreviousAsset={() => navigateAsset('previous')}
        onNextAsset={() => navigateAsset('next')}
        haveFadeTransition={false}
        {sharedLink}
      />
    {:else if viewerKind === 'StackVideoViewer'}
      <VideoViewer
        asset={previewStackedAsset!}
        cacheKey={previewStackedAsset!.thumbhash}
        projectionType={previewStackedAsset!.exifInfo?.projectionType}
        loopVideo={true}
        onPreviousAsset={() => navigateAsset('previous')}
        onNextAsset={() => navigateAsset('next')}
        onClose={closeViewer}
        onVideoEnded={() => navigateAsset()}
        onVideoStarted={handleVideoStarted}
        {playOriginalVideo}
      />
    {:else if viewerKind === 'LiveVideoViewer'}
      <VideoViewer
        {asset}
        assetId={asset.livePhotoVideoId!}
        cacheKey={asset.thumbhash}
        projectionType={asset.exifInfo?.projectionType}
        loopVideo={$slideshowState !== SlideshowState.PlaySlideshow}
        onPreviousAsset={() => navigateAsset('previous')}
        onNextAsset={() => navigateAsset('next')}
        onVideoEnded={() => (assetViewerManager.isPlayingMotionPhoto = false)}
        {playOriginalVideo}
      />
    {:else if viewerKind === 'ImagePanaramaViewer'}
      <ImagePanoramaViewer {asset} />
    {:else if viewerKind === 'CropArea'}
      <CropArea {asset} />
    {:else if viewerKind === 'PhotoViewer'}
      <PhotoViewer
        {cursor}
        onPreviousAsset={() => navigateAsset('previous')}
        onNextAsset={() => navigateAsset('next')}
        {sharedLink}
        haveFadeTransition={$slideshowState !== SlideshowState.None && $slideshowTransition}
      />
    {:else if viewerKind === 'VideoViewer'}
      <VideoViewer
        {asset}
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

    {#if showActivityStatus}
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

    {#if showOcrButton}
      <div class="absolute bottom-0 end-0 mb-6 me-6">
        <OcrButton />
      </div>
    {/if}
  </div>

  {#if $slideshowState === SlideshowState.None && showNavigation && !assetViewerManager.isShowEditor && nextAsset}
    <div class="my-auto col-span-1 col-start-4 row-span-full row-start-1 justify-self-end">
      <NextAssetAction onNextAsset={() => navigateAsset('next')} />
    </div>
  {/if}

  {#if showDetailPanel || assetViewerManager.isShowEditor}
    <div
      transition:fly={{ duration: 150 }}
      id="detail-panel"
      class="row-start-1 row-span-4 overflow-y-auto transition-all dark:border-l dark:border-s-immich-dark-gray bg-light"
      translate="yes"
    >
      {#if showDetailPanel}
        <div class="w-90 h-full">
          <DetailPanel {asset} currentAlbum={album} albums={appearsInAlbums} />
        </div>
      {:else if assetViewerManager.isShowEditor}
        <div class="w-100 h-full">
          <EditorPanel {asset} onClose={closeEditor} />
        </div>
      {/if}
    </div>
  {/if}

  {#if stack && withStacked && !assetViewerManager.isShowEditor}
    {@const stackedAssets = stack.assets}
    <div id="stack-slideshow" class="absolute bottom-0 w-full col-span-4 col-start-1 pointer-events-none">
      <div class="relative flex flex-row no-wrap overflow-x-auto overflow-y-hidden horizontal-scrollbar">
        {#each stackedAssets as stackedAsset (stackedAsset.id)}
          <div
            class={['inline-block px-1 relative transition-all pb-2 pointer-events-auto']}
            style:bottom={stackedAsset.id === asset.id ? '0' : '-10px'}
          >
            <Thumbnail
              imageClass={{ 'border-2 border-white': stackedAsset.id === asset.id }}
              brokenAssetClass="text-xs"
              dimmed={stackedAsset.id !== asset.id}
              asset={toTimelineAsset(stackedAsset)}
              onClick={() => {
                cursor.current = stackedAsset;
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
      class="row-start-1 row-span-5 w-90 md:w-115 overflow-y-auto transition-all dark:border-l dark:border-s-immich-dark-gray"
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
