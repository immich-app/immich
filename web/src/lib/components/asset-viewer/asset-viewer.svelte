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

  import { isShowDetail } from '$lib/stores/preferences.store';
  import { addAssetsToAlbum, downloadFile } from '$lib/utils/asset-utils';
  import NavigationArea from './navigation-area.svelte';
  import { browser } from '$app/environment';
  import { handleError } from '$lib/utils/handle-error';
  import type { AssetStore } from '$lib/stores/assets.store';

  export let assetStore: AssetStore | null = null;
  export let asset: AssetResponseDto;
  export let publicSharedKey = '';
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

    getAllAlbums();

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

  $: asset.id && getAllAlbums(); // Update the album information when the asset ID changes

  const getAllAlbums = async () => {
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
        if (shiftKey) toggleArchive();
        return;
      case 'ArrowLeft':
        navigateAssetBackward();
        return;
      case 'ArrowRight':
        navigateAssetForward();
        return;
      case 'd':
      case 'D':
        if (shiftKey) downloadFile(asset, publicSharedKey);
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

  const navigateAssetForward = (e?: Event) => {
    e?.stopPropagation();
    dispatch('next');
  };

  const navigateAssetBackward = (e?: Event) => {
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

      navigateAssetForward();

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
      handleError(error, `Unable to ${asset.isFavorite ? `add asset to` : `remove asset from`} favorites`);
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
      handleError(error, `Unable to ${asset.isArchived ? `add asset to` : `remove asset from`} archive`);
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
      handleError(error, `Unable to submit job`);
    }
  };
</script>

<section
  id="immich-asset-viewer"
  class="fixed left-0 top-0 z-[1001] grid h-screen w-screen grid-cols-4 grid-rows-[64px_1fr] overflow-y-hidden bg-black"
>
  <div class="z-[1000] col-span-4 col-start-1 row-span-1 row-start-1 transition-transform">
    <AssetViewerNavBar
      {asset}
      isMotionPhotoPlaying={shouldPlayMotionPhoto}
      showCopyButton={canCopyImagesToClipboard && asset.type === AssetTypeEnum.Image}
      showZoomButton={asset.type === AssetTypeEnum.Image}
      showMotionPlayButton={!!asset.livePhotoVideoId}
      showDownloadButton={shouldShowDownloadButton}
      on:goBack={closeViewer}
      on:showDetail={showDetailInfoHandler}
      on:download={() => downloadFile(asset, publicSharedKey)}
      on:delete={() => (isShowDeleteConfirmation = true)}
      on:favorite={toggleFavorite}
      on:addToAlbum={() => openAlbumPicker(false)}
      on:addToSharedAlbum={() => openAlbumPicker(true)}
      on:playMotionPhoto={() => (shouldPlayMotionPhoto = true)}
      on:stopMotionPhoto={() => (shouldPlayMotionPhoto = false)}
      on:toggleArchive={toggleArchive}
      on:asProfileImage={() => (isShowProfileImageCrop = true)}
      on:runJob={({ detail: job }) => handleRunJob(job)}
    />
  </div>

  {#if showNavigation}
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
            {publicSharedKey}
            assetId={asset.livePhotoVideoId}
            on:close={closeViewer}
            on:onVideoEnded={() => (shouldPlayMotionPhoto = false)}
          />
        {:else if asset.exifInfo?.projectionType === ProjectionType.EQUIRECTANGULAR || asset.originalPath
            .toLowerCase()
            .endsWith('.insp')}
          <PanoramaViewer {publicSharedKey} {asset} />
        {:else}
          <PhotoViewer {publicSharedKey} {asset} on:close={closeViewer} />
        {/if}
      {:else}
        <VideoViewer {publicSharedKey} assetId={asset.id} on:close={closeViewer} />
      {/if}
    {/key}
  </div>

  {#if showNavigation}
    <div class="z-[999] col-span-1 col-start-4 row-span-1 row-start-2 mb-[60px] justify-self-end">
      <NavigationArea on:click={navigateAssetForward}><ChevronRight size="36" /></NavigationArea>
    </div>
  {/if}

  {#if $isShowDetail}
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
