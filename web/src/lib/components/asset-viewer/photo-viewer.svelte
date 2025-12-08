<script lang="ts">
  import { shortcuts } from '$lib/actions/shortcut';
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
  import { photoZoomState, resetZoomState } from '$lib/stores/zoom-image.store';
  import { getAssetUrl, targetImageSize as getTargetImageSize, handlePromiseError } from '$lib/utils';
  import { canCopyImageToClipboard, copyImageToClipboard } from '$lib/utils/asset-utils';
  import { handleError } from '$lib/utils/handle-error';
  import { getOcrBoundingBoxes } from '$lib/utils/ocr-utils';
  import { getBoundingBox } from '$lib/utils/people-utils';
  import { getAltText } from '$lib/utils/thumbnail-util';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
  import { AssetMediaSize, type AssetResponseDto, type SharedLinkResponseDto } from '@immich/sdk';
  import { LoadingSpinner, toastManager } from '@immich/ui';
  import { onDestroy, onMount, untrack } from 'svelte';
  import { useSwipe, type SwipeCustomEvent } from 'svelte-gestures';
  import { t } from 'svelte-i18n';

  interface Props {
    transitionName?: string | null;
    asset: AssetResponseDto;
    element?: HTMLDivElement | undefined;
    haveFadeTransition?: boolean;
    sharedLink?: SharedLinkResponseDto | undefined;
    onPreviousAsset?: (() => void) | null;
    onNextAsset?: (() => void) | null;
    onLoad?: (() => void) | null;
    onError?: (() => void) | null;
    onBusy?: (() => void) | null;
    onFree?: (() => void) | null;
    copyImage?: () => Promise<void>;
    zoomToggle?: (() => void) | null;
  }

  let {
    transitionName,
    asset,
    element = $bindable(),
    haveFadeTransition = true,
    sharedLink = undefined,
    onPreviousAsset = null,
    onNextAsset = null,
    onLoad,
    onError,
    onBusy,
    onFree,
    copyImage = $bindable(),
    zoomToggle = $bindable(),
  }: Props = $props();

  const { slideshowState, slideshowLook } = slideshowStore;
  haveFadeTransition = true;
  let imageLoaded: boolean = $state(false);
  let originalImageLoaded: boolean = $state(false);
  let imageError: boolean = $state(false);

  let loader = $state<HTMLImageElement>();

  resetZoomState();

  onDestroy(() => {
    $boundingBoxesArray = [];
  });

  const calculateSize = () => {
    // Recalculate size when image is loaded/errored
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    imageLoaded || imageError;

    const naturalWidth = loader?.naturalWidth ?? 1;
    const naturalHeight = loader?.naturalHeight ?? 1;

    const scaleX = containerWidth / naturalWidth;
    const scaleY = containerHeight / naturalHeight;

    // Use the smaller scale to ensure image fits (like object-fit: contain)
    const scale = Math.min(scaleX, scaleY);

    const scaledWidth = naturalWidth * scale;
    const scaledHeight = naturalHeight * scale;

    return {
      width: scaledWidth,
      height: scaledHeight,
      left: (containerWidth - scaledWidth) / 2,
      top: (containerHeight - scaledHeight) / 2,
    };
  };

  const box = $derived(calculateSize());

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
    onLoad?.();
    onFree?.();
    imageLoaded = true;
    originalImageLoaded = targetImageSize === AssetMediaSize.Fullsize || targetImageSize === 'original';
  };

  const onerror = () => {
    onError?.();
    onFree?.();
    imageError = imageLoaded = true;
  };

  onMount(() => {
    return () => {
      if (!imageLoaded && !imageError) {
        onFree?.();
      }
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
    if (!lastUrl) {
      untrack(() => onBusy?.());
    }
    if (lastUrl && lastUrl !== imageLoaderUrl) {
      untrack(() => {
        imageLoaded = false;
        originalImageLoaded = false;
        imageError = false;
        onBusy?.();
      });
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
  <div class="h-full w-full">
    <BrokenAsset class="text-xl h-full w-full" />
  </div>
{/if}
<img bind:this={loader} style="display:none" src={imageLoaderUrl} alt="" aria-hidden="true" {onload} {onerror} />
<div
  bind:this={element}
  class="absolute h-full w-full select-none"
  bind:clientWidth={containerWidth}
  bind:clientHeight={containerHeight}
>
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
    <div
      use:zoomImageAction={{ disabled: isOcrActive }}
      {...useSwipe(onSwipe)}
      style:width={box.width + 'px'}
      style:height={box.height + 'px'}
      style:left={box.left + 'px'}
      style:top={box.top + 'px'}
      class="absolute"
    >
      <img
        style:view-transition-name={transitionName}
        bind:this={$photoViewerImgElement}
        src={imageLoaderUrl}
        alt={$getAltText(toTimelineAsset(asset))}
        class="w-full h-full {$slideshowState === SlideshowState.None
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
  #spinner {
    visibility: hidden;
    animation: 0s linear 0.4s forwards delayedVisibility;
  }
</style>
