<script lang="ts">
  import { shortcuts } from '$lib/actions/shortcut';
  import { swipeFeedback } from '$lib/actions/swipe-feedback';
  import { thumbhash } from '$lib/actions/thumbhash';
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
  import { SlideshowLook, slideshowLookCssMapping, SlideshowState, slideshowStore } from '$lib/stores/slideshow.store';
  import { photoZoomState, resetZoomState } from '$lib/stores/zoom-image.store';
  import {
    getAssetThumbnailUrl,
    getAssetUrl,
    targetImageSize as getTargetImageSize,
    handlePromiseError,
  } from '$lib/utils';
  import { canCopyImageToClipboard, copyImageToClipboard, getDimensions } from '$lib/utils/asset-utils';
  import { handleError } from '$lib/utils/handle-error';
  import { scaleToFit } from '$lib/utils/layout-utils';
  import { getOcrBoundingBoxes } from '$lib/utils/ocr-utils';
  import { getBoundingBox } from '$lib/utils/people-utils';
  import { cancelImageUrl } from '$lib/utils/sw-messaging';
  import { getAltText } from '$lib/utils/thumbnail-util';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
  import { AssetMediaSize, type SharedLinkResponseDto } from '@immich/sdk';
  import { LoadingSpinner, toastManager } from '@immich/ui';
  import { onDestroy, onMount, untrack } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { AssetCursor } from './asset-viewer.svelte';

  interface Props {
    transitionName?: string | null | undefined;
    cursor: AssetCursor;
    element?: HTMLDivElement;
    sharedLink?: SharedLinkResponseDto;
    onPreviousAsset?: (() => void) | null;
    onNextAsset?: (() => void) | null;
    onFree?: (() => void) | null;
    onReady?: (() => void) | null;
    copyImage?: () => Promise<void>;
    zoomToggle?: (() => void) | null;
  }

  let {
    cursor,
    transitionName,
    element = $bindable(),
    sharedLink,
    onPreviousAsset = null,
    onNextAsset = null,
    onReady,
    onFree,
    copyImage = $bindable(),
    zoomToggle = $bindable(),
  }: Props = $props();

  const { slideshowState, slideshowLook } = slideshowStore;
  const asset = $derived(cursor.current);
  const nextAsset = $derived(cursor.nextAsset);
  const previousAsset = $derived(cursor.previousAsset);

  let swipeTarget = $state<HTMLElement | undefined>();
  let imageLoaded: boolean = $state(false);
  let originalImageLoaded: boolean = $state(false);
  let imageError: boolean = $state(false);

  let loader = $state<HTMLImageElement>();
  $effect(() => {
    if (loader) {
      const _loader = loader;
      const _src = loader.src;
      const _imageLoaderUrl = imageLoaderUrl;
      _loader.addEventListener('load', () => {
        if (_loader.src === _src && imageLoaderUrl === _imageLoaderUrl) {
          onload();
        }
      });
      _loader.addEventListener('error', () => {
        if (_loader.src === _src && imageLoaderUrl === _imageLoaderUrl) {
          onerror();
        }
      });
    }
  });

  resetZoomState();

  onDestroy(() => {
    $boundingBoxesArray = [];
  });

  const box = $derived.by(() => {
    const { width, height } = scaledDimensions;
    return {
      width: width + 'px',
      height: height + 'px',
      left: (containerWidth - width) / 2 + 'px',
      top: (containerHeight - height) / 2 + 'px',
    };
  });

  const blurredSlideshow = $derived(
    $slideshowState !== SlideshowState.None && $slideshowLook === SlideshowLook.BlurredBackground && asset.thumbhash,
  );
  const transitionLetterboxLeft = $derived(transitionName === 'hero' || blurredSlideshow ? null : 'letterbox-left');
  const transitionLetterboxRight = $derived(transitionName === 'hero' || blurredSlideshow ? null : 'letterbox-right');
  const transitionLetterboxTop = $derived(transitionName === 'hero' || blurredSlideshow ? null : 'letterbox-top');
  const transitionLetterboxBottom = $derived(transitionName === 'hero' || blurredSlideshow ? null : 'letterbox-bottom');

  // Letterbox regions (the empty space around the main box)
  const letterboxLeft = $derived.by(() => {
    const { width } = scaledDimensions;
    const leftOffset = (containerWidth - width) / 2;
    return {
      width: leftOffset + 'px',
      height: containerHeight + 'px',
      left: '0px',
      top: '0px',
    };
  });

  const letterboxRight = $derived.by(() => {
    const { width } = scaledDimensions;
    const leftOffset = (containerWidth - width) / 2;
    const rightOffset = leftOffset;
    return {
      width: rightOffset + 'px',
      height: containerHeight + 'px',
      left: containerWidth - rightOffset + 'px',
      top: '0px',
    };
  });

  const letterboxTop = $derived.by(() => {
    const { width, height } = scaledDimensions;
    const topOffset = (containerHeight - height) / 2;
    const leftOffset = (containerWidth - width) / 2;
    return {
      width: width + 'px',
      height: topOffset + 'px',
      left: leftOffset + 'px',
      top: '0px',
    };
  });

  const letterboxBottom = $derived.by(() => {
    const { width, height } = scaledDimensions;
    const topOffset = (containerHeight - height) / 2;
    const bottomOffset = topOffset;
    const leftOffset = (containerWidth - width) / 2;
    return {
      width: width + 'px',
      height: bottomOffset + 'px',
      left: leftOffset + 'px',
      top: containerHeight - bottomOffset + 'px',
    };
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

  let lastFreedUrl: string | undefined | null;
  const notifyFree = () => {
    if (lastFreedUrl !== imageLoaderUrl) {
      onFree?.();
      lastFreedUrl = imageLoaderUrl;
    }
  };

  const notifyReady = () => {
    onReady?.();
  };

  const onload = () => {
    imageLoaded = true;
    notifyFree();
    dimensions = {
      width: loader?.naturalWidth ?? 1,
      height: loader?.naturalHeight ?? 1,
    };
    originalImageLoaded = targetImageSize === AssetMediaSize.Fullsize || targetImageSize === 'original';
  };

  const onerror = () => {
    notifyFree();
    dimensions = {
      width: loader?.naturalWidth ?? 1,
      height: loader?.naturalHeight ?? 1,
    };
    imageError = true;
  };

  onMount(() => {
    notifyReady();
    return () => {
      if (!imageLoaded && !imageError) {
        notifyFree();
      }
      if (imageLoaderUrl) {
        preloadManager.cancelPreloadUrl(imageLoaderUrl);
      }
    };
  });

  const imageLoaderUrl = $derived(
    getAssetUrl({ asset, sharedLink, forceOriginal: originalImageLoaded || $photoZoomState.currentZoom > 1 }),
  );
  const previousAssetUrl = $derived(getAssetUrl({ asset: previousAsset, sharedLink }));
  const nextAssetUrl = $derived(getAssetUrl({ asset: nextAsset, sharedLink }));
  const thumbnailUrl = $derived(
    getAssetThumbnailUrl({
      id: asset.id,
      size: AssetMediaSize.Thumbnail,
      cacheKey: asset.thumbhash,
    }),
  );
  let thumbnailPreloaded = $state(false);
  $effect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    asset;
    untrack(() => {
      void preloadManager.isUrlPreloaded(thumbnailUrl).then((preloaded) => (thumbnailPreloaded = preloaded));
    });
  });

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

  let lastUrl: string | undefined;

  $effect(() => {
    if (lastUrl !== imageLoaderUrl && imageLoaderUrl) {
      untrack(() => {
        imageLoaded = false;
        originalImageLoaded = false;
        imageError = false;
        cancelImageUrl(lastUrl);
        notifyReady();
      });
    }

    lastUrl = imageLoaderUrl;
  });
  $effect(() => {
    $photoViewerImgElement = loader;
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
    target: swipeTarget,
  }}
>
  {#if blurredSlideshow}
    <canvas
      id="test"
      use:thumbhash={{ base64ThumbHash: asset.thumbhash! }}
      class="-z-1 absolute top-0 left-0 start-0 h-dvh w-dvw"
    ></canvas>
  {/if}
  <div
    class="absolute"
    style:view-transition-name={transitionLetterboxLeft}
    style:left={letterboxLeft.left}
    style:top={letterboxLeft.top}
    style:width={letterboxLeft.width}
    style:height={letterboxLeft.height}
  ></div>
  <div
    class="absolute"
    style:view-transition-name={transitionLetterboxRight}
    style:left={letterboxRight.left}
    style:top={letterboxRight.top}
    style:width={letterboxRight.width}
    style:height={letterboxRight.height}
  ></div>
  <div
    class="absolute"
    style:view-transition-name={transitionLetterboxTop}
    style:left={letterboxTop.left}
    style:top={letterboxTop.top}
    style:width={letterboxTop.width}
    style:height={letterboxTop.height}
  ></div>
  <div
    class="absolute"
    style:view-transition-name={transitionLetterboxBottom}
    style:left={letterboxBottom.left}
    style:top={letterboxBottom.top}
    style:width={letterboxBottom.width}
    style:height={letterboxBottom.height}
  ></div>
  <div
    style:view-transition-name={transitionName}
    data-transition-name={transitionName}
    class="absolute"
    style:left={box.left}
    style:top={box.top}
    style:width={box.width}
    style:height={box.height}
    bind:this={swipeTarget}
  >
    {#if asset.thumbhash}
      <canvas data-blur use:thumbhash={{ base64ThumbHash: asset.thumbhash }} class="h-full w-full absolute -z-2"
      ></canvas>
      {#if thumbnailPreloaded}
        <img src={thumbnailUrl} alt={$getAltText(toTimelineAsset(asset))} class="h-full w-full absolute -z-1" />
      {/if}
    {/if}
    {#if !imageLoaded && !asset.thumbhash && !imageError}
      <div id="spinner" class="absolute flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    {/if}
    {#if imageError}
      <div class="h-full w-full">
        <BrokenAsset class="text-xl h-full w-full" />
      </div>
    {/if}
    {#key imageLoaderUrl}
      <div
        use:zoomImageAction={{ disabled: isOcrActive }}
        style:width={box.width}
        style:height={box.height}
        style:overflow="visible"
        class="absolute"
      >
        <img
          decoding="async"
          data-photo
          bind:this={loader}
          src={imageLoaderUrl}
          alt={$getAltText(toTimelineAsset(asset))}
          class={[
            'w-full',
            'h-full',
            $slideshowState === SlideshowState.None ? 'object-contain' : slideshowLookCssMapping[$slideshowLook],
            imageError && 'hidden',
          ]}
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
    {/key}
    {#if isFaceEditMode.value}
      <FaceEditor htmlElement={$photoViewerImgElement} {containerWidth} {containerHeight} assetId={asset.id} />
    {/if}
  </div>
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
  [data-blur] {
    visibility: hidden;
    animation: 0s linear 0.1s forwards delayedVisibility;
  }
</style>
