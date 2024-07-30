<script lang="ts">
  import type { OnAction } from '$lib/components/asset-viewer/actions/action';
  import AddToAlbumAction from '$lib/components/asset-viewer/actions/add-to-album-action.svelte';
  import ArchiveAction from '$lib/components/asset-viewer/actions/archive-action.svelte';
  import CloseAction from '$lib/components/asset-viewer/actions/close-action.svelte';
  import DeleteAction from '$lib/components/asset-viewer/actions/delete-action.svelte';
  import DownloadAction from '$lib/components/asset-viewer/actions/download-action.svelte';
  import FavoriteAction from '$lib/components/asset-viewer/actions/favorite-action.svelte';
  import RestoreAction from '$lib/components/asset-viewer/actions/restore-action.svelte';
  import SetAlbumCoverAction from '$lib/components/asset-viewer/actions/set-album-cover-action.svelte';
  import SetProfilePictureAction from '$lib/components/asset-viewer/actions/set-profile-picture-action.svelte';
  import ShareAction from '$lib/components/asset-viewer/actions/share-action.svelte';
  import ShowDetailAction from '$lib/components/asset-viewer/actions/show-detail-action.svelte';
  import UnstackAction from '$lib/components/asset-viewer/actions/unstack-action.svelte';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import ButtonContextMenu from '$lib/components/shared-components/context-menu/button-context-menu.svelte';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { user } from '$lib/stores/user.store';
  import { photoZoomState } from '$lib/stores/zoom-image.store';
  import { getAssetJobName } from '$lib/utils';
  import { openFileUploadDialog } from '$lib/utils/file-uploader';
  import { AssetJobName, AssetTypeEnum, type AlbumResponseDto, type AssetResponseDto } from '@immich/sdk';
  import {
    mdiAlertOutline,
    mdiCogRefreshOutline,
    mdiContentCopy,
    mdiDatabaseRefreshOutline,
    mdiDotsVertical,
    mdiImageRefreshOutline,
    mdiMagnifyMinusOutline,
    mdiMagnifyPlusOutline,
    mdiMotionPauseOutline,
    mdiPlaySpeed,
    mdiPresentationPlay,
    mdiUpload,
  } from '@mdi/js';
  import { createEventDispatcher } from 'svelte';
  import { t } from 'svelte-i18n';

  export let asset: AssetResponseDto;
  export let album: AlbumResponseDto | null = null;
  export let stackedAssets: AssetResponseDto[];
  export let showCopyButton: boolean;
  export let showZoomButton: boolean;
  export let showMotionPlayButton: boolean;
  export let isMotionPhotoPlaying = false;
  export let showDownloadButton: boolean;
  export let showDetailButton: boolean;
  export let showShareButton: boolean;
  export let showSlideshow = false;
  export let hasStackChildren = false;
  export let onZoomImage: () => void;
  export let onCopyImage: () => void;
  export let onAction: OnAction;
  export let onShowDetail: () => void;
  export let onClose: () => void;

  $: isOwner = $user && asset.ownerId === $user?.id;

  type EventTypes = {
    stopMotionPhoto: void;
    playMotionPhoto: void;
    runJob: AssetJobName;
    playSlideShow: void;
  };

  const dispatch = createEventDispatcher<EventTypes>();

  const onJobClick = (name: AssetJobName) => {
    dispatch('runJob', name);
  };

  const onMenuClick = (eventName: keyof EventTypes) => {
    dispatch(eventName);
  };
</script>

<div
  class="z-[1001] flex h-16 place-items-center justify-between bg-gradient-to-b from-black/40 px-3 transition-transform duration-200"
>
  <div class="text-white">
    <CloseAction {onClose} />
  </div>
  <div
    class="flex w-[calc(100%-3rem)] justify-end gap-2 overflow-hidden text-white"
    data-testid="asset-viewer-navbar-actions"
  >
    {#if showShareButton}
      <ShareAction {asset} />
    {/if}
    {#if asset.isOffline}
      <CircleIconButton color="opaque" icon={mdiAlertOutline} on:click={onShowDetail} title={$t('asset_offline')} />
    {/if}
    {#if showMotionPlayButton}
      {#if isMotionPhotoPlaying}
        <CircleIconButton
          color="opaque"
          icon={mdiMotionPauseOutline}
          title={$t('stop_motion_photo')}
          on:click={() => dispatch('stopMotionPhoto')}
        />
      {:else}
        <CircleIconButton
          color="opaque"
          icon={mdiPlaySpeed}
          title={$t('play_motion_photo')}
          on:click={() => dispatch('playMotionPhoto')}
        />
      {/if}
    {/if}
    {#if showZoomButton}
      <CircleIconButton
        color="opaque"
        hideMobile={true}
        icon={$photoZoomState && $photoZoomState.currentZoom > 1 ? mdiMagnifyMinusOutline : mdiMagnifyPlusOutline}
        title={$t('zoom_image')}
        on:click={onZoomImage}
      />
    {/if}
    {#if showCopyButton}
      <CircleIconButton color="opaque" icon={mdiContentCopy} title={$t('copy_image')} on:click={onCopyImage} />
    {/if}

    {#if !isOwner && showDownloadButton}
      <DownloadAction {asset} />
    {/if}

    {#if showDetailButton}
      <ShowDetailAction {onShowDetail} />
    {/if}

    {#if isOwner}
      <FavoriteAction {asset} {onAction} />
    {/if}

    {#if isOwner}
      <DeleteAction {asset} {onAction} />

      <ButtonContextMenu direction="left" align="top-right" color="opaque" title={$t('more')} icon={mdiDotsVertical}>
        {#if showSlideshow}
          <MenuOption icon={mdiPresentationPlay} onClick={() => onMenuClick('playSlideShow')} text={$t('slideshow')} />
        {/if}
        {#if showDownloadButton}
          <DownloadAction {asset} menuItem />
        {/if}
        {#if asset.isTrashed}
          <RestoreAction {asset} {onAction} />
        {:else}
          <AddToAlbumAction {asset} {onAction} />
          <AddToAlbumAction {asset} {onAction} shared />
        {/if}

        {#if isOwner}
          {#if hasStackChildren}
            <UnstackAction {stackedAssets} {onAction} />
          {/if}
          {#if album}
            <SetAlbumCoverAction {asset} {album} />
          {/if}
          {#if asset.type === AssetTypeEnum.Image}
            <SetProfilePictureAction {asset} />
          {/if}
          <ArchiveAction {asset} {onAction} />
          <MenuOption
            icon={mdiUpload}
            onClick={() => openFileUploadDialog({ multiple: false, assetId: asset.id })}
            text={$t('replace_with_upload')}
          />
          <hr />
          <MenuOption
            icon={mdiDatabaseRefreshOutline}
            onClick={() => onJobClick(AssetJobName.RefreshMetadata)}
            text={$getAssetJobName(AssetJobName.RefreshMetadata)}
          />
          <MenuOption
            icon={mdiImageRefreshOutline}
            onClick={() => onJobClick(AssetJobName.RegenerateThumbnail)}
            text={$getAssetJobName(AssetJobName.RegenerateThumbnail)}
          />
          {#if asset.type === AssetTypeEnum.Video}
            <MenuOption
              icon={mdiCogRefreshOutline}
              onClick={() => onJobClick(AssetJobName.TranscodeVideo)}
              text={$getAssetJobName(AssetJobName.TranscodeVideo)}
            />
          {/if}
        {/if}
      </ButtonContextMenu>
    {/if}
  </div>
</div>
