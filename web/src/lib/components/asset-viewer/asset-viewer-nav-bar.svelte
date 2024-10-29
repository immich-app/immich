<script lang="ts">
  import { goto } from '$app/navigation';
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
  import { AppRoute } from '$lib/constants';
  import { user } from '$lib/stores/user.store';
  import { photoZoomState } from '$lib/stores/zoom-image.store';
  import { getAssetJobName, getSharedLink } from '$lib/utils';
  import { openFileUploadDialog } from '$lib/utils/file-uploader';
  import {
    AssetJobName,
    AssetTypeEnum,
    type AlbumResponseDto,
    type AssetResponseDto,
    type StackResponseDto,
  } from '@immich/sdk';
  import {
    mdiAlertOutline,
    mdiCogRefreshOutline,
    mdiContentCopy,
    mdiDatabaseRefreshOutline,
    mdiDotsVertical,
    mdiHeadSyncOutline,
    mdiImageRefreshOutline,
    mdiImageSearch,
    mdiMagnifyMinusOutline,
    mdiMagnifyPlusOutline,
    mdiPresentationPlay,
    mdiUpload,
  } from '@mdi/js';
  import { canCopyImageToClipboard } from '$lib/utils/asset-utils';
  import { t } from 'svelte-i18n';

  export let asset: AssetResponseDto;
  export let album: AlbumResponseDto | null = null;
  export let stack: StackResponseDto | null = null;
  export let showDetailButton: boolean;
  export let showSlideshow = false;
  export let onZoomImage: () => void;
  export let onCopyImage: () => void;
  export let onAction: OnAction;
  export let onRunJob: (name: AssetJobName) => void;
  export let onPlaySlideshow: () => void;
  export let onShowDetail: () => void;
  // export let showEditorHandler: () => void;
  export let onClose: () => void;

  const sharedLink = getSharedLink();
  $: isOwner = $user && asset.ownerId === $user?.id;
  $: showDownloadButton = sharedLink ? sharedLink.allowDownload : !asset.isOffline;
  // $: showEditorButton =
  //   isOwner &&
  //   asset.type === AssetTypeEnum.Image &&
  //   !(
  //     asset.exifInfo?.projectionType === ProjectionType.EQUIRECTANGULAR ||
  //     (asset.originalPath && asset.originalPath.toLowerCase().endsWith('.insp'))
  //   ) &&
  //   !(asset.originalPath && asset.originalPath.toLowerCase().endsWith('.gif')) &&
  //   !asset.livePhotoVideoId;
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
    {#if !asset.isTrashed && $user}
      <ShareAction {asset} />
    {/if}
    {#if asset.isOffline}
      <CircleIconButton color="alert" icon={mdiAlertOutline} on:click={onShowDetail} title={$t('asset_offline')} />
    {/if}
    {#if asset.livePhotoVideoId}
      <slot name="motion-photo" />
    {/if}
    {#if asset.type === AssetTypeEnum.Image}
      <CircleIconButton
        color="opaque"
        hideMobile={true}
        icon={$photoZoomState && $photoZoomState.currentZoom > 1 ? mdiMagnifyMinusOutline : mdiMagnifyPlusOutline}
        title={$t('zoom_image')}
        on:click={onZoomImage}
      />
    {/if}
    {#if canCopyImageToClipboard() && asset.type === AssetTypeEnum.Image}
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
    <!-- {#if showEditorButton}
      <CircleIconButton
        color="opaque"
        hideMobile={true}
        icon={mdiImageEditOutline}
        on:click={showEditorHandler}
        title={$t('editor')}
      />
    {/if} -->

    {#if isOwner}
      <DeleteAction {asset} {onAction} />

      <ButtonContextMenu direction="left" align="top-right" color="opaque" title={$t('more')} icon={mdiDotsVertical}>
        {#if showSlideshow}
          <MenuOption icon={mdiPresentationPlay} text={$t('slideshow')} onClick={onPlaySlideshow} />
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
          {#if stack}
            <UnstackAction {stack} {onAction} />
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
          {#if !asset.isArchived && !asset.isTrashed}
            <MenuOption
              icon={mdiImageSearch}
              onClick={() => goto(`${AppRoute.PHOTOS}?at=${asset.id}`)}
              text={$t('view_in_timeline')}
            />
          {/if}
          <hr />
          <MenuOption
            icon={mdiHeadSyncOutline}
            onClick={() => onRunJob(AssetJobName.RefreshFaces)}
            text={$getAssetJobName(AssetJobName.RefreshFaces)}
          />
          <MenuOption
            icon={mdiDatabaseRefreshOutline}
            onClick={() => onRunJob(AssetJobName.RefreshMetadata)}
            text={$getAssetJobName(AssetJobName.RefreshMetadata)}
          />
          <MenuOption
            icon={mdiImageRefreshOutline}
            onClick={() => onRunJob(AssetJobName.RegenerateThumbnail)}
            text={$getAssetJobName(AssetJobName.RegenerateThumbnail)}
          />
          {#if asset.type === AssetTypeEnum.Video}
            <MenuOption
              icon={mdiCogRefreshOutline}
              onClick={() => onRunJob(AssetJobName.TranscodeVideo)}
              text={$getAssetJobName(AssetJobName.TranscodeVideo)}
            />
          {/if}
        {/if}
      </ButtonContextMenu>
    {/if}
  </div>
</div>
