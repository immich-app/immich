<script lang="ts">
  import { shortcuts } from '$lib/actions/shortcut';
  import { photoViewer } from '$lib/stores/assets.store';
  import { boundingBoxesArray } from '$lib/stores/people.store';
  import { alwaysLoadOriginalFile } from '$lib/stores/preferences.store';
  import { SlideshowLook, SlideshowState, slideshowLookCssMapping, slideshowStore } from '$lib/stores/slideshow.store';
  import { photoZoomState } from '$lib/stores/zoom-image.store';
  import { getAssetFileUrl, handlePromiseError } from '$lib/utils';
  import { isWebCompatibleImage } from '$lib/utils/asset-utils';
  import { getBoundingBox } from '$lib/utils/people-utils';
  import { getAltText } from '$lib/utils/thumbnail-util';
  import { AssetTypeEnum, type AssetResponseDto } from '@immich/sdk';
  import { zoomImageAction, zoomed } from '$lib/actions/zoom-image';
  import { canCopyImagesToClipboard, copyImageToClipboard } from 'copy-image-clipboard';
  import { onDestroy } from 'svelte';

  import { fade } from 'svelte/transition';
  import LoadingSpinner from '../shared-components/loading-spinner.svelte';
  import { NotificationType, notificationController } from '../shared-components/notification/notification';

  export let asset: AssetResponseDto;
  export let preloadAssets: AssetResponseDto[] | null = null;
  export let element: HTMLDivElement | undefined = undefined;
  export let haveFadeTransition = true;

  export let copyImage: () => Promise<void>;
  export let zoomToggle: () => void;

  const { slideshowState, slideshowLook } = slideshowStore;
  const loadOriginalByDefault = $alwaysLoadOriginalFile && isWebCompatibleImage(asset);

  let assetFileUrl: string = '';
  let imageLoaded: boolean = false;
  let imageError: boolean = false;
  // when true, will force loading of the original image
  let forceLoadOriginal: boolean = false;

  $: {
    preload({ preloadAssets, loadOriginal: loadOriginalByDefault });
  }

  $: imageLoaderUrl = load(asset.id, loadOriginalByDefault || forceLoadOriginal, false, asset.checksum);

  photoZoomState.set({
    currentRotation: 0,
    currentZoom: 1,
    enable: true,
    currentPositionX: 0,
    currentPositionY: 0,
  });

  $zoomed = false;

  const unsubscribeZoomState = photoZoomState.subscribe((state) => {
    forceLoadOriginal = forceLoadOriginal || (state.currentZoom > 1 && isWebCompatibleImage(asset)) ? true : false;
    haveFadeTransition = false;
  });

  onDestroy(() => {
    $boundingBoxesArray = [];
    unsubscribeZoomState();
  });

  const preload = ({
    preloadAssets,
    loadOriginal,
  }: {
    preloadAssets: AssetResponseDto[] | null;
    loadOriginal: boolean;
  }) => {
    for (const preloadAsset of preloadAssets || []) {
      if (preloadAsset.type === AssetTypeEnum.Image) {
        let img = new Image();
        img.src = getAssetFileUrl(preloadAsset.id, !loadOriginal, false, preloadAsset.checksum);
      }
    }
  };

  const load = (assetId: string, isOriginal: boolean, isThumb: boolean, checksum: string) => {
    return getAssetFileUrl(assetId, !isOriginal, isThumb, checksum);
  };

  copyImage = async () => {
    if (!canCopyImagesToClipboard()) {
      return;
    }

    try {
      await copyImageToClipboard(assetFileUrl);
      notificationController.show({
        type: NotificationType.Info,
        message: 'Copied image to clipboard.',
        timeout: 3000,
      });
    } catch (error) {
      console.error('Error [photo-viewer]:', error);
      notificationController.show({
        type: NotificationType.Error,
        message: 'Copying image to clipboard failed.',
      });
    }
  };

  zoomToggle = () => {
    $zoomed = $zoomed ? false : true;
  };

  const onCopyShortcut = (event: KeyboardEvent) => {
    if (window.getSelection()?.type === 'Range') {
      return;
    }
    event.preventDefault();
    handlePromiseError(copyImage());
  };
</script>

<svelte:window
  on:wheel|preventDefault|nonpassive
  use:shortcuts={[
    { shortcut: { key: 'c', ctrl: true }, onShortcut: onCopyShortcut, preventDefault: false },
    { shortcut: { key: 'c', meta: true }, onShortcut: onCopyShortcut, preventDefault: false },
  ]}
/>
{#if imageError}
  <div class="h-full flex items-center justify-center">Error loading image</div>
{/if}
<div bind:this={element} class="relative h-full select-none">
  <img
    style="display:none"
    src={imageLoaderUrl}
    alt={getAltText(asset)}
    on:load={() => ((imageLoaded = true), (assetFileUrl = imageLoaderUrl))}
    on:error={() => (imageError = imageLoaded = true)}
  />
  {#if !imageLoaded}
    <div class="flex h-full items-center justify-center">
      <LoadingSpinner />
    </div>
  {:else if !imageError}
    <div use:zoomImageAction class="h-full w-full" transition:fade={{ duration: haveFadeTransition ? 150 : 0 }}>
      {#if $slideshowState !== SlideshowState.None && $slideshowLook === SlideshowLook.BlurredBackground}
        <img
          src={assetFileUrl}
          alt={getAltText(asset)}
          class="absolute top-0 left-0 -z-10 object-cover h-full w-full blur-lg"
          draggable="false"
        />
      {/if}
      <img
        bind:this={$photoViewer}
        src={assetFileUrl}
        alt={getAltText(asset)}
        class="h-full w-full {$slideshowState === SlideshowState.None
          ? 'object-contain'
          : slideshowLookCssMapping[$slideshowLook]}"
        draggable="false"
      />
      {#each getBoundingBox($boundingBoxesArray, $photoZoomState, $photoViewer) as boundingbox}
        <div
          class="absolute border-solid border-white border-[3px] rounded-lg"
          style="top: {boundingbox.top}px; left: {boundingbox.left}px; height: {boundingbox.height}px; width: {boundingbox.width}px;"
        />
      {/each}
    </div>
  {/if}
</div>
