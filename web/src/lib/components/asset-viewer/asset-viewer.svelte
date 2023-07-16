<script lang="ts">
  import { goto } from '$app/navigation';
  import { AlbumResponseDto, api, AssetResponseDto, AssetTypeEnum, SharedLinkResponseDto } from '@api';
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
  import ConfirmDialogue from '$lib/components/shared-components/confirm-dialogue.svelte';
  import ProfileImageCropper from '../shared-components/profile-image-cropper.svelte';

  import { assetStore } from '$lib/stores/assets.store';
  import { isShowDetail } from '$lib/stores/preferences.store';
  import { addAssetsToAlbum, downloadFile } from '$lib/utils/asset-utils';
  import NavigationArea from './navigation-area.svelte';
  import { browser } from '$app/environment';

  export let asset: AssetResponseDto;
  export let publicSharedKey = '';
  export let showNavigation = true;
  export let sharedLink: SharedLinkResponseDto | undefined = undefined;

  const dispatch = createEventDispatcher();
  let appearsInAlbums: AlbumResponseDto[] = [];
  let isShowAlbumPicker = false;
  let isShowDeleteConfirmation = false;
  let addToSharedAlbum = true;
  let shouldPlayMotionPhoto = false;
  let isShowProfileImageCrop = false;
  let shouldShowDownloadButton = sharedLink ? sharedLink.allowDownload : true;
  let canCopyImagesToClipboard: boolean;
  const onKeyboardPress = (keyInfo: KeyboardEvent) => handleKeyboardPress(keyInfo.key);

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

  const handleKeyboardPress = (key: string) => {
    switch (key) {
      case 'Escape':
        closeViewer();
        return;
      case 'Delete':
        isShowDeleteConfirmation = true;
        return;
      case 'i':
        $isShowDetail = !$isShowDetail;
        return;
      case 'ArrowLeft':
        navigateAssetBackward();
        return;
      case 'ArrowRight':
        navigateAssetForward();
        return;
    }
  };

  const handleCloseViewer = () => {
    $isShowDetail = false;
    closeViewer();
  };

  const closeViewer = () => {
    dispatch('close');
  };

  const navigateAssetForward = (e?: Event) => {
    e?.stopPropagation();
    dispatch('navigate-next');
  };

  const navigateAssetBackward = (e?: Event) => {
    e?.stopPropagation();
    dispatch('navigate-previous');
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
          assetStore.removeAsset(asset.id);
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
    const { data } = await api.assetApi.updateAsset({
      id: asset.id,
      updateAssetDto: {
        isFavorite: !asset.isFavorite,
      },
    });

    asset.isFavorite = data.isFavorite;
    assetStore.updateAsset(asset.id, data.isFavorite);
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

    addAssetsToAlbum(album.id, [asset.id]).then((dto) => {
      if (dto.successfullyAdded === 1 && dto.album) {
        appearsInAlbums = [...appearsInAlbums, dto.album];
      }
    });
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

      if (data.isArchived) {
        dispatch('archived', data);
      } else {
        dispatch('unarchived', data);
      }

      notificationController.show({
        type: NotificationType.Info,
        message: asset.isArchived ? `Added to archive` : `Removed from archive`,
      });
    } catch (error) {
      console.error(error);
      notificationController.show({
        type: NotificationType.Error,
        message: `Error ${asset.isArchived ? 'archiving' : 'unarchiving'} asset, check console for more details`,
      });
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
</script>

<section
  id="immich-asset-viewer"
  class="fixed h-screen w-screen left-0 top-0 overflow-y-hidden bg-black z-[1001] grid grid-rows-[64px_1fr] grid-cols-4"
>
  <div class="col-start-1 col-span-4 row-start-1 row-span-1 z-[1000] transition-transform">
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
    />
  </div>

  {#if showNavigation}
    <div class="row-start-2 row-span-1 col-start-1 column-span-1 justify-self-start mb-[60px] z-[999]">
      <NavigationArea on:click={navigateAssetBackward}><ChevronLeft size="36" /></NavigationArea>
    </div>
  {/if}

  <div class="row-start-1 row-span-full col-start-1 col-span-4">
    {#key asset.id}
      {#if !asset.resized}
        <div class="h-full w-full flex justify-center">
          <div
            class="h-full bg-gray-100 dark:bg-immich-dark-gray flex items-center justify-center aspect-square px-auto"
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
        {:else}
          <PhotoViewer {publicSharedKey} {asset} on:close={closeViewer} />
        {/if}
      {:else}
        <VideoViewer {publicSharedKey} assetId={asset.id} on:close={closeViewer} />
      {/if}
    {/key}
  </div>

  {#if showNavigation}
    <div class="row-start-2 row-span-1 col-start-4 col-span-1 justify-self-end mb-[60px] z-[999]">
      <NavigationArea on:click={navigateAssetForward}><ChevronRight size="36" /></NavigationArea>
    </div>
  {/if}

  {#if $isShowDetail}
    <div
      transition:fly={{ duration: 150 }}
      id="detail-panel"
      class="bg-immich-bg w-[360px] z-[1002] row-span-full transition-all overflow-y-auto dark:bg-immich-dark-bg dark:border-l dark:border-l-immich-dark-gray"
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
