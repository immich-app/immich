<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import { user } from '$lib/stores/user.store';
  import { photoZoomState } from '$lib/stores/zoom-image.store';
  import { getAssetJobName } from '$lib/utils';
  import { clickOutside } from '$lib/actions/click-outside';
  import { getContextMenuPosition } from '$lib/utils/context-menu';
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
    mdiDeleteOutline,
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
  import ContextMenu from '../shared-components/context-menu/context-menu.svelte';
  import MenuOption from '../shared-components/context-menu/menu-option.svelte';
  import { t } from 'svelte-i18n';

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

  $: isOwner = $user && asset.ownerId === $user?.id;

  type MenuItemEvent =
    | 'addToAlbum'
    | 'restoreAsset'
    | 'addToSharedAlbum'
    | 'asProfileImage'
    | 'setAsAlbumCover'
    | 'download'
    | 'playSlideShow'
    | 'runJob'
    | 'unstack';

  const dispatch = createEventDispatcher<{
    back: void;
    stopMotionPhoto: void;
    playMotionPhoto: void;
    download: void;
    showDetail: void;
    favorite: void;
    delete: void;
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
  }>();

  let contextMenuPosition = { x: 0, y: 0 };
  let isShowAssetOptions = false;

  const showOptionsMenu = (event: MouseEvent) => {
    contextMenuPosition = getContextMenuPosition(event, 'top-right');
    isShowAssetOptions = !isShowAssetOptions;
  };

  const onJobClick = (name: AssetJobName) => {
    isShowAssetOptions = false;
    dispatch('runJob', name);
  };

  const onMenuClick = (eventName: MenuItemEvent) => {
    isShowAssetOptions = false;
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
        on:click={() => {
          const zoomImage = new CustomEvent('zoomImage');
          window.dispatchEvent(zoomImage);
        }}
      />
    {/if}
    {#if showCopyButton}
      <CircleIconButton
        color="opaque"
        icon={mdiContentCopy}
        title={$t('copy_image')}
        on:click={() => {
          const copyEvent = new CustomEvent('copyImage');
          window.dispatchEvent(copyEvent);
        }}
      />
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
        title={asset.isFavorite ? $t('unfavorite') : $t('favorite')}
      />
    {/if}

    {#if isOwner}
      <CircleIconButton
        color="opaque"
        icon={mdiDeleteOutline}
        on:click={() => dispatch('delete')}
        title={$t('delete')}
      />
      <div
        use:clickOutside={{
          onOutclick: () => (isShowAssetOptions = false),
          onEscape: () => (isShowAssetOptions = false),
        }}
      >
        <CircleIconButton color="opaque" icon={mdiDotsVertical} on:click={showOptionsMenu} title={$t('more')} />
        {#if isShowAssetOptions}
          <ContextMenu {...contextMenuPosition} direction="left">
            {#if showSlideshow}
              <MenuOption
                icon={mdiPresentationPlay}
                on:click={() => onMenuClick('playSlideShow')}
                text={$t('slideshow')}
              />
            {/if}
            {#if showDownloadButton}
              <MenuOption
                icon={mdiFolderDownloadOutline}
                on:click={() => onMenuClick('download')}
                text={$t('download')}
              />
            {/if}
            {#if asset.isTrashed}
              <MenuOption icon={mdiHistory} on:click={() => onMenuClick('restoreAsset')} text={$t('restore')} />
            {:else}
              <MenuOption icon={mdiImageAlbum} on:click={() => onMenuClick('addToAlbum')} text={$t('add_to_album')} />
              <MenuOption
                icon={mdiShareVariantOutline}
                on:click={() => onMenuClick('addToSharedAlbum')}
                text={$t('add_to_shared_album')}
              />
            {/if}

            {#if isOwner}
              {#if hasStackChildren}
                <MenuOption icon={mdiImageMinusOutline} on:click={() => onMenuClick('unstack')} text={$t('un-stack')} />
              {/if}
              {#if album}
                <MenuOption
                  text={$t('set_as_album_cover')}
                  icon={mdiImageOutline}
                  on:click={() => onMenuClick('setAsAlbumCover')}
                />
              {/if}
              {#if asset.type === AssetTypeEnum.Image}
                <MenuOption
                  icon={mdiAccountCircleOutline}
                  on:click={() => onMenuClick('asProfileImage')}
                  text={$t('set_as_profile_picture')}
                />
              {/if}
              <MenuOption
                on:click={() => dispatch('toggleArchive')}
                icon={asset.isArchived ? mdiArchiveArrowUpOutline : mdiArchiveArrowDownOutline}
                text={asset.isArchived ? $t('unarchive') : $t('archive')}
              />
              <MenuOption
                icon={mdiUpload}
                on:click={() => openFileUploadDialog({ multiple: false, assetId: asset.id })}
                text={$t('replace_with_upload')}
              />
              <hr />
              <MenuOption
                icon={mdiDatabaseRefreshOutline}
                on:click={() => onJobClick(AssetJobName.RefreshMetadata)}
                text={getAssetJobName(AssetJobName.RefreshMetadata)}
              />
              <MenuOption
                icon={mdiImageRefreshOutline}
                on:click={() => onJobClick(AssetJobName.RegenerateThumbnail)}
                text={getAssetJobName(AssetJobName.RegenerateThumbnail)}
              />
              {#if asset.type === AssetTypeEnum.Video}
                <MenuOption
                  icon={mdiCogRefreshOutline}
                  on:click={() => onJobClick(AssetJobName.TranscodeVideo)}
                  text={getAssetJobName(AssetJobName.TranscodeVideo)}
                />
              {/if}
            {/if}
          </ContextMenu>
        {/if}
      </div>
    {/if}
  </div>
</div>
