<script lang="ts">
  import { shortcuts } from '$lib/actions/shortcut';
  import { zoomImageAction } from '$lib/actions/zoom-image';
  import FaceEditor from '$lib/components/asset-viewer/face-editor/face-editor.svelte';
  import OcrBoundingBox from '$lib/components/asset-viewer/ocr-bounding-box.svelte';
  import BrokenAsset from '$lib/components/assets/broken-asset.svelte';
  import AssetViewerEvents from '$lib/components/AssetViewerEvents.svelte';
  import { assetViewerFadeDuration } from '$lib/constants';
  import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';
  import { castManager } from '$lib/managers/cast-manager.svelte';
  import { imageManager } from '$lib/managers/ImageManager.svelte';
  import { isFaceEditMode } from '$lib/stores/face-edit.svelte';
  import { ocrManager } from '$lib/stores/ocr.svelte';
  import { boundingBoxesArray, type Faces } from '$lib/stores/people.store';
  import { SlideshowLook, SlideshowState, slideshowLookCssMapping, slideshowStore } from '$lib/stores/slideshow.store';
  import { getAssetUrl, targetImageSize as getTargetImageSize, handlePromiseError } from '$lib/utils';
  import { canCopyImageToClipboard, copyImageToClipboard } from '$lib/utils/asset-utils';
  import { type ContentMetrics, getContentMetrics } from '$lib/utils/container-utils';
  import { handleError } from '$lib/utils/handle-error';
  import { getOcrBoundingBoxes } from '$lib/utils/ocr-utils';
  import { getBoundingBox } from '$lib/utils/people-utils';
  import { getAltText } from '$lib/utils/thumbnail-util';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
  import { AssetMediaSize, type SharedLinkResponseDto } from '@immich/sdk';
  import { LoadingSpinner, toastManager } from '@immich/ui';
  import { onDestroy, untrack } from 'svelte';
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
  }

  let {
    cursor,
    element = $bindable(),
    haveFadeTransition = true,
    sharedLink = undefined,
    onPreviousAsset = null,
    onNextAsset = null,
  }: Props = $props();

  const { slideshowState, slideshowLook } = slideshowStore;
  const asset = $derived(cursor.current);

  let imageLoaded: boolean = $state(false);
  let originalImageLoaded: boolean = $state(false);
  let imageError: boolean = $state(false);
  let visibleImageReady: boolean = $state(false);

  let loader = $state<HTMLImageElement>();

  $effect.pre(() => {
    void asset.id;
    untrack(() => {
      assetViewerManager.resetZoomState();
      $boundingBoxesArray = [];
    });
  });

  onDestroy(() => {
    $boundingBoxesArray = [];
  });

  const overlayMetrics = $derived.by((): ContentMetrics => {
    if (!assetViewerManager.imgRef || !visibleImageReady) {
      return { contentWidth: 0, contentHeight: 0, offsetX: 0, offsetY: 0 };
    }

    const { contentWidth, contentHeight, offsetX, offsetY } = getContentMetrics(assetViewerManager.imgRef);
    const { currentZoom, currentPositionX, currentPositionY } = assetViewerManager.zoomState;

    return {
      contentWidth: contentWidth * currentZoom,
      contentHeight: contentHeight * currentZoom,
      offsetX: offsetX * currentZoom + currentPositionX,
      offsetY: offsetY * currentZoom + currentPositionY,
    };
  });

  let ocrBoxes = $derived(ocrManager.showOverlay ? getOcrBoundingBoxes(ocrManager.data, overlayMetrics) : []);

  let isOcrActive = $derived(ocrManager.showOverlay);

  const onCopy = async () => {
    if (!canCopyImageToClipboard() || !assetViewerManager.imgRef) {
      return;
    }

    try {
      await copyImageToClipboard(assetViewerManager.imgRef);
      toastManager.info($t('copied_image_to_clipboard'));
    } catch (error) {
      handleError(error, $t('copy_error'));
    }
  };

  const onZoom = () => {
    assetViewerManager.zoom = assetViewerManager.zoom > 1 ? 1 : 2;
  };

  const onPlaySlideshow = () => ($slideshowState = SlideshowState.PlaySlideshow);

  $effect(() => {
    if (isFaceEditMode.value && assetViewerManager.zoom > 1) {
      onZoom();
    }
  });

  // TODO move to action + command palette
  const onCopyShortcut = (event: KeyboardEvent) => {
    if (globalThis.getSelection()?.type === 'Range') {
      return;
    }
    event.preventDefault();

    handlePromiseError(onCopy());
  };

  const onSwipe = (event: SwipeCustomEvent) => {
    if (assetViewerManager.zoom > 1) {
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

  const targetImageSize = $derived(getTargetImageSize(asset, originalImageLoaded || assetViewerManager.zoom > 1));

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

  onDestroy(() => imageManager.cancel(asset, targetImageSize));

  let imageLoaderUrl = $derived(
    getAssetUrl({ asset, sharedLink, forceOriginal: originalImageLoaded || assetViewerManager.zoom > 1 }),
  );

  let containerWidth = $state(0);
  let containerHeight = $state(0);

  let lastUrl: string | undefined;

  $effect(() => {
    if (lastUrl && lastUrl !== imageLoaderUrl) {
      untrack(() => {
        imageLoaded = false;
        originalImageLoaded = false;
        imageError = false;
        visibleImageReady = false;
      });
    }
    lastUrl = imageLoaderUrl;
  });

  const faceToNameMap = $derived.by(() => {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const map = new Map<Faces, string>();
    for (const person of asset.people ?? []) {
      for (const face of person.faces ?? []) {
        map.set(face, person.name);
      }
    }
    return map;
  });

  const faces = $derived(Array.from(faceToNameMap.keys()));

  const handleImageMouseMove = (event: MouseEvent) => {
    $boundingBoxesArray = [];
    if (!assetViewerManager.imgRef || !element || isFaceEditMode.value || ocrManager.showOverlay) {
      return;
    }

    const containerRect = element.getBoundingClientRect();
    const mouseX = event.clientX - containerRect.left;
    const mouseY = event.clientY - containerRect.top;

    const faceBoxes = getBoundingBox(faces, overlayMetrics);

    for (const [index, box] of faceBoxes.entries()) {
      if (mouseX >= box.left && mouseX <= box.left + box.width && mouseY >= box.top && mouseY <= box.top + box.height) {
        $boundingBoxesArray.push(faces[index]);
      }
    }
  };

  const handleImageMouseLeave = () => {
    $boundingBoxesArray = [];
  };
</script>

<AssetViewerEvents {onCopy} {onZoom} />

<svelte:document
  use:shortcuts={[
    { shortcut: { key: 'z' }, onShortcut: onZoom, preventDefault: true },
    { shortcut: { key: 's' }, onShortcut: onPlaySlideshow, preventDefault: true },
    { shortcut: { key: 'c', ctrl: true }, onShortcut: onCopyShortcut, preventDefault: false },
    { shortcut: { key: 'c', meta: true }, onShortcut: onCopyShortcut, preventDefault: false },
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
  role="presentation"
  ondblclick={onZoom}
  onmousemove={handleImageMouseMove}
  onmouseleave={handleImageMouseLeave}
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
        bind:this={assetViewerManager.imgRef}
        src={imageLoaderUrl}
        onload={() => (visibleImageReady = true)}
        alt={$getAltText(toTimelineAsset(asset))}
        class="h-full w-full {$slideshowState === SlideshowState.None
          ? 'object-contain'
          : slideshowLookCssMapping[$slideshowLook]}"
        draggable="false"
      />
      {#each getBoundingBox($boundingBoxesArray, overlayMetrics) as boundingbox, index (boundingbox.id)}
        <div
          class="absolute border-solid border-white border-3 rounded-lg"
          style="top: {boundingbox.top}px; left: {boundingbox.left}px; height: {boundingbox.height}px; width: {boundingbox.width}px;"
        ></div>
        {#if faceToNameMap.get($boundingBoxesArray[index])}
          <div
            class="absolute bg-white/90 text-black px-2 py-1 rounded text-sm font-medium whitespace-nowrap pointer-events-none shadow-lg"
            style="top: {boundingbox.top + boundingbox.height + 4}px; left: {boundingbox.left +
              boundingbox.width}px; transform: translateX(-100%);"
          >
            {faceToNameMap.get($boundingBoxesArray[index])}
          </div>
        {/if}
      {/each}

      {#each ocrBoxes as ocrBox (ocrBox.id)}
        <OcrBoundingBox {ocrBox} />
      {/each}
    </div>

    {#if isFaceEditMode.value}
      <FaceEditor htmlElement={assetViewerManager.imgRef} {containerWidth} {containerHeight} assetId={asset.id} />
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
