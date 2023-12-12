<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import { photoZoomState } from '$lib/stores/zoom-image.store';
  import { clickOutside } from '$lib/utils/click-outside';
  import { getContextMenuPosition } from '$lib/utils/context-menu';
  import { AssetJobName, AssetResponseDto, AssetTypeEnum, api } from '@api';
  import {
    mdiAlertOutline,
    mdiArrowLeft,
    mdiCloudDownloadOutline,
    mdiContentCopy,
    mdiDeleteOutline,
    mdiDotsVertical,
    mdiHeart,
    mdiHeartOutline,
    mdiInformationOutline,
    mdiMagnifyMinusOutline,
    mdiMagnifyPlusOutline,
    mdiMotionPauseOutline,
    mdiPlaySpeed,
  } from '@mdi/js';
  import { createEventDispatcher } from 'svelte';
  import ContextMenu from '../shared-components/context-menu/context-menu.svelte';
  import MenuOption from '../shared-components/context-menu/menu-option.svelte';
  import { user } from '$lib/stores/user.store';

  export let asset: AssetResponseDto;
  export let showCopyButton: boolean;
  export let showZoomButton: boolean;
  export let showMotionPlayButton: boolean;
  export let isMotionPhotoPlaying = false;
  export let showDownloadButton: boolean;
  export let showDetailButton: boolean;
  export let showSlideshow = false;
  export let hasStackChildren = false;

  $: isOwner = asset.ownerId === $user?.id;

  type MenuItemEvent = 'addToAlbum' | 'addToSharedAlbum' | 'asProfileImage' | 'runJob' | 'playSlideShow' | 'unstack';

  const dispatch = createEventDispatcher<{
    goBack: void;
    stopMotionPhoto: void;
    playMotionPhoto: void;
    download: void;
    showDetail: void;
    favorite: void;
    delete: void;
    toggleArchive: void;
    addToAlbum: void;
    addToSharedAlbum: void;
    asProfileImage: void;
    runJob: AssetJobName;
    playSlideShow: void;
    unstack: void;
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
    <CircleIconButton isOpacity={true} icon={mdiArrowLeft} on:click={() => dispatch('goBack')} />
  </div>
  <div class="flex w-[calc(100%-3rem)] justify-end gap-2 overflow-hidden text-white">
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

    {#if showDownloadButton}
      <CircleIconButton
        isOpacity={true}
        icon={mdiCloudDownloadOutline}
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
        title="Favorite"
      />
    {/if}

    {#if isOwner}
      {#if !asset.isReadOnly || !asset.isExternal}
        <CircleIconButton isOpacity={true} icon={mdiDeleteOutline} on:click={() => dispatch('delete')} title="Delete" />
      {/if}
      <div use:clickOutside on:outclick={() => (isShowAssetOptions = false)}>
        <CircleIconButton isOpacity={true} icon={mdiDotsVertical} on:click={showOptionsMenu} title="More" />
        {#if isShowAssetOptions}
          <ContextMenu {...contextMenuPosition} direction="left">
            {#if showSlideshow}
              <MenuOption on:click={() => onMenuClick('playSlideShow')} text="Slideshow" />
            {/if}
            <MenuOption on:click={() => onMenuClick('addToAlbum')} text="Add to Album" />
            <MenuOption on:click={() => onMenuClick('addToSharedAlbum')} text="Add to Shared Album" />

            {#if isOwner}
              <MenuOption
                on:click={() => dispatch('toggleArchive')}
                text={asset.isArchived ? 'Unarchive' : 'Archive'}
              />
              <MenuOption on:click={() => onMenuClick('asProfileImage')} text="As profile picture" />

              {#if hasStackChildren}
                <MenuOption on:click={() => onMenuClick('unstack')} text="Un-Stack" />
              {/if}

              <MenuOption
                on:click={() => onJobClick(AssetJobName.RefreshMetadata)}
                text={api.getAssetJobName(AssetJobName.RefreshMetadata)}
              />
              <MenuOption
                on:click={() => onJobClick(AssetJobName.RegenerateThumbnail)}
                text={api.getAssetJobName(AssetJobName.RegenerateThumbnail)}
              />
              {#if asset.type === AssetTypeEnum.Video}
                <MenuOption
                  on:click={() => onJobClick(AssetJobName.TranscodeVideo)}
                  text={api.getAssetJobName(AssetJobName.TranscodeVideo)}
                />
              {/if}
            {/if}
          </ContextMenu>
        {/if}
      </div>
    {/if}
  </div>
</div>
