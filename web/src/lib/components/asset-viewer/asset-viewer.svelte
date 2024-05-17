<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import CreateSharedLinkModal from '$lib/components/shared-components/create-share-link-modal/create-shared-link-modal.svelte';
  import FocusTrap from '$lib/components/shared-components/focus-trap.svelte';
  import { AssetAction, ProjectionType } from '$lib/constants';
  import { updateNumberOfComments } from '$lib/stores/activity.store';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import type { AssetStore } from '$lib/stores/assets.store';
  import { isShowDetail, showDeleteModal } from '$lib/stores/preferences.store';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { SlideshowNavigation, SlideshowState, slideshowStore } from '$lib/stores/slideshow.store';
  import { stackAssetsStore } from '$lib/stores/stacked-asset.store';
  import { user } from '$lib/stores/user.store';
  import { getAssetJobMessage, getSharedLink, handlePromiseError, isSharedLink } from '$lib/utils';
  import { addAssetsToAlbum, addAssetsToNewAlbum, downloadFile, unstackAssets } from '$lib/utils/asset-utils';
  import { handleError } from '$lib/utils/handle-error';
  import { shortcuts } from '$lib/utils/shortcut';
  import { SlideshowHistory } from '$lib/utils/slideshow-history';
  import {
    AssetJobName,
    AssetTypeEnum,
    ReactionType,
    createActivity,
    deleteActivity,
    deleteAssets,
    getActivities,
    getActivityStatistics,
    getAllAlbums,
    runAssetJobs,
    restoreAssets,
    updateAsset,
    updateAlbumInfo,
    type ActivityResponseDto,
    type AlbumResponseDto,
    type AssetResponseDto,
  } from '@immich/sdk';
  import { mdiChevronLeft, mdiChevronRight, mdiImageBrokenVariant } from '@mdi/js';
  import { createEventDispatcher, onDestroy, onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import Thumbnail from '../assets/thumbnail/thumbnail.svelte';
  import DeleteAssetDialog from '../photos-page/delete-asset-dialog.svelte';
  import AlbumSelectionModal from '../shared-components/album-selection-modal.svelte';
  import { NotificationType, notificationController } from '../shared-components/notification/notification';
  import ProfileImageCropper from '../shared-components/profile-image-cropper.svelte';
  import ActivityStatus from './activity-status.svelte';
  import ActivityViewer from './activity-viewer.svelte';
  import AssetViewerNavBar from './asset-viewer-nav-bar.svelte';
  import DetailPanel from './detail-panel.svelte';
  import NavigationArea from './navigation-area.svelte';
  import PanoramaViewer from './panorama-viewer.svelte';
  import PhotoViewer from './photo-viewer.svelte';
  import SlideshowBar from './slideshow-bar.svelte';
  import VideoViewer from './video-wrapper-viewer.svelte';
  import { navigate } from '$lib/utils/navigation';

  export let assetStore: AssetStore | null = null;
  export let asset: AssetResponseDto;
  export let preloadAssets: AssetResponseDto[] = [];
  export let showNavigation = true;
  $: isTrashEnabled = $featureFlags.trash;
  export let withStacked = false;
  export let isShared = false;
  export let album: AlbumResponseDto | null = null;

  let reactions: ActivityResponseDto[] = [];

  const { setAsset } = assetViewingStore;
  const {
    restartProgress: restartSlideshowProgress,
    stopProgress: stopSlideshowProgress,
    slideshowNavigation,
    slideshowState,
  } = slideshowStore;

  const dispatch = createEventDispatcher<{
    action: { type: AssetAction; asset: AssetResponseDto };
    close: void;
    next: void;
    previous: void;
  }>();

  let appearsInAlbums: AlbumResponseDto[] = [];
  let isShowAlbumPicker = false;
  let isShowDeleteConfirmation = false;
  let isShowShareModal = false;
  let addToSharedAlbum = true;
  let shouldPlayMotionPhoto = false;
  let isShowProfileImageCrop = false;
  let sharedLink = getSharedLink();
  let shouldShowDownloadButton = sharedLink ? sharedLink.allowDownload : !asset.isOffline;
  let shouldShowDetailButton = asset.hasMetadata;
  let shouldShowShareModal = !asset.isTrashed;
  let canCopyImagesToClipboard: boolean;
  let slideshowStateUnsubscribe: () => void;
  let shuffleSlideshowUnsubscribe: () => void;
  let previewStackedAsset: AssetResponseDto | undefined;
  let isShowActivity = false;
  let isLiked: ActivityResponseDto | null = null;
  let numberOfComments: number;
  let fullscreenElement: Element;

  $: isFullScreen = fullscreenElement !== null;

  $: {
    if (asset.stackCount && asset.stack) {
      $stackAssetsStore = asset.stack;
      $stackAssetsStore = [...$stackAssetsStore, asset].sort(
        (a, b) => new Date(b.fileCreatedAt).getTime() - new Date(a.fileCreatedAt).getTime(),
      );

      // if its a stack, add the next stack image in addition to the next asset
      if (asset.stackCount > 1) {
        preloadAssets.push($stackAssetsStore[1]);
      }
    }

    if (!$stackAssetsStore.map((a) => a.id).includes(asset.id)) {
      $stackAssetsStore = [];
    }
  }

  $: {
    if (album && !album.isActivityEnabled && numberOfComments === 0) {
      isShowActivity = false;
    }
  }

  const handleAddComment = () => {
    numberOfComments++;
    updateNumberOfComments(1);
  };

  const handleRemoveComment = () => {
    numberOfComments--;
    updateNumberOfComments(-1);
  };

  const handleFavorite = async () => {
    if (album && album.isActivityEnabled) {
      try {
        if (isLiked) {
          const activityId = isLiked.id;
          await deleteActivity({ id: activityId });
          reactions = reactions.filter((reaction) => reaction.id !== activityId);
          isLiked = null;
        } else {
          const data = await createActivity({
            activityCreateDto: { albumId: album.id, assetId: asset.id, type: ReactionType.Like },
          });

          isLiked = data;
          reactions = [...reactions, isLiked];
        }
      } catch (error) {
        handleError(error, "Can't change favorite for asset");
      }
    }
  };

  const getFavorite = async () => {
    if (album && $user) {
      try {
        const data = await getActivities({
          userId: $user.id,
          assetId: asset.id,
          albumId: album.id,
          $type: ReactionType.Like,
        });
        isLiked = data.length > 0 ? data[0] : null;
      } catch (error) {
        handleError(error, "Can't get Favorite");
      }
    }
  };

  const getNumberOfComments = async () => {
    if (album) {
      try {
        const { comments } = await getActivityStatistics({ assetId: asset.id, albumId: album.id });
        numberOfComments = comments;
      } catch (error) {
        handleError(error, "Can't get number of comments");
      }
    }
  };

  $: {
    if (isShared && asset.id) {
      handlePromiseError(getFavorite());
      handlePromiseError(getNumberOfComments());
    }
  }

  onMount(async () => {
    await navigate({ targetRoute: 'current', assetId: asset.id });
    slideshowStateUnsubscribe = slideshowState.subscribe((value) => {
      if (value === SlideshowState.PlaySlideshow) {
        slideshowHistory.reset();
        slideshowHistory.queue(asset);
        handlePromiseError(handlePlaySlideshow());
      } else if (value === SlideshowState.StopSlideshow) {
        handlePromiseError(handleStopSlideshow());
      }
    });

    shuffleSlideshowUnsubscribe = slideshowNavigation.subscribe((value) => {
      if (value === SlideshowNavigation.Shuffle) {
        slideshowHistory.reset();
        slideshowHistory.queue(asset);
      }
    });

    if (!sharedLink) {
      await handleGetAllAlbums();
    }

    // Import hack :( see https://github.com/vadimkorr/svelte-carousel/issues/27#issuecomment-851022295
    // TODO: Move to regular import once the package correctly supports ESM.
    const module = await import('copy-image-clipboard');
    canCopyImagesToClipboard = module.canCopyImagesToClipboard();

    if (asset.stackCount && asset.stack) {
      $stackAssetsStore = asset.stack;
      $stackAssetsStore = [...$stackAssetsStore, asset].sort(
        (a, b) => new Date(a.fileCreatedAt).getTime() - new Date(b.fileCreatedAt).getTime(),
      );
    } else {
      $stackAssetsStore = [];
    }
  });

  onDestroy(() => {
    if (slideshowStateUnsubscribe) {
      slideshowStateUnsubscribe();
    }

    if (shuffleSlideshowUnsubscribe) {
      shuffleSlideshowUnsubscribe();
    }
  });

  $: asset.id && !sharedLink && handlePromiseError(handleGetAllAlbums()); // Update the album information when the asset ID changes

  const handleGetAllAlbums = async () => {
    if (isSharedLink()) {
      return;
    }

    try {
      appearsInAlbums = await getAllAlbums({ assetId: asset.id });
    } catch (error) {
      console.error('Error getting album that asset belong to', error);
    }
  };

  const handleOpenActivity = () => {
    if ($isShowDetail) {
      $isShowDetail = false;
    }
    isShowActivity = !isShowActivity;
  };

  const toggleDetailPanel = () => {
    isShowActivity = false;
    $isShowDetail = !$isShowDetail;
  };

  const handleCloseViewer = async () => {
    await closeViewer();
  };

  const closeViewer = async () => {
    $slideshowState = SlideshowState.StopSlideshow;
    document.body.style.cursor = '';
    dispatch('close');
    await navigate({ targetRoute: 'current', assetId: null });
  };

  const navigateAssetRandom = async () => {
    if (!assetStore) {
      return;
    }

    const asset = await assetStore.getRandomAsset();
    if (!asset) {
      return;
    }

    slideshowHistory.queue(asset);

    setAsset(asset);
    $restartSlideshowProgress = true;
  };

  const navigateAsset = async (order?: 'previous' | 'next', e?: Event) => {
    if (!order) {
      if ($slideshowState === SlideshowState.PlaySlideshow) {
        order = $slideshowNavigation === SlideshowNavigation.AscendingOrder ? 'previous' : 'next';
      } else {
        return;
      }
    }

    if ($slideshowState === SlideshowState.PlaySlideshow && $slideshowNavigation === SlideshowNavigation.Shuffle) {
      return (order === 'previous' ? slideshowHistory.previous() : slideshowHistory.next()) || navigateAssetRandom();
    }

    if ($slideshowState === SlideshowState.PlaySlideshow && assetStore) {
      const hasNext =
        order === 'previous' ? await assetStore.getPreviousAsset(asset) : await assetStore.getNextAsset(asset);
      if (hasNext) {
        $restartSlideshowProgress = true;
      } else {
        await handleStopSlideshow();
      }
    }

    e?.stopPropagation();
    dispatch(order);
  };

  const showDetailInfoHandler = () => {
    if (isShowActivity) {
      isShowActivity = false;
    }
    $isShowDetail = !$isShowDetail;
  };

  const trashOrDelete = async (force: boolean = false) => {
    if (force || !isTrashEnabled) {
      if ($showDeleteModal) {
        isShowDeleteConfirmation = true;
        return;
      }
      await deleteAsset();
      return;
    }

    await trashAsset();
    return;
  };

  const trashAsset = async () => {
    try {
      await deleteAssets({ assetBulkDeleteDto: { ids: [asset.id] } });

      dispatch('action', { type: AssetAction.TRASH, asset });

      notificationController.show({
        message: 'Moved to trash',
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, 'Unable to trash asset');
    }
  };

  const deleteAsset = async () => {
    try {
      await deleteAssets({ assetBulkDeleteDto: { ids: [asset.id], force: true } });

      dispatch('action', { type: AssetAction.DELETE, asset });

      notificationController.show({
        message: 'Permanently deleted asset',
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, 'Unable to delete asset');
    } finally {
      isShowDeleteConfirmation = false;
    }
  };

  const toggleFavorite = async () => {
    try {
      const data = await updateAsset({
        id: asset.id,
        updateAssetDto: {
          isFavorite: !asset.isFavorite,
        },
      });

      asset.isFavorite = data.isFavorite;
      dispatch('action', { type: data.isFavorite ? AssetAction.FAVORITE : AssetAction.UNFAVORITE, asset: data });

      notificationController.show({
        type: NotificationType.Info,
        message: asset.isFavorite ? `Added to favorites` : `Removed from favorites`,
      });
    } catch (error) {
      handleError(error, `Unable to ${asset.isFavorite ? `add asset to` : `remove asset from`} favorites`);
    }
  };

  const openAlbumPicker = (shared: boolean) => {
    isShowAlbumPicker = true;
    addToSharedAlbum = shared;
  };

  const handleAddToNewAlbum = async (albumName: string) => {
    isShowAlbumPicker = false;

    await addAssetsToNewAlbum(albumName, [asset.id]);
  };

  const handleAddToAlbum = async (album: AlbumResponseDto) => {
    isShowAlbumPicker = false;

    await addAssetsToAlbum(album.id, [asset.id]);
    await handleGetAllAlbums();
  };

  const handleRestoreAsset = async () => {
    try {
      await restoreAssets({ bulkIdsDto: { ids: [asset.id] } });
      asset.isTrashed = false;

      dispatch('action', { type: AssetAction.RESTORE, asset });

      notificationController.show({
        type: NotificationType.Info,
        message: `Restored asset`,
      });
    } catch (error) {
      handleError(error, 'Error restoring asset');
    }
  };

  const toggleArchive = async () => {
    try {
      const data = await updateAsset({
        id: asset.id,
        updateAssetDto: {
          isArchived: !asset.isArchived,
        },
      });

      asset.isArchived = data.isArchived;
      dispatch('action', { type: data.isArchived ? AssetAction.ARCHIVE : AssetAction.UNARCHIVE, asset: data });

      notificationController.show({
        type: NotificationType.Info,
        message: asset.isArchived ? `Added to archive` : `Removed from archive`,
      });
    } catch (error) {
      handleError(error, `Unable to ${asset.isArchived ? `add asset to` : `remove asset from`} archive`);
    }
  };

  const handleRunJob = async (name: AssetJobName) => {
    try {
      await runAssetJobs({ assetJobsDto: { assetIds: [asset.id], name } });
      notificationController.show({ type: NotificationType.Info, message: getAssetJobMessage(name) });
    } catch (error) {
      handleError(error, `Unable to submit job`);
    }
  };

  /**
   * Slide show mode
   */

  let assetViewerHtmlElement: HTMLElement;

  const slideshowHistory = new SlideshowHistory((asset) => {
    setAsset(asset);
    $restartSlideshowProgress = true;
  });

  const handleVideoStarted = () => {
    if ($slideshowState === SlideshowState.PlaySlideshow) {
      $stopSlideshowProgress = true;
    }
  };

  const handlePlaySlideshow = async () => {
    try {
      await assetViewerHtmlElement.requestFullscreen();
    } catch (error) {
      console.error('Error entering fullscreen', error);
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
      console.error('Error exiting fullscreen', error);
    } finally {
      $stopSlideshowProgress = true;
      $slideshowState = SlideshowState.None;
    }
  };

  const handleStackedAssetMouseEvent = (e: CustomEvent<{ isMouseOver: boolean }>, asset: AssetResponseDto) => {
    const { isMouseOver } = e.detail;

    previewStackedAsset = isMouseOver ? asset : undefined;
  };

  const handleUnstack = async () => {
    const unstackedAssets = await unstackAssets($stackAssetsStore);
    if (unstackedAssets) {
      for (const asset of unstackedAssets) {
        dispatch('action', {
          type: AssetAction.ADD,
          asset,
        });
      }
      dispatch('close');
    }
  };

  const handleUpdateThumbnail = async () => {
    if (!album) {
      return;
    }
    try {
      await updateAlbumInfo({
        id: album.id,
        updateAlbumDto: {
          albumThumbnailAssetId: asset.id,
        },
      });
      notificationController.show({
        type: NotificationType.Info,
        message: 'Album cover updated',
        timeout: 1500,
      });
    } catch (error) {
      handleError(error, 'Unable to update album cover');
    }
  };

  $: if (!$user) {
    shouldShowShareModal = false;
  }
</script>

<svelte:window
  use:shortcuts={[
    { shortcut: { key: 'a', shift: true }, onShortcut: toggleArchive },
    { shortcut: { key: 'ArrowLeft' }, onShortcut: () => navigateAsset('previous') },
    { shortcut: { key: 'ArrowRight' }, onShortcut: () => navigateAsset('next') },
    { shortcut: { key: 'd', shift: true }, onShortcut: () => downloadFile(asset) },
    { shortcut: { key: 'Delete' }, onShortcut: () => trashOrDelete(false) },
    { shortcut: { key: 'Delete', shift: true }, onShortcut: () => trashOrDelete(true) },
    { shortcut: { key: 'Escape' }, onShortcut: closeViewer },
    { shortcut: { key: 'f' }, onShortcut: toggleFavorite },
    { shortcut: { key: 'i' }, onShortcut: toggleDetailPanel },
  ]}
/>

<svelte:document bind:fullscreenElement />

<FocusTrap>
  <section
    id="immich-asset-viewer"
    class="fixed left-0 top-0 z-[1001] grid h-screen w-screen grid-cols-4 grid-rows-[64px_1fr] overflow-hidden bg-black"
  >
    <!-- Top navigation bar -->
    {#if $slideshowState === SlideshowState.None}
      <div class="z-[1002] col-span-4 col-start-1 row-span-1 row-start-1 transition-transform">
        <AssetViewerNavBar
          {asset}
          {album}
          isMotionPhotoPlaying={shouldPlayMotionPhoto}
          showCopyButton={canCopyImagesToClipboard && asset.type === AssetTypeEnum.Image}
          showZoomButton={asset.type === AssetTypeEnum.Image}
          showMotionPlayButton={!!asset.livePhotoVideoId}
          showDownloadButton={shouldShowDownloadButton}
          showDetailButton={shouldShowDetailButton}
          showSlideshow={!!assetStore}
          hasStackChildren={$stackAssetsStore.length > 0}
          showShareButton={shouldShowShareModal}
          on:back={closeViewer}
          on:showDetail={showDetailInfoHandler}
          on:download={() => downloadFile(asset)}
          on:delete={() => trashOrDelete()}
          on:favorite={toggleFavorite}
          on:addToAlbum={() => openAlbumPicker(false)}
          on:restoreAsset={() => handleRestoreAsset()}
          on:addToSharedAlbum={() => openAlbumPicker(true)}
          on:playMotionPhoto={() => (shouldPlayMotionPhoto = true)}
          on:stopMotionPhoto={() => (shouldPlayMotionPhoto = false)}
          on:toggleArchive={toggleArchive}
          on:asProfileImage={() => (isShowProfileImageCrop = true)}
          on:setAsAlbumCover={handleUpdateThumbnail}
          on:runJob={({ detail: job }) => handleRunJob(job)}
          on:playSlideShow={() => ($slideshowState = SlideshowState.PlaySlideshow)}
          on:unstack={handleUnstack}
          on:showShareModal={() => (isShowShareModal = true)}
        />
      </div>
    {/if}

    {#if $slideshowState === SlideshowState.None && showNavigation}
      <div class="z-[1001] my-auto column-span-1 col-start-1 row-span-full row-start-1 justify-self-start">
        <NavigationArea onClick={(e) => navigateAsset('previous', e)} label="View previous asset">
          <Icon path={mdiChevronLeft} size="36" ariaHidden />
        </NavigationArea>
      </div>
    {/if}

    <!-- Asset Viewer -->
    <div class="z-[1000] relative col-start-1 col-span-4 row-start-1 row-span-full" bind:this={assetViewerHtmlElement}>
      {#if $slideshowState != SlideshowState.None}
        <div class="z-[1000] absolute w-full flex">
          <SlideshowBar
            {isFullScreen}
            onSetToFullScreen={() => assetViewerHtmlElement.requestFullscreen()}
            onPrevious={() => navigateAsset('previous')}
            onNext={() => navigateAsset('next')}
            onClose={() => ($slideshowState = SlideshowState.StopSlideshow)}
          />
        </div>
      {/if}

      {#if previewStackedAsset}
        {#key previewStackedAsset.id}
          {#if previewStackedAsset.type === AssetTypeEnum.Image}
            <PhotoViewer
              asset={previewStackedAsset}
              {preloadAssets}
              on:close={closeViewer}
              haveFadeTransition={false}
            />
          {:else}
            <VideoViewer
              assetId={previewStackedAsset.id}
              projectionType={previewStackedAsset.exifInfo?.projectionType}
              loopVideo={true}
              on:close={closeViewer}
              on:onVideoEnded={() => navigateAsset()}
              on:onVideoStarted={handleVideoStarted}
            />
          {/if}
        {/key}
      {:else}
        {#key asset.id}
          {#if !asset.resized}
            <div class="flex h-full w-full justify-center">
              <div
                class="px-auto flex aspect-square h-full items-center justify-center bg-gray-100 dark:bg-immich-dark-gray"
              >
                <Icon path={mdiImageBrokenVariant} size="25%" />
              </div>
            </div>
          {:else if asset.type === AssetTypeEnum.Image}
            {#if shouldPlayMotionPhoto && asset.livePhotoVideoId}
              <VideoViewer
                assetId={asset.livePhotoVideoId}
                projectionType={asset.exifInfo?.projectionType}
                loopVideo={$slideshowState !== SlideshowState.PlaySlideshow}
                on:close={closeViewer}
                on:onVideoEnded={() => (shouldPlayMotionPhoto = false)}
              />
            {:else if asset.exifInfo?.projectionType === ProjectionType.EQUIRECTANGULAR || (asset.originalPath && asset.originalPath
                  .toLowerCase()
                  .endsWith('.insp'))}
              <PanoramaViewer {asset} />
            {:else}
              <PhotoViewer {asset} {preloadAssets} on:close={closeViewer} />
            {/if}
          {:else}
            <VideoViewer
              assetId={asset.id}
              projectionType={asset.exifInfo?.projectionType}
              loopVideo={$slideshowState !== SlideshowState.PlaySlideshow}
              on:close={closeViewer}
              on:onVideoEnded={() => navigateAsset()}
              on:onVideoStarted={handleVideoStarted}
            />
          {/if}
          {#if $slideshowState === SlideshowState.None && isShared && ((album && album.isActivityEnabled) || numberOfComments > 0)}
            <div class="z-[9999] absolute bottom-0 right-0 mb-4 mr-6">
              <ActivityStatus
                disabled={!album?.isActivityEnabled}
                {isLiked}
                {numberOfComments}
                {isShowActivity}
                on:favorite={handleFavorite}
                on:openActivityTab={handleOpenActivity}
              />
            </div>
          {/if}
        {/key}
      {/if}
    </div>

    {#if $slideshowState === SlideshowState.None && showNavigation}
      <div class="z-[1001] my-auto col-span-1 col-start-4 row-span-full row-start-1 justify-self-end">
        <NavigationArea onClick={(e) => navigateAsset('next', e)} label="View next asset">
          <Icon path={mdiChevronRight} size="36" ariaHidden />
        </NavigationArea>
      </div>
    {/if}

    {#if $slideshowState === SlideshowState.None && $isShowDetail}
      <div
        transition:fly={{ duration: 150 }}
        id="detail-panel"
        class="z-[1002] row-start-1 row-span-4 w-[360px] overflow-y-auto bg-immich-bg transition-all dark:border-l dark:border-l-immich-dark-gray dark:bg-immich-dark-bg"
        translate="yes"
      >
        <DetailPanel
          {asset}
          currentAlbum={album}
          albums={appearsInAlbums}
          on:close={() => ($isShowDetail = false)}
          on:closeViewer={handleCloseViewer}
        />
      </div>
    {/if}

    {#if $stackAssetsStore.length > 0 && withStacked}
      <div
        id="stack-slideshow"
        class="z-[1002] flex place-item-center place-content-center absolute bottom-0 w-full col-span-4 col-start-1 overflow-x-auto horizontal-scrollbar"
      >
        <div class="relative w-full whitespace-nowrap transition-all">
          {#each $stackAssetsStore as stackedAsset, index (stackedAsset.id)}
            <div
              class="{stackedAsset.id == asset.id
                ? '-translate-y-[1px]'
                : '-translate-y-0'} inline-block px-1 transition-transform"
            >
              <Thumbnail
                class="{stackedAsset.id == asset.id
                  ? 'bg-transparent border-2 border-white'
                  : 'bg-gray-700/40'} inline-block hover:bg-transparent"
                asset={stackedAsset}
                onClick={() => {
                  asset = stackedAsset;
                  preloadAssets = index + 1 >= $stackAssetsStore.length ? [] : [$stackAssetsStore[index + 1]];
                }}
                on:mouse-event={(e) => handleStackedAssetMouseEvent(e, stackedAsset)}
                readonly
                thumbnailSize={stackedAsset.id == asset.id ? 65 : 60}
                showStackedIcon={false}
              />

              {#if stackedAsset.id == asset.id}
                <div class="w-full flex place-items-center place-content-center">
                  <div class="w-2 h-2 bg-white rounded-full flex mt-[2px]" />
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/if}

    {#if isShared && album && isShowActivity && $user}
      <div
        transition:fly={{ duration: 150 }}
        id="activity-panel"
        class="z-[1002] row-start-1 row-span-5 w-[360px] md:w-[460px] overflow-y-auto bg-immich-bg transition-all dark:border-l dark:border-l-immich-dark-gray dark:bg-immich-dark-bg"
        translate="yes"
      >
        <ActivityViewer
          user={$user}
          disabled={!album.isActivityEnabled}
          assetType={asset.type}
          albumOwnerId={album.ownerId}
          albumId={album.id}
          assetId={asset.id}
          {isLiked}
          bind:reactions
          on:addComment={handleAddComment}
          on:deleteComment={handleRemoveComment}
          on:deleteLike={() => (isLiked = null)}
          on:close={() => (isShowActivity = false)}
        />
      </div>
    {/if}

    {#if isShowAlbumPicker}
      <AlbumSelectionModal
        shared={addToSharedAlbum}
        on:newAlbum={({ detail }) => handleAddToNewAlbum(detail)}
        on:album={({ detail }) => handleAddToAlbum(detail)}
        onClose={() => (isShowAlbumPicker = false)}
      />
    {/if}

    {#if isShowDeleteConfirmation}
      <DeleteAssetDialog
        size={1}
        on:cancel={() => (isShowDeleteConfirmation = false)}
        on:escape={() => (isShowDeleteConfirmation = false)}
        on:confirm={() => deleteAsset()}
      />
    {/if}

    {#if isShowProfileImageCrop}
      <ProfileImageCropper {asset} onClose={() => (isShowProfileImageCrop = false)} />
    {/if}

    {#if isShowShareModal}
      <CreateSharedLinkModal assetIds={[asset.id]} onClose={() => (isShowShareModal = false)} />
    {/if}
  </section>
</FocusTrap>

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
