<script lang="ts">
  import { shortcuts } from '$lib/actions/shortcut';
  import { zoomImageAction, zoomed } from '$lib/actions/zoom-image';
  import BrokenAsset from '$lib/components/assets/broken-asset.svelte';
  import { photoViewer } from '$lib/stores/assets.store';
  import { boundingBoxesArray } from '$lib/stores/people.store';
  import { alwaysLoadOriginalFile } from '$lib/stores/preferences.store';
  import { SlideshowLook, SlideshowState, slideshowLookCssMapping, slideshowStore } from '$lib/stores/slideshow.store';
  import { photoZoomState } from '$lib/stores/zoom-image.store';
  import { getAssetOriginalUrl, getAssetThumbnailUrl, handlePromiseError } from '$lib/utils';
  import { isWebCompatibleImage, canCopyImageToClipboard, copyImageToClipboard } from '$lib/utils/asset-utils';
  import { getBoundingBox } from '$lib/utils/people-utils';
  import { getAltText } from '$lib/utils/thumbnail-util';
  import { AssetMediaSize, AssetTypeEnum, type AssetResponseDto, type SharedLinkResponseDto } from '@immich/sdk';
  import { onDestroy } from 'svelte';
  import { t } from 'svelte-i18n';
  import { type SwipeCustomEvent, swipe } from 'svelte-gestures';
  import { fade } from 'svelte/transition';
  import LoadingSpinner from '../shared-components/loading-spinner.svelte';
  import { NotificationType, notificationController } from '../shared-components/notification/notification';
  import { handleError } from '$lib/utils/handle-error';
  import { imageManager } from '$lib/utils/image-manager';

  export let asset: AssetResponseDto;
  export let preloadAssets: AssetResponseDto[] = [];
  export let element: HTMLDivElement | undefined = undefined;
  export let haveFadeTransition = true;
  export let sharedLink: SharedLinkResponseDto | undefined = undefined;
  export let onPreviousAsset: (() => void) | null = null;
  export let onNextAsset: (() => void) | null = null;
  export let copyImage: (() => Promise<void>) | null = null;
  export let zoomToggle: (() => void) | null = null;

  const { slideshowState, slideshowLook } = slideshowStore;

  let assetFileUrl: string = '';
  let imageLoaded: boolean = false;
  let imageError: boolean = false;
  let forceUseOriginal: boolean = false;

  $: isWebCompatible = isWebCompatibleImage(asset);
  $: useOriginalByDefault = isWebCompatible && $alwaysLoadOriginalFile;
  $: useOriginalImage = useOriginalByDefault || forceUseOriginal;
  // when true, will force loading of the original image
  $: forceUseOriginal =
    forceUseOriginal || asset.originalMimeType === 'image/gif' || ($photoZoomState.currentZoom > 1 && isWebCompatible);
  $: mainPhotoUrl = getAssetUrl(asset.id, useOriginalImage, asset.checksum);

  $: {
    const preloads = preloadAssets
      .filter((preloadAsset) => preloadAsset.type === AssetTypeEnum.Image)
      .map((preloadAsset) => getAssetUrl(preloadAsset.id, useOriginalImage, preloadAsset.checksum));
    // [0] will always be the loader of the main photo, the rest of the elements are preloads, if any
    imageManager.exclusiveLoadImages([mainPhotoUrl, ...preloads])[0].then(
      () => {
        imageLoaded = true;
        assetFileUrl = mainPhotoUrl;
      },
      () => {
        imageLoaded = true;
        imageError = true;
      },
    );
  }

  photoZoomState.set({
    currentRotation: 0,
    currentZoom: 1,
    enable: true,
    currentPositionX: 0,
    currentPositionY: 0,
  });
  $zoomed = false;

  onDestroy(() => {
    $boundingBoxesArray = [];
  });

  const getAssetUrl = (id: string, useOriginal: boolean, checksum: string) => {
    if (sharedLink && (!sharedLink.allowDownload || !sharedLink.showMetadata)) {
      return getAssetThumbnailUrl({ id, size: AssetMediaSize.Preview, checksum });
    }

    return useOriginal
      ? getAssetOriginalUrl({ id, checksum })
      : getAssetThumbnailUrl({ id, size: AssetMediaSize.Preview, checksum });
  };

  copyImage = async () => {
    if (!canCopyImageToClipboard()) {
      return;
    }

    try {
      await copyImageToClipboard($photoViewer ?? assetFileUrl);
      notificationController.show({
        type: NotificationType.Info,
        message: $t('copied_image_to_clipboard'),
        timeout: 3000,
      });
    } catch (error) {
      handleError(error, $t('copy_error'));
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

  const onSwipe = (event: SwipeCustomEvent) => {
    if ($photoZoomState.currentZoom > 1) {
      return;
    }
    if (onNextAsset && event.detail.direction === 'left') {
      onNextAsset();
    }
    if (onPreviousAsset && event.detail.direction === 'right') {
      onPreviousAsset();
    }
  };
</script>

<svelte:window
  use:shortcuts={[
    { shortcut: { key: 'c', ctrl: true }, onShortcut: onCopyShortcut, preventDefault: false },
    { shortcut: { key: 'c', meta: true }, onShortcut: onCopyShortcut, preventDefault: false },
  ]}
/>
{#if imageError}
  <BrokenAsset class="text-xl" />
{/if}

<div bind:this={element} class="relative h-full select-none">
  {#if !imageLoaded}
    <div id="spinner" class="flex h-full items-center justify-center">
      <LoadingSpinner />
    </div>
  {:else if !imageError}
    <div
      use:zoomImageAction
      use:swipe
      on:swipe={onSwipe}
      class="h-full w-full"
      transition:fade={{ duration: haveFadeTransition ? 150 : 0 }}
    >
      {#if $slideshowState !== SlideshowState.None && $slideshowLook === SlideshowLook.BlurredBackground}
        <img
          src={assetFileUrl}
          alt={$getAltText(asset)}
          class="absolute top-0 left-0 -z-10 object-cover h-full w-full blur-lg"
          draggable="false"
        />
      {/if}
      <img
        bind:this={$photoViewer}
        src={assetFileUrl}
        alt={$getAltText(asset)}
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

<style>
  @keyframes delayedVisibility {
    to {
      visibility: visible;
    }
  }
  #spinner {
    visibility: hidden;
    animation: 0s linear 0.4s forwards delayedVisibility;
  }
</style>
