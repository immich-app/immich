<script lang="ts">
  import { shortcuts } from '$lib/actions/shortcut';
  import { zoomImageAction } from '$lib/actions/zoom-image';
  import FaceEditor from '$lib/components/asset-viewer/face-editor/face-editor.svelte';
  import OcrBoundingBox from '$lib/components/asset-viewer/ocr-bounding-box.svelte';
  import BrokenAsset from '$lib/components/assets/broken-asset.svelte';
  import { assetViewerFadeDuration } from '$lib/constants';
  import { castManager } from '$lib/managers/cast-manager.svelte';
  import { preloadManager } from '$lib/managers/PreloadManager.svelte';
  import { photoViewerImgElement } from '$lib/stores/assets-store.svelte';
  import { isFaceEditMode } from '$lib/stores/face-edit.svelte';
  import { ocrManager } from '$lib/stores/ocr.svelte';
  import { boundingBoxesArray } from '$lib/stores/people.store';
  import { SlideshowLook, SlideshowState, slideshowLookCssMapping, slideshowStore } from '$lib/stores/slideshow.store';
  import { photoZoomState } from '$lib/stores/zoom-image.store';
  import { getAssetUrl, targetImageSize as getTargetImageSize, handlePromiseError } from '$lib/utils';
  import { canCopyImageToClipboard, copyImageToClipboard } from '$lib/utils/asset-utils';
  import { handleError } from '$lib/utils/handle-error';
  import { getOcrBoundingBoxes } from '$lib/utils/ocr-utils';
  import { getBoundingBox } from '$lib/utils/people-utils';
  import { getAltText } from '$lib/utils/thumbnail-util';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
  import { AssetMediaSize, type SharedLinkResponseDto } from '@immich/sdk';
  import { LoadingSpinner, toastManager } from '@immich/ui';
  import { onDestroy, onMount } from 'svelte';
  import { useSwipe, type SwipeCustomEvent } from 'svelte-gestures';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';
  import type { AssetCursor } from './asset-viewer.svelte';

  interface Props {
    cursor: AssetCursor;
    element?: HTMLDivElement | undefined;
    haveFadeTransition?: boolean;
    sharedLink?: SharedLinkResponseDto | undefined;
    onPreviousAsset?: (() => void) | null;
    onNextAsset?: (() => void) | null;
    copyImage?: () => Promise<void>;
    zoomToggle?: (() => void) | null;
  }

  let {
    cursor,
    element = $bindable(),
    haveFadeTransition = true,
    sharedLink = undefined,
    onPreviousAsset = null,
    onNextAsset = null,
    copyImage = $bindable(),
    zoomToggle = $bindable(),
  }: Props = $props();

  const { slideshowState, slideshowLook } = slideshowStore;
  const asset = $derived(cursor.current);

  let imageLoaded: boolean = $state(false);
  let originalImageLoaded: boolean = $state(false);
  let imageError: boolean = $state(false);

  let loader = $state<HTMLImageElement>();

  photoZoomState.set({
    currentRotation: 0,
    currentZoom: 1,
    enable: true,
    currentPositionX: 0,
    currentPositionY: 0,
  });

  onDestroy(() => {
    $boundingBoxesArray = [];
  });

  let ocrBoxes = $derived(
    ocrManager.showOverlay && $photoViewerImgElement
      ? getOcrBoundingBoxes(ocrManager.data, $photoZoomState, $photoViewerImgElement)
      : [],
  );

  let isOcrActive = $derived(ocrManager.showOverlay);

  copyImage = async () => {
    if (!canCopyImageToClipboard() || !$photoViewerImgElement) {
      return;
    }

    try {
      await copyImageToClipboard($photoViewerImgElement);
      toastManager.info($t('copied_image_to_clipboard'));
    } catch (error) {
      handleError(error, $t('copy_error'));
    }
  };

  zoomToggle = () => {
    photoZoomState.set({
      ...$photoZoomState,
      currentZoom: $photoZoomState.currentZoom > 1 ? 1 : 2,
    });
  };

  const onPlaySlideshow = () => ($slideshowState = SlideshowState.PlaySlideshow);

  $effect(() => {
    if (isFaceEditMode.value && $photoZoomState.currentZoom > 1) {
      zoomToggle();
    }
  });

  const onCopyShortcut = (event: KeyboardEvent) => {
    if (globalThis.getSelection()?.type === 'Range') {
      return;
    }
    event.preventDefault();
    handlePromiseError(copyImage());
  };

  const onSwipe = (event: SwipeCustomEvent) => {
    if ($photoZoomState.currentZoom > 1) {
      return;
    }

    if (ocrManager.showOverlay) {
      return;
    }

    if (onNextAsset && event.detail.direction === 'left') {
      onNextAsset();
    }

    if (onPreviousAsset && event.detail.direction === 'right') {
      onPreviousAsset();
    }
  };

  const targetImageSize = $derived(getTargetImageSize(asset, originalImageLoaded || $photoZoomState.currentZoom > 1));

  $effect(() => {
    if (imageLoaderUrl) {
      void cast(imageLoaderUrl);
    }
  });

  const cast = async (url: string) => {
    if (!url || !castManager.isCasting) {
      return;
    }
    const fullUrl = new URL(url, globalThis.location.href);

    try {
      await castManager.loadMedia(fullUrl.href);
    } catch (error) {
      handleError(error, 'Unable to cast');
      return;
    }
  };

  const onload = () => {
    imageLoaded = true;
    originalImageLoaded = targetImageSize === AssetMediaSize.Fullsize || targetImageSize === 'original';
  };

  const onerror = () => {
    imageError = imageLoaded = true;
  };

  onMount(() => {
    return () => {
      preloadManager.cancelPreloadUrl(imageLoaderUrl);
    };
  });

  let imageLoaderUrl = $derived(
    getAssetUrl({ asset, sharedLink, forceOriginal: originalImageLoaded || $photoZoomState.currentZoom > 1 }),
  );

  let containerWidth = $state(0);
  let containerHeight = $state(0);

  let lastUrl: string | undefined;

  $effect(() => {
    if (lastUrl && lastUrl !== imageLoaderUrl) {
      imageLoaded = false;
      originalImageLoaded = false;
      imageError = false;
    }
    lastUrl = imageLoaderUrl;
  });
</script>

<svelte:document
  use:shortcuts={[
    { shortcut: { key: 'z' }, onShortcut: zoomToggle, preventDefault: true },
    { shortcut: { key: 's' }, onShortcut: onPlaySlideshow, preventDefault: true },
    { shortcut: { key: 'c', ctrl: true }, onShortcut: onCopyShortcut, preventDefault: false },
    { shortcut: { key: 'c', meta: true }, onShortcut: onCopyShortcut, preventDefault: false },
    { shortcut: { key: 'z' }, onShortcut: zoomToggle, preventDefault: false },
  ]}
/>
{#if imageError}
  <div id="broken-asset" class="h-full w-full">
    <BrokenAsset class="text-xl h-full w-full" />
  </div>
{/if}
<img bind:this={loader} style="display:none" src={imageLoaderUrl} alt="" aria-hidden="true" {onload} {onerror} />
<div
  bind:this={element}
  class="relative h-full w-full select-none"
  bind:clientWidth={containerWidth}
  bind:clientHeight={containerHeight}
>
  {#if !imageLoaded}
    <div id="spinner" class="flex h-full items-center justify-center">
      <LoadingSpinner />
    </div>
  {:else if !imageError}
    <div
      use:zoomImageAction={{ disabled: isOcrActive }}
      {...useSwipe(onSwipe)}
      class="h-full w-full"
      transition:fade={{ duration: haveFadeTransition ? assetViewerFadeDuration : 0 }}
    >
      {#if $slideshowState !== SlideshowState.None && $slideshowLook === SlideshowLook.BlurredBackground}
        <img
          src={imageLoaderUrl}
          alt=""
          class="-z-1 absolute top-0 start-0 object-cover h-full w-full blur-lg"
          draggable="false"
        />
      {/if}
      <img
        bind:this={$photoViewerImgElement}
        src={imageLoaderUrl}
        alt={$getAltText(toTimelineAsset(asset))}
        class="h-full w-full {$slideshowState === SlideshowState.None
          ? 'object-contain'
          : slideshowLookCssMapping[$slideshowLook]}"
        draggable="false"
      />
      <!-- eslint-disable-next-line svelte/require-each-key -->
      {#each getBoundingBox($boundingBoxesArray, $photoZoomState, $photoViewerImgElement) as boundingbox}
        <div
          class="absolute border-solid border-white border-3 rounded-lg"
          style="top: {boundingbox.top}px; left: {boundingbox.left}px; height: {boundingbox.height}px; width: {boundingbox.width}px;"
        ></div>
      {/each}

      {#each ocrBoxes as ocrBox (ocrBox.id)}
        <OcrBoundingBox {ocrBox} />
      {/each}
    </div>

    {#if isFaceEditMode.value}
      <FaceEditor htmlElement={$photoViewerImgElement} {containerWidth} {containerHeight} assetId={asset.id} />
    {/if}
  {/if}
</div>

<style>
  @keyframes delayedVisibility {
    to {
      visibility: visible;
    }
  }
  #broken-asset,
  #spinner {
    visibility: hidden;
    animation: 0s linear 0.4s forwards delayedVisibility;
  }
</style>
