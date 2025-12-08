<script lang="ts">
  import { goto } from '$app/navigation';
  import { focusTrap } from '$lib/actions/focus-trap';
  import { loadImage } from '$lib/actions/image-loader.svelte';
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
  import { viewTransitionManager } from '$lib/managers/ViewTransitionManager.svelte';
  import { Route } from '$lib/route';
  import { getAssetActions } from '$lib/services/asset.service';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { ocrManager } from '$lib/stores/ocr.svelte';
  import { alwaysLoadOriginalVideo } from '$lib/stores/preferences.store';
  import { SlideshowNavigation, SlideshowState, slideshowStore } from '$lib/stores/slideshow.store';
  import { user } from '$lib/stores/user.store';
  import { getSharedLink, handlePromiseError } from '$lib/utils';
  import type { OnUndoDelete } from '$lib/utils/actions';
  import { AdaptiveImageLoader } from '$lib/utils/adaptive-image-loader.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { InvocationTracker } from '$lib/utils/invocationTracker';
  import { SlideshowHistory } from '$lib/utils/slideshow-history';

  import { navigateToAsset } from '$lib/utils/asset-utils';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
  import {
    AssetTypeEnum,
    getAssetInfo,
    getStack,
    type AlbumResponseDto,
    type AssetResponseDto,
    type PersonResponseDto,
    type StackResponseDto,
  } from '@immich/sdk';
  import { CommandPaletteDefaultProvider } from '@immich/ui';
  import { onDestroy, onMount, tick, untrack } from 'svelte';
  import { t } from 'svelte-i18n';
  import { fly, slide } from 'svelte/transition';
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

  const { setAssetId, invisible } = assetViewingStore;
  const {
    restartProgress: restartSlideshowProgress,
    stopProgress: stopSlideshowProgress,
    slideshowNavigation,
    slideshowState,
    slideshowRepeat,
  } = slideshowStore;
  const stackThumbnailSize = 60;
  const stackSelectedThumbnailSize = 65;

  let stack: StackResponseDto | undefined = $state();
  let selectedStackAsset = $derived(stack?.assets.find(({ id }) => id === stack?.primaryAssetId));
  let previewStackedAsset: AssetResponseDto | undefined = $state();

  const asset = $derived(previewStackedAsset ?? selectedStackAsset ?? cursor.current);
  const nextAsset = $derived(cursor.nextAsset);
  const previousAsset = $derived(cursor.previousAsset);

  let sharedLink = getSharedLink();
  let fullscreenElement = $state<Element>();

  let slideShowPlaying = $derived($slideshowState === SlideshowState.PlaySlideshow);
  let slideShowAscending = $derived($slideshowNavigation === SlideshowNavigation.AscendingOrder);
  let slideShowShuffle = $derived($slideshowNavigation === SlideshowNavigation.Shuffle);

  let playOriginalVideo = $state($alwaysLoadOriginalVideo);
  let slideshowStartAssetId = $state<string>();

  const setPlayOriginalVideo = (value: boolean) => {
    playOriginalVideo = value;
  };

  const refreshStack = async () => {
    if (authManager.isSharedLink || !withStacked) {
      return;
    }

    if (!cursor.current.stack) {
      stack = undefined;
      return;
    }

    stack = await getStack({ id: cursor.current.stack.id });
  };

  const handleFavorite = async () => {
    if (!album || !album.isActivityEnabled) {
      return;
    }

    try {
      await activityManager.toggleLike();
    } catch (error) {
      handleError(error, $t('errors.unable_to_change_favorite'));
    }
  };

  let transitionName = $state<string | undefined>('hero');
  let detailPanelTransitionName = $state<string | undefined>(undefined);

  let unsubscribes: (() => void)[] = [];
  onMount(() => {
    const addInfoTransition = () => {
      detailPanelTransitionName = 'info';
      transitionName = 'hero';
    };
    const finished = () => {
      detailPanelTransitionName = undefined;
      transitionName = undefined;
    };

    unsubscribes.push(
      eventManager.on({
        TransitionToAssetViewer: addInfoTransition,
        TransitionToTimeline: addInfoTransition,
        Finished: finished,
      }),
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
  });

  onDestroy(() => {
    activityManager.reset();

    for (const unsubscribe of unsubscribes) {
      unsubscribe();
    }

    destroyNextPreloader();
    destroyPreviousPreloader();
  });

  const closeViewer = () => {
    transitionName = 'hero';
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

  const startTransition = async (
    types: string[],
    targetTransition: string | null,
    targetAsset: AssetResponseDto | null,
    navigateFn: () => Promise<boolean>,
  ) => {
    const oldTransitionName = viewTransitionManager.getTransitionName('old', targetTransition);
    const newTransitionName = viewTransitionManager.getTransitionName('new', targetTransition);

    transitionName = oldTransitionName;
    detailPanelTransitionName = 'detail-panel';
    await tick();

    const navigationResult = new Promise<boolean>((navigationResolve) => {
      viewTransitionManager.startTransition(
        new Promise<void>((resolve) => {
          eventManager.once('StartViewTransition', async () => {
            transitionName = newTransitionName;
            await tick();
            const result = await navigateFn();
            navigationResolve(result);
          });
          eventManager.once('AssetViewerFree', () => void tick().then(resolve));
        }),
        types,
      );
    });
    return navigationResult;
  };

  let nextPreloader: AdaptiveImageLoader | undefined;
  let previousPreloader: AdaptiveImageLoader | undefined;
  let nextPreviewUrl = $state<string | undefined>();
  let previousPreviewUrl = $state<string | undefined>();

  const setPreviewUrl = (direction: 'next' | 'previous', url: string | undefined) => {
    if (direction === 'next') {
      nextPreviewUrl = url;
    } else {
      previousPreviewUrl = url;
    }
  };

  const startPreloader = (asset: AssetResponseDto | undefined, direction: 'next' | 'previous') => {
    if (!asset) {
      return;
    }
    const loader = new AdaptiveImageLoader(
      asset,
      undefined,
      {
        currentZoomFn: () => 1,
        onQualityUpgrade: (url) => setPreviewUrl(direction, url),
      },
      loadImage,
    );
    loader.start();
    return loader;
  };

  const destroyPreviousPreloader = () => {
    previousPreloader?.destroy();
    previousPreloader = undefined;
    previousPreviewUrl = undefined;
  };

  const destroyNextPreloader = () => {
    nextPreloader?.destroy();
    nextPreloader = undefined;
    nextPreviewUrl = undefined;
  };

  const cancelPreloadsBeforeNavigation = (direction: 'previous' | 'next') => {
    setPreviewUrl(direction, undefined);
    if (direction === 'next') {
      destroyPreviousPreloader();
      return;
    }
    destroyNextPreloader();
  };

  const updatePreloadsAfterNavigation = (oldCursor: AssetCursor, newCursor: AssetCursor) => {
    const movedForward = newCursor.current.id === oldCursor.nextAsset?.id;
    const movedBackward = newCursor.current.id === oldCursor.previousAsset?.id;

    const shouldDestroyPrevious = movedForward || !movedBackward;
    const shouldDestroyNext = movedBackward || !movedForward;

    if (movedForward) {
      // When moving forward: old next becomes current, shift preview URLs
      const oldNextUrl = nextPreviewUrl;
      destroyPreviousPreloader();
      previousPreviewUrl = oldNextUrl;
      destroyNextPreloader();
      nextPreloader = startPreloader(newCursor.nextAsset, 'next');
    } else if (movedBackward) {
      // When moving backward: old previous becomes current, shift preview URLs
      const oldPreviousUrl = previousPreviewUrl;
      destroyNextPreloader();
      nextPreviewUrl = oldPreviousUrl;
      destroyPreviousPreloader();
      previousPreloader = startPreloader(newCursor.previousAsset, 'previous');
    } else {
      // Non-adjacent navigation (e.g., slideshow random) - clear everything
      if (shouldDestroyPrevious) {
        destroyPreviousPreloader();
      }
      if (shouldDestroyNext) {
        destroyNextPreloader();
      }
      previousPreloader = startPreloader(newCursor.previousAsset, 'previous');
      nextPreloader = startPreloader(newCursor.nextAsset, 'next');
    }
  };

  const getNavigationTarget = (): 'previous' | 'next' | undefined => {
    if (slideShowPlaying) {
      return slideShowAscending ? 'previous' : 'next';
    }
    return undefined;
  };

  const completeNavigation = async (order: 'previous' | 'next', skipTransition: boolean) => {
    cancelPreloadsBeforeNavigation(order);
    let skipped = false;
    if (viewTransitionManager.skipTransitions()) {
      skipped = true;
    }
    let hasNext = false;
    if (slideShowPlaying && slideShowShuffle) {
      const navigate = async () => {
        let next = order === 'previous' ? slideshowHistory.previous() : slideshowHistory.next();
        if (!next) {
          const asset = await onRandom?.();
          if (asset) {
            slideshowHistory.queue(asset);
            next = true;
          }
        }
        return next;
      };
      // eslint-disable-next-line unicorn/prefer-ternary
      if (viewTransitionManager.isSupported() && !skipped && !skipTransition) {
        hasNext = await startTransition(['slideshow'], null, null, navigate);
      } else {
        hasNext = await navigate();
      }
    } else {
      const targetAsset = order === 'previous' ? previousAsset : nextAsset;
      const navigate = async () =>
        order === 'previous' ? await navigateToAsset(previousAsset) : await navigateToAsset(nextAsset);
      if (viewTransitionManager.isSupported() && !skipped && !skipTransition && !!targetAsset) {
        const targetTransition = slideShowPlaying ? null : order;
        hasNext = await startTransition(
          slideShowPlaying ? ['slideshow'] : ['viewer-nav'],
          targetTransition,
          targetAsset,
          navigate,
        );
      } else {
        hasNext = await navigate();
      }
    }

    if (!slideShowPlaying) {
      return;
    }

    if (hasNext) {
      $restartSlideshowProgress = true;
    } else if ($slideshowRepeat && slideshowStartAssetId) {
      await setAssetId(slideshowStartAssetId);
      $restartSlideshowProgress = true;
    } else {
      await handleStopSlideshow();
    }
  };

  const tracker = new InvocationTracker();
  const navigateAsset = (order?: 'previous' | 'next', skipTransition: boolean = false) => {
    if (!order) {
      if (slideShowPlaying) {
        order = slideShowAscending ? 'previous' : 'next';
      } else {
        return;
      }
    }

    if (tracker.isActive()) {
      return;
    }

    void tracker.invoke(
      () => completeNavigation(order, skipTransition),
      (error: unknown) => handleError(error, $t('error_while_navigating')),
      () => eventManager.emit('AssetViewerAfterNavigate'),
    );
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
      if (!document.fullscreenElement) {
        return;
      }
      document.body.style.cursor = '';
      await document.exitFullscreen();
    } catch (error) {
      handleError(error, $t('errors.unable_to_exit_fullscreen'));
    } finally {
      $stopSlideshowProgress = true;
      $slideshowState = SlideshowState.None;
    }
  };

  const handleStackedAssetMouseEvent = (isMouseOver: boolean, stackedAsset: AssetResponseDto) => {
    if (isMouseOver) {
      previewStackedAsset = stackedAsset;
    }
  };

  const handleStackedAssetsMouseLeave = () => {
    previewStackedAsset = undefined;
  };

  const handlePreAction = (action: Action) => {
    preAction?.(action);
  };

  const handleAction = async (action: Action) => {
    switch (action.type) {
      case AssetAction.ADD_TO_ALBUM: {
        eventManager.emit('AlbumAddAssets');
        break;
      }
      case AssetAction.DELETE:
      case AssetAction.TRASH: {
        eventManager.emit('AssetsDelete', [asset.id]);
        break;
      }
      case AssetAction.REMOVE_ASSET_FROM_STACK: {
        stack = action.stack;
        if (!stack) {
          break;
        }
        cursor.current = stack.assets[0];
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
      case AssetAction.KEEP_THIS_DELETE_OTHERS:
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

  const refresh = async () => {
    await refreshStack();
    ocrManager.clear();
    if (sharedLink) {
      return;
    }

    if (previewStackedAsset) {
      await ocrManager.getAssetOcr(previewStackedAsset.id);
    }
    await ocrManager.getAssetOcr(asset.id);
  };
  $effect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    cursor.current;
    untrack(() => handlePromiseError(refresh()));
  });

  let lastCursor = $state<AssetCursor>();

  $effect(() => {
    if (cursor.current.id === lastCursor?.current.id) {
      return;
    }

    if (lastCursor) {
      selectedStackAsset = undefined;
      previewStackedAsset = undefined;
      // After navigation completes, reconcile preloads with full state information
      updatePreloadsAfterNavigation(lastCursor, cursor);
      lastCursor = cursor;
      return;
    }

    // "first time" load, start preloads
    if (cursor.nextAsset) {
      nextPreloader = startPreloader(cursor.nextAsset, 'next');
    }
    if (cursor.previousAsset) {
      previousPreloader = startPreloader(cursor.previousAsset, 'previous');
    }
    lastCursor = cursor;
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
      cursor.current = update;
    }
  };

  const handleAssetViewerFree = () => eventManager.emit('AssetViewerFree');

  const viewerKind = $derived.by(() => {
    if (previewStackedAsset) {
      return asset.type === AssetTypeEnum.Image ? 'PhotoViewer' : 'StackVideoViewer';
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
      !(asset.exifInfo?.projectionType === 'EQUIRECTANGULAR') &&
      !assetViewerManager.isShowEditor &&
      ocrManager.hasOcrData,
  );

  const { Tag } = $derived(getAssetActions($t, asset));
</script>

<CommandPaletteDefaultProvider name={$t('assets')} actions={[Tag]} />
<OnEvents {onAssetReplace} {onAssetUpdate} />

<svelte:document bind:fullscreenElement />

<section
  id="immich-asset-viewer"
  class="fixed start-0 top-0 grid size-full grid-cols-4 grid-rows-[64px_1fr] overflow-hidden bg-black"
  class:invisible={$invisible}
  use:focusTrap
  bind:this={assetViewerHtmlElement}
>
  <!-- Top navigation bar -->
  {#if $slideshowState === SlideshowState.None && !assetViewerManager.isShowEditor}
    <div
      class="col-span-4 col-start-1 row-span-1 row-start-1 transition-transform"
      style:view-transition-name="exclude"
    >
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
    <div
      class="my-auto col-span-1 col-start-1 row-span-full row-start-1 justify-self-start"
      style:view-transition-name="exclude-leftbutton"
    >
      <PreviousAssetAction onPreviousAsset={() => navigateAsset('previous')} />
    </div>
  {/if}

  <!-- Asset Viewer -->
  <div class="z-[-1] relative col-start-1 col-span-4 row-start-1 row-span-full">
    {#if viewerKind === 'StackVideoViewer'}
      <VideoViewer
        {transitionName}
        cursor={{ ...cursor, current: previewStackedAsset! }}
        assetId={previewStackedAsset!.id}
        cacheKey={previewStackedAsset!.thumbhash}
        projectionType={previewStackedAsset!.exifInfo?.projectionType}
        loopVideo={true}
        onSwipe={(direction) => navigateAsset(direction === 'left' ? 'next' : 'previous')}
        onClose={closeViewer}
        onVideoEnded={() => navigateAsset(getNavigationTarget())}
        onVideoStarted={handleVideoStarted}
        onReady={handleAssetViewerFree}
        {playOriginalVideo}
      />
    {:else if viewerKind === 'LiveVideoViewer'}
      <VideoViewer
        {transitionName}
        {cursor}
        assetId={asset.livePhotoVideoId!}
        {sharedLink}
        cacheKey={asset.thumbhash}
        projectionType={asset.exifInfo?.projectionType}
        loopVideo={$slideshowState !== SlideshowState.PlaySlideshow}
        onSwipe={(direction) => navigateAsset(direction === 'left' ? 'next' : 'previous')}
        onVideoEnded={() => (assetViewerManager.isPlayingMotionPhoto = false)}
        onReady={handleAssetViewerFree}
        {playOriginalVideo}
      />
    {:else if viewerKind === 'ImagePanaramaViewer'}
      <ImagePanoramaViewer {asset} {transitionName} onReady={handleAssetViewerFree} />
    {:else if viewerKind === 'CropArea'}
      <CropArea {asset} onReady={handleAssetViewerFree} />
    {:else if viewerKind === 'PhotoViewer'}
      <PhotoViewer
        {transitionName}
        cursor={{ ...cursor, current: asset }}
        {sharedLink}
        onSwipe={(direction) => navigateAsset(direction === 'left' ? 'next' : 'previous', true)}
        onReady={handleAssetViewerFree}
      />
    {:else if viewerKind === 'VideoViewer'}
      <VideoViewer
        {transitionName}
        {cursor}
        {sharedLink}
        cacheKey={asset.thumbhash}
        projectionType={asset.exifInfo?.projectionType}
        loopVideo={$slideshowState !== SlideshowState.PlaySlideshow}
        onSwipe={(direction) => navigateAsset(direction === 'left' ? 'next' : 'previous')}
        onClose={closeViewer}
        onVideoEnded={() => navigateAsset(getNavigationTarget())}
        onVideoStarted={handleVideoStarted}
        onReady={handleAssetViewerFree}
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
    <div
      class="my-auto col-span-1 col-start-4 row-span-full row-start-1 justify-self-end"
      style:view-transition-name="exclude-rightbutton"
    >
      <NextAssetAction onNextAsset={() => navigateAsset('next')} />
    </div>
  {/if}

  {#if asset.hasMetadata && $slideshowState === SlideshowState.None && assetViewerManager.isShowDetailPanel && !assetViewerManager.isShowEditor}
    <div
      transition:slide={{ axis: 'x', duration: 150 }}
      id="detail-panel"
      style:view-transition-name={detailPanelTransitionName}
      class="row-start-1 row-span-4 w-[360px] overflow-y-auto transition-all dark:border-l dark:border-s-immich-dark-gray bg-light"
      translate="yes"
    >
      <DetailPanel {asset} currentAlbum={album} />
    </div>
  {/if}

  {#if assetViewerManager.isShowEditor}
    <div
      transition:fly={{ duration: 150 }}
      id="editor-panel"
      class="row-start-1 row-span-4 w-100 overflow-y-auto transition-all dark:border-l dark:border-s-immich-dark-gray"
      translate="yes"
    >
      <EditorPanel {asset} onClose={closeEditor} />
    </div>
  {/if}

  {#if stack && withStacked && !assetViewerManager.isShowEditor}
    {@const stackedAssets = stack.assets}
    <div id="stack-slideshow" class="absolute bottom-0 w-full col-span-4 col-start-1 pointer-events-none">
      <div
        role="presentation"
        class="relative flex flex-row no-wrap overflow-x-auto overflow-y-hidden horizontal-scrollbar pointer-events-auto"
        onmouseleave={handleStackedAssetsMouseLeave}
      >
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
                selectedStackAsset = stackedAsset;
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
