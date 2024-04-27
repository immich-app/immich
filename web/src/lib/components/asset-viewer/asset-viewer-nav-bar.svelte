<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import { user } from '$lib/stores/user.store';
  import { photoZoomState } from '$lib/stores/zoom-image.store';
  import { getAssetJobName } from '$lib/utils';
  import { clickOutside } from '$lib/utils/click-outside';
  import { getContextMenuPosition } from '$lib/utils/context-menu';
  import { AssetJobName, AssetTypeEnum, type AssetResponseDto, type AlbumResponseDto } from '@immich/sdk';
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
  } from '@mdi/js';
  import { createEventDispatcher } from 'svelte';
  import ContextMenu from '../shared-components/context-menu/context-menu.svelte';
  import MenuOption from '../shared-components/context-menu/menu-option.svelte';

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

  $: isOwner = asset.ownerId === $user?.id;

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
    <CircleIconButton isOpacity={true} icon={mdiArrowLeft} title="Go back" on:click={() => dispatch('back')} />
  </div>
  <div class="flex w-[calc(100%-3rem)] justify-end gap-2 overflow-hidden text-white">
    {#if showShareButton}
      <CircleIconButton
        isOpacity={true}
        icon={mdiShareVariantOutline}
        on:click={() => dispatch('showShareModal')}
        title="Share"
      />
    {/if}
    {#if asset.isOffline}
      <CircleIconButton
        isOpacity={true}
        icon={mdiAlertOutline}
        on:click={() => dispatch('showDetail')}
        title="Asset Offline"
      />
    {/if}
    {#if showMotionPlayButton}
      {#if isMotionPhotoPlaying}
        <CircleIconButton
          isOpacity={true}
          icon={mdiMotionPauseOutline}
          title="Stop Motion Photo"
          on:click={() => dispatch('stopMotionPhoto')}
        />
      {:else}
        <CircleIconButton
          isOpacity={true}
          icon={mdiPlaySpeed}
          title="Play Motion Photo"
          on:click={() => dispatch('playMotionPhoto')}
        />
      {/if}
    {/if}
    {#if showZoomButton}
      <CircleIconButton
        isOpacity={true}
        hideMobile={true}
        icon={$photoZoomState && $photoZoomState.currentZoom > 1 ? mdiMagnifyMinusOutline : mdiMagnifyPlusOutline}
        title="Zoom Image"
        on:click={() => {
          const zoomImage = new CustomEvent('zoomImage');
          window.dispatchEvent(zoomImage);
        }}
      />
    {/if}
    {#if showCopyButton}
      <CircleIconButton
        isOpacity={true}
        icon={mdiContentCopy}
        title="Copy Image"
        on:click={() => {
          const copyEvent = new CustomEvent('copyImage');
          window.dispatchEvent(copyEvent);
        }}
      />
    {/if}

    {#if !isOwner && showDownloadButton}
      <CircleIconButton
        isOpacity={true}
        icon={mdiFolderDownloadOutline}
        on:click={() => dispatch('download')}
        title="Download"
      />
    {/if}

    {#if showDetailButton}
      <CircleIconButton
        isOpacity={true}
        icon={mdiInformationOutline}
        on:click={() => dispatch('showDetail')}
        title="Info"
      />
    {/if}

    {#if isOwner}
      <CircleIconButton
        isOpacity={true}
        icon={asset.isFavorite ? mdiHeart : mdiHeartOutline}
        on:click={() => dispatch('favorite')}
        title={asset.isFavorite ? 'Unfavorite' : 'Favorite'}
      />
    {/if}

    {#if isOwner}
      {#if !asset.isReadOnly}
        <CircleIconButton isOpacity={true} icon={mdiDeleteOutline} on:click={() => dispatch('delete')} title="Delete" />
      {/if}
      <div
        use:clickOutside={{
          onOutclick: () => (isShowAssetOptions = false),
          onEscape: () => (isShowAssetOptions = false),
        }}
      >
        <CircleIconButton isOpacity={true} icon={mdiDotsVertical} on:click={showOptionsMenu} title="More" />
        {#if isShowAssetOptions}
          <ContextMenu {...contextMenuPosition} direction="left">
            {#if showSlideshow}
              <MenuOption icon={mdiPresentationPlay} on:click={() => onMenuClick('playSlideShow')} text="Slideshow" />
            {/if}
            {#if showDownloadButton}
              <MenuOption icon={mdiFolderDownloadOutline} on:click={() => onMenuClick('download')} text="Download" />
            {/if}
            {#if asset.isTrashed}
              <MenuOption icon={mdiHistory} on:click={() => onMenuClick('restoreAsset')} text="Restore" />
            {:else}
              <MenuOption icon={mdiImageAlbum} on:click={() => onMenuClick('addToAlbum')} text="Add to album" />
              <MenuOption
                icon={mdiShareVariantOutline}
                on:click={() => onMenuClick('addToSharedAlbum')}
                text="Add to shared album"
              />
            {/if}

            {#if isOwner}
              {#if hasStackChildren}
                <MenuOption icon={mdiImageMinusOutline} on:click={() => onMenuClick('unstack')} text="Un-stack" />
              {/if}
              {#if album}
                <MenuOption
                  text="Set as album cover"
                  icon={mdiImageOutline}
                  on:click={() => onMenuClick('setAsAlbumCover')}
                />
              {/if}
              {#if asset.type === AssetTypeEnum.Image}
                <MenuOption
                  icon={mdiAccountCircleOutline}
                  on:click={() => onMenuClick('asProfileImage')}
                  text="Set as profile picture"
                />
              {/if}
              <MenuOption
                on:click={() => dispatch('toggleArchive')}
                icon={asset.isArchived ? mdiArchiveArrowUpOutline : mdiArchiveArrowDownOutline}
                text={asset.isArchived ? 'Unarchive' : 'Archive'}
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
