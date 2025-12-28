<script lang="ts">
  import { shortcuts } from '$lib/actions/shortcut';
  import { swipeFeedback } from '$lib/actions/swipe-feedback';
  import { zoomImageAction } from '$lib/actions/zoom-image';
  import FaceEditor from '$lib/components/asset-viewer/face-editor/face-editor.svelte';
  import OcrBoundingBox from '$lib/components/asset-viewer/ocr-bounding-box.svelte';
  import BrokenAsset from '$lib/components/assets/broken-asset.svelte';
  import { castManager } from '$lib/managers/cast-manager.svelte';
  import { preloadManager } from '$lib/managers/PreloadManager.svelte';
  import { photoViewerImgElement } from '$lib/stores/assets-store.svelte';
  import { isFaceEditMode } from '$lib/stores/face-edit.svelte';
  import { ocrManager } from '$lib/stores/ocr.svelte';
  import { boundingBoxesArray } from '$lib/stores/people.store';
  import { SlideshowLook, SlideshowState, slideshowLookCssMapping, slideshowStore } from '$lib/stores/slideshow.store';
  import { photoZoomState } from '$lib/stores/zoom-image.store';
  import { getAssetUrl, targetImageSize as getTargetImageSize, handlePromiseError } from '$lib/utils';
  import { canCopyImageToClipboard, copyImageToClipboard, getDimensions } from '$lib/utils/asset-utils';
  import { handleError } from '$lib/utils/handle-error';
  import { scaleToFit } from '$lib/utils/layout-utils';
  import { getOcrBoundingBoxes } from '$lib/utils/ocr-utils';
  import { getBoundingBox } from '$lib/utils/people-utils';
  import { getAltText } from '$lib/utils/thumbnail-util';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
  import { AssetMediaSize, type SharedLinkResponseDto } from '@immich/sdk';
  import { LoadingSpinner, toastManager } from '@immich/ui';
  import { onDestroy, onMount, untrack } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { AssetCursor } from './asset-viewer.svelte';

  interface Props {
    cursor: AssetCursor;
    element?: HTMLDivElement;
    sharedLink?: SharedLinkResponseDto;
    onPreviousAsset?: (() => void) | null;
    onFree?: (() => void) | null;
    onBusy?: (() => void) | null;
    onError?: (() => void) | null;
    onLoad?: (() => void) | null;
    onNextAsset?: (() => void) | null;
    copyImage?: () => Promise<void>;
    zoomToggle?: (() => void) | null;
  }

  let {
    cursor,
    element = $bindable(),
    sharedLink,
    onPreviousAsset = null,
    onNextAsset = null,
    onFree = null,
    onBusy = null,
    onError = null,
    onLoad = null,
    copyImage = $bindable(),
    zoomToggle = $bindable(),
  }: Props = $props();

  const { slideshowState, slideshowLook } = slideshowStore;
  const asset = $derived(cursor.current);

  let imageLoaded: boolean = $state(false);
  let originalImageLoaded: boolean = $state(false);
  let imageError: boolean = $state(false);

  let loader = $state<HTMLImageElement>();

  const box = $derived.by(() => {
    const { width, height } = scaledDimensions;
    return {
      width: width + 'px',
      height: height + 'px',
      left: (containerWidth - width) / 2 + 'px',
      top: (containerHeight - height) / 2 + 'px',
    };
  });

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
  const handleSwipeCommit = (direction: 'left' | 'right') => {
    if (direction === 'left' && onNextAsset) {
      // Swiped left, go to next asset
      onNextAsset();
    } else if (direction === 'right' && onPreviousAsset) {
      // Swiped right, go to previous asset
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
    onLoad?.();
    onFree?.();
    imageLoaded = true;
    dimensions = {
      width: loader?.naturalWidth ?? 1,
      height: loader?.naturalHeight ?? 1,
    };
    originalImageLoaded = targetImageSize === AssetMediaSize.Fullsize || targetImageSize === 'original';
  };

  const onerror = () => {
    onError?.();
    onFree?.();
    dimensions = {
      width: loader?.naturalWidth ?? 1,
      height: loader?.naturalHeight ?? 1,
    };
    imageError = imageLoaded = true;
  };

  onMount(() => {
    return () => {
      if (!imageLoaded && !imageError) {
        onFree?.();
      }
      if (imageLoaderUrl) {
        preloadManager.cancelPreloadUrl(imageLoaderUrl);
      }
    };
  });

  const imageLoaderUrl = $derived(
    getAssetUrl({ asset, sharedLink, forceOriginal: originalImageLoaded || $photoZoomState.currentZoom > 1 }),
  );
  const previousAssetUrl = $derived(getAssetUrl({ asset: cursor.previousAsset, sharedLink }));
  const nextAssetUrl = $derived(getAssetUrl({ asset: cursor.nextAsset, sharedLink }));

  const exifDimensions = $derived(
    asset.exifInfo?.exifImageHeight && asset.exifInfo.exifImageHeight
      ? (getDimensions(asset.exifInfo) as { width: number; height: number })
      : null,
  );

  let containerWidth = $state(0);
  let containerHeight = $state(0);
  const container = $derived({
    width: containerWidth,
    height: containerHeight,
  });
  let dimensions = $derived(exifDimensions ?? { width: 1, height: 1 });
  const scaledDimensions = $derived(scaleToFit(dimensions, container));

  let lastUrl: string | undefined | null | null;
  let lastPreviousUrl: string | undefined | null;
  let lastNextUrl: string | undefined | null;

  $effect(() => {
    if (!lastUrl) {
      untrack(() => onBusy?.());
    }
    if (lastUrl && lastUrl !== imageLoaderUrl) {
      untrack(() => {
        const isPreviewedImage = imageLoaderUrl === lastPreviousUrl || imageLoaderUrl === lastNextUrl;

        if (!isPreviewedImage) {
          // It is a previewed image - prevent flicker - skip spinner but still let loader go through lifecycle
          imageLoaded = false;
        }

        originalImageLoaded = false;
        imageError = false;
        onBusy?.();
      });
    }
    lastUrl = imageLoaderUrl;
    lastPreviousUrl = previousAssetUrl;
    lastNextUrl = nextAssetUrl;
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
  use:swipeFeedback={{
    disabled: isOcrActive || $photoZoomState.currentZoom > 1,
    onSwipeCommit: handleSwipeCommit,
    leftPreviewUrl: previousAssetUrl,
    rightPreviewUrl: nextAssetUrl,
    currentAssetUrl: imageLoaderUrl,
    target: $photoViewerImgElement,
  }}
>
  <div class="absolute" style:width={box.width} style:height={box.height} style:left={box.left} style:top={box.top}>
    {#if !imageLoaded}
      <div id="spinner" class="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    {:else if !imageError}
      {#if $slideshowState !== SlideshowState.None && $slideshowLook === SlideshowLook.BlurredBackground}
        <img
          src={imageLoaderUrl}
          alt=""
          class="-z-1 absolute top-0 start-0 object-cover h-full w-full blur-lg"
          draggable="false"
        />
      {/if}
      <div use:zoomImageAction={{ disabled: isOcrActive }} style:width={box.width} style:height={box.height}>
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
