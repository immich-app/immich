<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import DeleteButton from './delete-button.svelte';
  import { user } from '$lib/stores/user.store';
  import { photoZoomState } from '$lib/stores/zoom-image.store';
  import { getAssetJobName } from '$lib/utils';
  import { openFileUploadDialog } from '$lib/utils/file-uploader';
  import { AssetJobName, AssetTypeEnum, type AlbumResponseDto, type AssetResponseDto } from '@immich/sdk';
  import {
    mdiAccountCircleOutline,
    mdiAlertOutline,
    mdiArchiveArrowDownOutline,
    mdiArchiveArrowUpOutline,
    mdiArrowLeft,
    mdiCogRefreshOutline,
    mdiContentCopy,
    mdiDatabaseRefreshOutline,
    mdiDotsVertical,
    mdiFolderDownloadOutline,
    mdiHeart,
    mdiHeartOutline,
    mdiHistory,
    mdiImageAlbum,
    mdiImageMinusOutline,
    mdiImageOutline,
    mdiImageRefreshOutline,
    mdiInformationOutline,
    mdiMagnifyMinusOutline,
    mdiMagnifyPlusOutline,
    mdiMotionPauseOutline,
    mdiPlaySpeed,
    mdiPresentationPlay,
    mdiShareVariantOutline,
    mdiUpload,
  } from '@mdi/js';
  import { createEventDispatcher } from 'svelte';
  import MenuOption from '../shared-components/context-menu/menu-option.svelte';
  import { t } from 'svelte-i18n';
  import ButtonContextMenu from '$lib/components/shared-components/context-menu/button-context-menu.svelte';

  export let asset: AssetResponseDto;
  export let album: AlbumResponseDto | null = null;
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

  $: isOwner = $user && asset.ownerId === $user?.id;

  type EventTypes = {
    back: void;
    stopMotionPhoto: void;
    playMotionPhoto: void;
    download: void;
    showDetail: void;
    favorite: void;
    delete: void;
    permanentlyDelete: void;
    toggleArchive: void;
    addToAlbum: void;
    restoreAsset: void;
    addToSharedAlbum: void;
    asProfileImage: void;
    setAsAlbumCover: void;
    runJob: AssetJobName;
    playSlideShow: void;
    unstack: void;
    showShareModal: void;
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
    <CircleIconButton color="opaque" icon={mdiArrowLeft} title={$t('go_back')} on:click={() => dispatch('back')} />
  </div>
  <div
    class="flex w-[calc(100%-3rem)] justify-end gap-2 overflow-hidden text-white"
    data-testid="asset-viewer-navbar-actions"
  >
    {#if showShareButton}
      <CircleIconButton
        color="opaque"
        icon={mdiShareVariantOutline}
        on:click={() => dispatch('showShareModal')}
        title={$t('share')}
      />
    {/if}
    {#if asset.isOffline}
      <CircleIconButton
        color="opaque"
        icon={mdiAlertOutline}
        on:click={() => dispatch('showDetail')}
        title={$t('asset_offline')}
      />
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
      <CircleIconButton
        color="opaque"
        icon={mdiFolderDownloadOutline}
        on:click={() => dispatch('download')}
        title={$t('download')}
      />
    {/if}

    {#if showDetailButton}
      <CircleIconButton
        color="opaque"
        icon={mdiInformationOutline}
        on:click={() => dispatch('showDetail')}
        title={$t('info')}
      />
    {/if}

    {#if isOwner}
      <CircleIconButton
        color="opaque"
        icon={asset.isFavorite ? mdiHeart : mdiHeartOutline}
        on:click={() => dispatch('favorite')}
        title={asset.isFavorite ? $t('unfavorite') : $t('to_favorite')}
      />
    {/if}

    {#if isOwner}
      <DeleteButton
        {asset}
        on:delete={() => dispatch('delete')}
        on:permanentlyDelete={() => dispatch('permanentlyDelete')}
      />
      <ButtonContextMenu direction="left" align="top-right" color="opaque" title={$t('more')} icon={mdiDotsVertical}>
        {#if showSlideshow}
          <MenuOption icon={mdiPresentationPlay} onClick={() => onMenuClick('playSlideShow')} text={$t('slideshow')} />
        {/if}
        {#if showDownloadButton}
          <MenuOption icon={mdiFolderDownloadOutline} onClick={() => onMenuClick('download')} text={$t('download')} />
        {/if}
        {#if asset.isTrashed}
          <MenuOption icon={mdiHistory} onClick={() => onMenuClick('restoreAsset')} text={$t('restore')} />
        {:else}
          <MenuOption icon={mdiImageAlbum} onClick={() => onMenuClick('addToAlbum')} text={$t('add_to_album')} />
          <MenuOption
            icon={mdiShareVariantOutline}
            onClick={() => onMenuClick('addToSharedAlbum')}
            text={$t('add_to_shared_album')}
          />
        {/if}

        {#if isOwner}
          {#if hasStackChildren}
            <MenuOption icon={mdiImageMinusOutline} onClick={() => onMenuClick('unstack')} text={$t('unstack')} />
          {/if}
          {#if album}
            <MenuOption
              text={$t('set_as_album_cover')}
              icon={mdiImageOutline}
              onClick={() => onMenuClick('setAsAlbumCover')}
            />
          {/if}
          {#if asset.type === AssetTypeEnum.Image}
            <MenuOption
              icon={mdiAccountCircleOutline}
              onClick={() => onMenuClick('asProfileImage')}
              text={$t('set_as_profile_picture')}
            />
          {/if}
          <MenuOption
            onClick={() => onMenuClick('toggleArchive')}
            icon={asset.isArchived ? mdiArchiveArrowUpOutline : mdiArchiveArrowDownOutline}
            text={asset.isArchived ? $t('unarchive') : $t('to_archive')}
          />
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
