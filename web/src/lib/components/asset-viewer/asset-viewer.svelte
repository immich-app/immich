<script lang="ts">
  import { goto } from '$app/navigation';
  import { AlbumResponseDto, api, AssetJobName, AssetResponseDto, AssetTypeEnum, SharedLinkResponseDto } from '@api';
  import { createEventDispatcher, onDestroy, onMount } from 'svelte';
  import ChevronLeft from 'svelte-material-icons/ChevronLeft.svelte';
  import ChevronRight from 'svelte-material-icons/ChevronRight.svelte';
  import ImageBrokenVariant from 'svelte-material-icons/ImageBrokenVariant.svelte';
  import { fly } from 'svelte/transition';
  import AlbumSelectionModal from '../shared-components/album-selection-modal.svelte';
  import { notificationController, NotificationType } from '../shared-components/notification/notification';
  import AssetViewerNavBar from './asset-viewer-nav-bar.svelte';
  import DetailPanel from './detail-panel.svelte';
  import PhotoViewer from './photo-viewer.svelte';
  import VideoViewer from './video-viewer.svelte';
  import PanoramaViewer from './panorama-viewer.svelte';
  import { ProjectionType } from '$lib/constants';
  import ConfirmDialogue from '$lib/components/shared-components/confirm-dialogue.svelte';
  import ProfileImageCropper from '../shared-components/profile-image-cropper.svelte';
  import Pause from 'svelte-material-icons/Pause.svelte';
  import Play from 'svelte-material-icons/Play.svelte';
  import { isShowDetail } from '$lib/stores/preferences.store';
  import { addAssetsToAlbum, downloadFile } from '$lib/utils/asset-utils';
  import NavigationArea from './navigation-area.svelte';
  import { browser } from '$app/environment';
  import { handleError } from '$lib/utils/handle-error';
  import type { AssetStore } from '$lib/stores/assets.store';
  import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';
  import Close from 'svelte-material-icons/Close.svelte';
  import ProgressBar, { ProgressBarStatus } from '../shared-components/progress-bar/progress-bar.svelte';

  export let assetStore: AssetStore | null = null;
  export let asset: AssetResponseDto;
  export let showNavigation = true;
  export let sharedLink: SharedLinkResponseDto | undefined = undefined;

  const dispatch = createEventDispatcher<{
    archived: AssetResponseDto;
    unarchived: AssetResponseDto;
    favorite: AssetResponseDto;
    unfavorite: AssetResponseDto;
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
  let shouldShowDownloadButton = sharedLink ? sharedLink.allowDownload : true;
  let canCopyImagesToClipboard: boolean;

  const onKeyboardPress = (keyInfo: KeyboardEvent) => handleKeyboardPress(keyInfo.key, keyInfo.shiftKey);

  onMount(async () => {
    document.addEventListener('keydown', onKeyboardPress);

    if (!sharedLink) {
      await getAllAlbums();
    }

    // Import hack :( see https://github.com/vadimkorr/svelte-carousel/issues/27#issuecomment-851022295
    // TODO: Move to regular import once the package correctly supports ESM.
    const module = await import('copy-image-clipboard');
    canCopyImagesToClipboard = module.canCopyImagesToClipboard();
  });

  onDestroy(() => {
    if (browser) {
      document.removeEventListener('keydown', onKeyboardPress);
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
    } catch (e) {
      console.error('Error getting album that asset belong to', e);
    }
  };

  const handleKeyboardPress = (key: string, shiftKey: boolean) => {
    switch (key) {
      case 'a':
      case 'A':
        if (shiftKey) {
          toggleArchive();
        }
        return;
      case 'ArrowLeft':
        navigateAssetBackward();
        return;
      case 'ArrowRight':
        navigateAssetForward();
        return;
      case 'd':
      case 'D':
        if (shiftKey) {
          downloadFile(asset);
        }
        return;
      case 'Delete':
        isShowDeleteConfirmation = true;
        return;
      case 'Escape':
        closeViewer();
        return;
      case 'f':
        toggleFavorite();
        return;
      case 'i':
        $isShowDetail = !$isShowDetail;
        return;
    }
  };

  const handleCloseViewer = () => {
    $isShowDetail = false;
    closeViewer();
  };

  const closeViewer = () => dispatch('close');

  const navigateAssetForward = async (e?: Event) => {
    if (isSlideshowMode && assetStore && progressBar) {
      const hasNext = await assetStore.getNextAssetId(asset.id);
      if (hasNext) {
        progressBar.restart(true);
      } else {
        await handleStopSlideshow();
      }
    }

    e?.stopPropagation();
    dispatch('next');
  };

  const navigateAssetBackward = (e?: Event) => {
    if (isSlideshowMode && progressBar) {
      progressBar.restart(true);
    }

    e?.stopPropagation();
    dispatch('previous');
  };

  const showDetailInfoHandler = () => {
    $isShowDetail = !$isShowDetail;
  };

  const deleteAsset = async () => {
    try {
      const { data: deletedAssets } = await api.assetApi.deleteAsset({
        deleteAssetDto: {
          ids: [asset.id],
        },
      });

      await navigateAssetForward();

      for (const asset of deletedAssets) {
        if (asset.status == 'SUCCESS') {
          assetStore?.removeAsset(asset.id);
        }
      }
    } catch (e) {
      notificationController.show({
        type: NotificationType.Error,
        message: 'Error deleting this asset, check console for more details',
      });
      console.error('Error deleteAsset', e);
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
      assetStore?.updateAsset(data);
      dispatch(data.isFavorite ? 'favorite' : 'unfavorite', data);

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

  const handleAddToNewAlbum = (event: CustomEvent) => {
    isShowAlbumPicker = false;

    const { albumName }: { albumName: string } = event.detail;
    api.albumApi.createAlbum({ createAlbumDto: { albumName, assetIds: [asset.id] } }).then((response) => {
      const album = response.data;
      goto('/albums/' + album.id);
    });
  };

  const handleAddToAlbum = async (event: CustomEvent<{ album: AlbumResponseDto }>) => {
    isShowAlbumPicker = false;
    const album = event.detail.album;

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
      assetStore?.updateAsset(data);
      dispatch(data.isArchived ? 'archived' : 'unarchived', data);

      notificationController.show({
        type: NotificationType.Info,
        message: asset.isArchived ? `Added to archive` : `Removed from archive`,
      });
    } catch (error) {
      await handleError(error, `Unable to ${asset.isArchived ? `add asset to` : `remove asset from`} archive`);
    }
  };

  const getAssetType = () => {
    switch (asset.type) {
      case 'IMAGE':
        return 'Photo';
      case 'VIDEO':
        return 'Video';
      default:
        return 'Asset';
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

  let isSlideshowMode = false;
  let assetViewerHtmlElement: HTMLElement;
  let progressBar: ProgressBar;
  let progressBarStatus: ProgressBarStatus;

  const handleVideoStarted = () => {
    if (isSlideshowMode) {
      progressBar.restart(false);
    }
  };

  const handleVideoEnded = async () => {
    if (isSlideshowMode) {
      await navigateAssetForward();
    }
  };

  const handlePlaySlideshow = async () => {
    try {
      await assetViewerHtmlElement.requestFullscreen();
    } catch (error) {
      console.error('Error entering fullscreen', error);
    } finally {
      isSlideshowMode = true;
    }
  };

  const handleStopSlideshow = async () => {
    try {
      await document.exitFullscreen();
    } catch (error) {
      console.error('Error exiting fullscreen', error);
    } finally {
      isSlideshowMode = false;
      progressBar.restart(false);
    }
  };
</script>

<section
  id="immich-asset-viewer"
  class="fixed left-0 top-0 z-[1001] grid h-screen w-screen grid-cols-4 grid-rows-[64px_1fr] overflow-y-hidden bg-black"
  bind:this={assetViewerHtmlElement}
>
  <div class="z-[1000] col-span-4 col-start-1 row-span-1 row-start-1 transition-transform">
    {#if isSlideshowMode}
      <!-- SlideShowController -->
      <div class="flex">
        <div class="m-4 flex gap-2">
          <CircleIconButton logo={Close} on:click={handleStopSlideshow} title="Exit Slideshow" />
          <CircleIconButton
            logo={progressBarStatus === ProgressBarStatus.Paused ? Play : Pause}
            on:click={() => (progressBarStatus === ProgressBarStatus.Paused ? progressBar.play() : progressBar.pause())}
            title={progressBarStatus === ProgressBarStatus.Paused ? 'Play' : 'Pause'}
          />
          <CircleIconButton logo={ChevronLeft} on:click={navigateAssetBackward} title="Previous" />
          <CircleIconButton logo={ChevronRight} on:click={navigateAssetForward} title="Next" />
        </div>
        <ProgressBar
          autoplay
          bind:this={progressBar}
          bind:status={progressBarStatus}
          on:done={navigateAssetForward}
          duration={5000}
        />
      </div>
    {:else}
      <AssetViewerNavBar
        {asset}
        isMotionPhotoPlaying={shouldPlayMotionPhoto}
        showCopyButton={canCopyImagesToClipboard && asset.type === AssetTypeEnum.Image}
        showZoomButton={asset.type === AssetTypeEnum.Image}
        showMotionPlayButton={!!asset.livePhotoVideoId}
        showDownloadButton={shouldShowDownloadButton}
        showSlideshow={!!assetStore}
        on:goBack={closeViewer}
        on:showDetail={showDetailInfoHandler}
        on:download={() => downloadFile(asset)}
        on:delete={() => (isShowDeleteConfirmation = true)}
        on:favorite={toggleFavorite}
        on:addToAlbum={() => openAlbumPicker(false)}
        on:addToSharedAlbum={() => openAlbumPicker(true)}
        on:playMotionPhoto={() => (shouldPlayMotionPhoto = true)}
        on:stopMotionPhoto={() => (shouldPlayMotionPhoto = false)}
        on:toggleArchive={toggleArchive}
        on:asProfileImage={() => (isShowProfileImageCrop = true)}
        on:runJob={({ detail: job }) => handleRunJob(job)}
        on:playSlideShow={handlePlaySlideshow}
      />
    {/if}
  </div>

  {#if !isSlideshowMode && showNavigation}
    <div class="column-span-1 z-[999] col-start-1 row-span-1 row-start-2 mb-[60px] justify-self-start">
      <NavigationArea on:click={navigateAssetBackward}><ChevronLeft size="36" /></NavigationArea>
    </div>
  {/if}

  <div class="col-span-4 col-start-1 row-span-full row-start-1">
    {#key asset.id}
      {#if !asset.resized}
        <div class="flex h-full w-full justify-center">
          <div
            class="px-auto flex aspect-square h-full items-center justify-center bg-gray-100 dark:bg-immich-dark-gray"
          >
            <ImageBrokenVariant size="25%" />
          </div>
        </div>
      {:else if asset.type === AssetTypeEnum.Image}
        {#if shouldPlayMotionPhoto && asset.livePhotoVideoId}
          <VideoViewer
            assetId={asset.livePhotoVideoId}
            on:close={closeViewer}
            on:onVideoEnded={() => (shouldPlayMotionPhoto = false)}
          />
        {:else if asset.exifInfo?.projectionType === ProjectionType.EQUIRECTANGULAR || asset.originalPath
            .toLowerCase()
            .endsWith('.insp')}
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
    {/key}
  </div>

  {#if !isSlideshowMode && showNavigation}
    <div class="z-[999] col-span-1 col-start-4 row-span-1 row-start-2 mb-[60px] justify-self-end">
      <NavigationArea on:click={navigateAssetForward}><ChevronRight size="36" /></NavigationArea>
    </div>
  {/if}

  {#if !isSlideshowMode && $isShowDetail}
    <div
      transition:fly={{ duration: 150 }}
      id="detail-panel"
      class="z-[1002] row-span-full w-[360px] overflow-y-auto bg-immich-bg transition-all dark:border-l dark:border-l-immich-dark-gray dark:bg-immich-dark-bg"
      translate="yes"
    >
      <DetailPanel
        {asset}
        albums={appearsInAlbums}
        on:close={() => ($isShowDetail = false)}
        on:close-viewer={handleCloseViewer}
        on:description-focus-in={disableKeyDownEvent}
        on:description-focus-out={enableKeyDownEvent}
      />
    </div>
  {/if}

  {#if isShowAlbumPicker}
    <AlbumSelectionModal
      shared={addToSharedAlbum}
      on:newAlbum={handleAddToNewAlbum}
      on:newSharedAlbum={handleAddToNewAlbum}
      on:album={handleAddToAlbum}
      on:close={() => (isShowAlbumPicker = false)}
    />
  {/if}

  {#if isShowDeleteConfirmation}
    <ConfirmDialogue
      title="Delete {getAssetType()}"
      confirmText="Delete"
      on:confirm={deleteAsset}
      on:cancel={() => (isShowDeleteConfirmation = false)}
    >
      <svelte:fragment slot="prompt">
        <p>
          Are you sure you want to delete this {getAssetType().toLowerCase()}? This will also remove it from its
          album(s).
        </p>
        <p><b>You cannot undo this action!</b></p>
      </svelte:fragment>
    </ConfirmDialogue>
  {/if}

  {#if isShowProfileImageCrop}
    <ProfileImageCropper
      {asset}
      on:close={() => (isShowProfileImageCrop = false)}
      on:close-viewer={handleCloseViewer}
    />
  {/if}
</section>

<style>
  #immich-asset-viewer {
    contain: layout;
  }
</style>
