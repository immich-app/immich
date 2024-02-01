<script lang="ts">
  import { goto } from '$app/navigation';
  import {
    type ActivityResponseDto,
    type AlbumResponseDto,
    api,
    AssetJobName,
    type AssetResponseDto,
    AssetTypeEnum,
    ReactionType,
    type SharedLinkResponseDto,
  } from '@api';
  import { createEventDispatcher, onDestroy, onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import AlbumSelectionModal from '../shared-components/album-selection-modal.svelte';
  import { notificationController, NotificationType } from '../shared-components/notification/notification';
  import AssetViewerNavBar from './asset-viewer-nav-bar.svelte';
  import DetailPanel from './detail-panel.svelte';
  import PhotoViewer from './photo-viewer.svelte';
  import VideoViewer from './video-viewer.svelte';
  import PanoramaViewer from './panorama-viewer.svelte';
  import { AppRoute, AssetAction, ProjectionType } from '$lib/constants';
  import ProfileImageCropper from '../shared-components/profile-image-cropper.svelte';
  import { isShowDetail, showDeleteModal } from '$lib/stores/preferences.store';
  import { addAssetsToAlbum, downloadFile } from '$lib/utils/asset-utils';
  import NavigationArea from './navigation-area.svelte';
  import { browser } from '$app/environment';
  import { handleError } from '$lib/utils/handle-error';
  import type { AssetStore } from '$lib/stores/assets.store';
  import { shouldIgnoreShortcut } from '$lib/utils/shortcut';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { SlideshowHistory } from '$lib/utils/slideshow-history';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { mdiChevronLeft, mdiChevronRight, mdiImageBrokenVariant } from '@mdi/js';
  import Icon from '$lib/components/elements/icon.svelte';
  import Thumbnail from '../assets/thumbnail/thumbnail.svelte';
  import { stackAssetsStore } from '$lib/stores/stacked-asset.store';
  import ActivityViewer from './activity-viewer.svelte';
  import ActivityStatus from './activity-status.svelte';
  import { updateNumberOfComments } from '$lib/stores/activity.store';
  import { SlideshowState, slideshowStore } from '$lib/stores/slideshow.store';
  import SlideshowBar from './slideshow-bar.svelte';
  import { user } from '$lib/stores/user.store';
  import DeleteAssetDialog from '../photos-page/delete-asset-dialog.svelte';

  export let assetStore: AssetStore | null = null;
  export let asset: AssetResponseDto;
  export let showNavigation = true;
  export let sharedLink: SharedLinkResponseDto | undefined = undefined;
  $: isTrashEnabled = $featureFlags.trash;
  export let withStacked = false;
  export let isShared = false;
  export let album: AlbumResponseDto | null = null;

  let reactions: ActivityResponseDto[] = [];

  const { setAssetId } = assetViewingStore;
  const {
    restartProgress: restartSlideshowProgress,
    stopProgress: stopSlideshowProgress,
    slideshowShuffle,
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
  let addToSharedAlbum = true;
  let shouldPlayMotionPhoto = false;
  let isShowProfileImageCrop = false;
  let shouldShowDownloadButton = sharedLink ? sharedLink.allowDownload : !asset.isOffline;
  let shouldShowDetailButton = asset.hasMetadata;
  let canCopyImagesToClipboard: boolean;
  let slideshowStateUnsubscribe: () => void;
  let shuffleSlideshowUnsubscribe: () => void;
  let previewStackedAsset: AssetResponseDto | undefined;
  let isShowActivity = false;
  let isLiked: ActivityResponseDto | null = null;
  let numberOfComments: number;

  $: {
    if (asset.stackCount && asset.stack) {
      $stackAssetsStore = asset.stack;
      $stackAssetsStore = [...$stackAssetsStore, asset].sort(
        (a, b) => new Date(b.fileCreatedAt).getTime() - new Date(a.fileCreatedAt).getTime(),
      );
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
          await api.activityApi.deleteActivity({ id: activityId });
          reactions = reactions.filter((reaction) => reaction.id !== activityId);
          isLiked = null;
        } else {
          const { data } = await api.activityApi.createActivity({
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
        const { data } = await api.activityApi.getActivities({
          userId: $user.id,
          assetId: asset.id,
          albumId: album.id,
          type: ReactionType.Like,
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
        const { data } = await api.activityApi.getActivityStatistics({ assetId: asset.id, albumId: album.id });
        numberOfComments = data.comments;
      } catch (error) {
        handleError(error, "Can't get number of comments");
      }
    }
  };

  $: {
    if (isShared && asset.id) {
      getFavorite();
      getNumberOfComments();
    }
  }
  const onKeyboardPress = (keyInfo: KeyboardEvent) => handleKeyboardPress(keyInfo);

  onMount(async () => {
    document.addEventListener('keydown', onKeyboardPress);

    slideshowStateUnsubscribe = slideshowState.subscribe((value) => {
      if (value === SlideshowState.PlaySlideshow) {
        slideshowHistory.reset();
        slideshowHistory.queue(asset.id);
        handlePlaySlideshow();
      } else if (value === SlideshowState.StopSlideshow) {
        handleStopSlideshow();
      }
    });

    shuffleSlideshowUnsubscribe = slideshowShuffle.subscribe((value) => {
      if (value) {
        slideshowHistory.reset();
        slideshowHistory.queue(asset.id);
      }
    });

    if (!sharedLink) {
      await getAllAlbums();
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
    if (browser) {
      document.removeEventListener('keydown', onKeyboardPress);
    }

    if (slideshowStateUnsubscribe) {
      slideshowStateUnsubscribe();
    }

    if (shuffleSlideshowUnsubscribe) {
      shuffleSlideshowUnsubscribe();
    }
  });

  $: asset.id && !sharedLink && getAllAlbums(); // Update the album information when the asset ID changes

  const getAllAlbums = async () => {
    if (api.isSharedLink) {
      return;
    }

    try {
      const { data } = await api.albumApi.getAllAlbums({ assetId: asset.id });
      appearsInAlbums = data;
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

  const handleKeyboardPress = (event: KeyboardEvent) => {
    if (shouldIgnoreShortcut(event)) {
      return;
    }

    const key = event.key;
    const shiftKey = event.shiftKey;

    switch (key) {
      case 'a':
      case 'A': {
        if (shiftKey) {
          toggleArchive();
        }
        return;
      }
      case 'ArrowLeft': {
        navigateAssetBackward();
        return;
      }
      case 'ArrowRight': {
        navigateAssetForward();
        return;
      }
      case 'd':
      case 'D': {
        if (shiftKey) {
          downloadFile(asset);
        }
        return;
      }
      case 'Delete': {
        trashOrDelete(shiftKey);
        return;
      }
      case 'Escape': {
        if (isShowDeleteConfirmation) {
          isShowDeleteConfirmation = false;
          return;
        }
        closeViewer();
        return;
      }
      case 'f': {
        toggleFavorite();
        return;
      }
      case 'i': {
        isShowActivity = false;
        $isShowDetail = !$isShowDetail;
        return;
      }
    }
  };

  const handleCloseViewer = () => {
    $isShowDetail = false;
    closeViewer();
  };

  const closeViewer = () => dispatch('close');

  const navigateAssetRandom = async () => {
    if (!assetStore) {
      return;
    }

    const asset = await assetStore.getRandomAsset();
    if (!asset) {
      return;
    }

    slideshowHistory.queue(asset.id);

    setAssetId(asset.id);
    $restartSlideshowProgress = true;
  };

  const navigateAssetForward = async (e?: Event) => {
    if ($slideshowState === SlideshowState.PlaySlideshow && $slideshowShuffle) {
      return slideshowHistory.next() || navigateAssetRandom();
    }

    if ($slideshowState === SlideshowState.PlaySlideshow && assetStore) {
      const hasNext = await assetStore.getNextAssetId(asset.id);
      if (hasNext) {
        $restartSlideshowProgress = true;
      } else {
        await handleStopSlideshow();
      }
    }

    e?.stopPropagation();
    dispatch('next');
  };

  const navigateAssetBackward = (e?: Event) => {
    if ($slideshowState === SlideshowState.PlaySlideshow && $slideshowShuffle) {
      slideshowHistory.previous();
      return;
    }

    if ($slideshowState === SlideshowState.PlaySlideshow) {
      $restartSlideshowProgress = true;
    }

    e?.stopPropagation();
    dispatch('previous');
  };

  const showDetailInfoHandler = () => {
    if (isShowActivity) {
      isShowActivity = false;
    }
    $isShowDetail = !$isShowDetail;
  };

  const trashOrDelete = (force: boolean = false) => {
    if (force || !isTrashEnabled) {
      if ($showDeleteModal) {
        isShowDeleteConfirmation = true;
        return;
      }
      deleteAsset();
      return;
    }

    trashAsset();
    return;
  };

  const trashAsset = async () => {
    try {
      await api.assetApi.deleteAssets({ assetBulkDeleteDto: { ids: [asset.id] } });

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
      await api.assetApi.deleteAssets({ assetBulkDeleteDto: { ids: [asset.id], force: true } });

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
      const { data } = await api.assetApi.updateAsset({
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
      await handleError(error, `Unable to ${asset.isFavorite ? `add asset to` : `remove asset from`} favorites`);
    }
  };

  const openAlbumPicker = (shared: boolean) => {
    isShowAlbumPicker = true;
    addToSharedAlbum = shared;
  };

  const handleAddToNewAlbum = (albumName: string) => {
    isShowAlbumPicker = false;

    api.albumApi.createAlbum({ createAlbumDto: { albumName, assetIds: [asset.id] } }).then((response) => {
      const album = response.data;
      goto(`${AppRoute.ALBUMS}/${album.id}`);
    });
  };

  const handleAddToAlbum = async (album: AlbumResponseDto) => {
    isShowAlbumPicker = false;

    await addAssetsToAlbum(album.id, [asset.id]);
    await getAllAlbums();
  };

  const disableKeyDownEvent = () => {
    if (browser) {
      document.removeEventListener('keydown', onKeyboardPress);
    }
  };

  const enableKeyDownEvent = () => {
    if (browser) {
      document.addEventListener('keydown', onKeyboardPress);
    }
  };

  const toggleArchive = async () => {
    try {
      const { data } = await api.assetApi.updateAsset({
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
      await handleError(error, `Unable to ${asset.isArchived ? `add asset to` : `remove asset from`} archive`);
    }
  };

  const handleRunJob = async (name: AssetJobName) => {
    try {
      await api.assetApi.runAssetJobs({ assetJobsDto: { assetIds: [asset.id], name } });
      notificationController.show({ type: NotificationType.Info, message: api.getAssetJobMessage(name) });
    } catch (error) {
      await handleError(error, `Unable to submit job`);
    }
  };

  /**
   * Slide show mode
   */

  let assetViewerHtmlElement: HTMLElement;

  const slideshowHistory = new SlideshowHistory((assetId: string) => {
    setAssetId(assetId);
    $restartSlideshowProgress = true;
  });

  const handleVideoStarted = () => {
    if ($slideshowState === SlideshowState.PlaySlideshow) {
      $stopSlideshowProgress = true;
    }
  };

  const handleVideoEnded = async () => {
    if ($slideshowState === SlideshowState.PlaySlideshow) {
      await navigateAssetForward();
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
    try {
      const ids = $stackAssetsStore.map(({ id }) => id);
      await api.assetApi.updateAssets({ assetBulkUpdateDto: { ids, removeParent: true } });
      for (const child of $stackAssetsStore) {
        child.stackParentId = null;
        child.stackCount = 0;
        child.stack = [];
        dispatch('action', { type: AssetAction.ADD, asset: child });
      }

      dispatch('close');
      notificationController.show({ type: NotificationType.Info, message: 'Un-stacked', timeout: 1500 });
    } catch (error) {
      await handleError(error, `Unable to unstack`);
    }
  };
</script>

<section
  id="immich-asset-viewer"
  class="fixed left-0 top-0 z-[1001] grid h-screen w-screen grid-cols-4 grid-rows-[64px_1fr] overflow-hidden bg-black"
>
  <!-- Top navigation bar -->
  {#if $slideshowState === SlideshowState.None}
    <div class="z-[1002] col-span-4 col-start-1 row-span-1 row-start-1 transition-transform">
      <AssetViewerNavBar
        {asset}
        isMotionPhotoPlaying={shouldPlayMotionPhoto}
        showCopyButton={canCopyImagesToClipboard && asset.type === AssetTypeEnum.Image}
        showZoomButton={asset.type === AssetTypeEnum.Image}
        showMotionPlayButton={!!asset.livePhotoVideoId}
        showDownloadButton={shouldShowDownloadButton}
        showDetailButton={shouldShowDetailButton}
        showSlideshow={!!assetStore}
        hasStackChildren={$stackAssetsStore.length > 0}
        on:back={closeViewer}
        on:showDetail={showDetailInfoHandler}
        on:download={() => downloadFile(asset)}
        on:delete={() => trashOrDelete()}
        on:favorite={toggleFavorite}
        on:addToAlbum={() => openAlbumPicker(false)}
        on:addToSharedAlbum={() => openAlbumPicker(true)}
        on:playMotionPhoto={() => (shouldPlayMotionPhoto = true)}
        on:stopMotionPhoto={() => (shouldPlayMotionPhoto = false)}
        on:toggleArchive={toggleArchive}
        on:asProfileImage={() => (isShowProfileImageCrop = true)}
        on:runJob={({ detail: job }) => handleRunJob(job)}
        on:playSlideShow={() => ($slideshowState = SlideshowState.PlaySlideshow)}
        on:unstack={handleUnstack}
      />
    </div>
  {/if}

  {#if $slideshowState === SlideshowState.None && showNavigation}
    <div class="z-[1001] column-span-1 col-start-1 row-span-1 row-start-2 mb-[60px] justify-self-start">
      <NavigationArea on:click={navigateAssetBackward}><Icon path={mdiChevronLeft} size="36" /></NavigationArea>
    </div>
  {/if}

  <!-- Asset Viewer -->
  <div class="z-[1000] relative col-start-1 col-span-4 row-start-1 row-span-full" bind:this={assetViewerHtmlElement}>
    {#if $slideshowState != SlideshowState.None}
      <div class="z-[1000] absolute w-full flex">
        <SlideshowBar
          on:prev={navigateAssetBackward}
          on:next={navigateAssetForward}
          on:close={() => ($slideshowState = SlideshowState.StopSlideshow)}
        />
      </div>
    {/if}

    {#if previewStackedAsset}
      {#key previewStackedAsset.id}
        {#if previewStackedAsset.type === AssetTypeEnum.Image}
          <PhotoViewer asset={previewStackedAsset} on:close={closeViewer} haveFadeTransition={false} />
        {:else}
          <VideoViewer
            assetId={previewStackedAsset.id}
            on:close={closeViewer}
            on:onVideoEnded={handleVideoEnded}
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
              on:close={closeViewer}
              on:onVideoEnded={() => (shouldPlayMotionPhoto = false)}
            />
          {:else if asset.exifInfo?.projectionType === ProjectionType.EQUIRECTANGULAR || (asset.originalPath && asset.originalPath
                .toLowerCase()
                .endsWith('.insp'))}
            <PanoramaViewer {asset} />
          {:else}
            <PhotoViewer {asset} on:close={closeViewer} />
          {/if}
        {:else}
          <VideoViewer
            assetId={asset.id}
            on:close={closeViewer}
            on:onVideoEnded={handleVideoEnded}
            on:onVideoStarted={handleVideoStarted}
          />
        {/if}
        {#if $slideshowState === SlideshowState.None && isShared && ((album && album.isActivityEnabled) || numberOfComments > 0)}
          <div class="z-[9999] absolute bottom-0 right-0 mb-6 mr-6 justify-self-end">
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

    {#if $stackAssetsStore.length > 0 && withStacked}
      <div
        id="stack-slideshow"
        class="z-[1005] flex place-item-center place-content-center absolute bottom-0 w-full col-span-4 col-start-1 mb-1 overflow-x-auto horizontal-scrollbar"
      >
        <div class="relative w-full whitespace-nowrap transition-all">
          {#each $stackAssetsStore as stackedAsset (stackedAsset.id)}
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
                on:click={() => (asset = stackedAsset)}
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
  </div>

  {#if $slideshowState === SlideshowState.None && showNavigation}
    <div class="z-[1001] col-span-1 col-start-4 row-span-1 row-start-2 mb-[60px] justify-self-end">
      <NavigationArea on:click={navigateAssetForward}><Icon path={mdiChevronRight} size="36" /></NavigationArea>
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
        albumId={album?.id}
        albums={appearsInAlbums}
        on:close={() => ($isShowDetail = false)}
        on:closeViewer={handleCloseViewer}
        on:descriptionFocusIn={disableKeyDownEvent}
        on:descriptionFocusOut={enableKeyDownEvent}
      />
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
      on:close={() => (isShowAlbumPicker = false)}
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
    <ProfileImageCropper {asset} on:close={() => (isShowProfileImageCrop = false)} />
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
