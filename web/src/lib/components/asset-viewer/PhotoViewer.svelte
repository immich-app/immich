<script lang="ts">
  import { shortcuts } from '$lib/actions/shortcut';
  import { zoomImageAction } from '$lib/actions/zoom-image';
  import AdaptiveImage from '$lib/components/AdaptiveImage.svelte';
  import FaceEditor from '$lib/components/asset-viewer/face-editor/FaceEditor.svelte';
  import Thumbhash from '$lib/components/Thumbhash.svelte';
  import OcrBoundingBox from '$lib/components/asset-viewer/OcrBoundingBox.svelte';
  import AssetViewerEvents from '$lib/components/AssetViewerEvents.svelte';
  import { assetViewerManager, type Faces } from '$lib/managers/asset-viewer-manager.svelte';
  import { castManager } from '$lib/managers/cast-manager.svelte';
  import { ocrManager } from '$lib/stores/ocr.svelte';
  import { SlideshowLook, SlideshowState, slideshowStore } from '$lib/stores/slideshow.store';
  import { handlePromiseError } from '$lib/utils';
  import { canCopyImageToClipboard, copyImageToClipboard } from '$lib/utils/asset-utils';
  import { getNaturalSize, scaleToFit, type Size } from '$lib/utils/container-utils';
  import { handleError } from '$lib/utils/handle-error';
  import { getOcrBoundingBoxes } from '$lib/utils/ocr-utils';
  import { getBoundingBox, type BoundingBox } from '$lib/utils/people-utils';
  import { type SharedLinkResponseDto } from '@immich/sdk';
  import { toastManager } from '@immich/ui';
  import { onDestroy, untrack } from 'svelte';
  import { useSwipe, type SwipeCustomEvent } from 'svelte-gestures';
  import { t } from 'svelte-i18n';
  import type { AssetCursor } from './AssetViewer.svelte';

  type Props = {
    cursor: AssetCursor;
    element?: HTMLDivElement;
    sharedLink?: SharedLinkResponseDto;
    onReady?: () => void;
    onError?: () => void;
    onSwipe?: (event: SwipeCustomEvent) => void;
  };

  let { cursor, element = $bindable(), sharedLink, onReady, onError, onSwipe }: Props = $props();

  const { slideshowState, slideshowLook } = slideshowStore;
  const asset = $derived(cursor.current);

  let visibleImageReady: boolean = $state(false);

  let previousAssetId: string | undefined;
  $effect.pre(() => {
    const id = asset.id;
    if (id === previousAssetId) {
      return;
    }
    previousAssetId = id;
    untrack(() => {
      assetViewerManager.resetZoomState();
      visibleImageReady = false;
      assetViewerManager.clearHighlightedFaces();
    });
  });

  onDestroy(() => {
    assetViewerManager.clearHighlightedFaces();
    assetViewerManager.hideHiddenPeople();
  });

  let containerWidth = $state(0);
  let containerHeight = $state(0);

  const container = $derived({
    width: containerWidth,
    height: containerHeight,
  });

  const overlaySize = $derived.by((): Size => {
    if (!assetViewerManager.imgRef || !visibleImageReady) {
      return { width: 0, height: 0 };
    }

    return scaleToFit(getNaturalSize(assetViewerManager.imgRef), { width: containerWidth, height: containerHeight });
  });

  const highlightedBoxes = $derived(getBoundingBox(assetViewerManager.highlightedFaces, overlaySize));
  const isHighlighting = $derived(highlightedBoxes.length > 0);

  let visibleBoxes = $state<BoundingBox[]>([]);
  $effect(() => {
    if (isHighlighting) {
      visibleBoxes = highlightedBoxes;
    }
  });

  const ocrBoxes = $derived(ocrManager.showOverlay ? getOcrBoundingBoxes(ocrManager.data, overlaySize) : []);

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
    const targetZoom = assetViewerManager.zoom > 1 ? 1 : 2;
    assetViewerManager.animatedZoom(targetZoom);
  };

  const onFaceEditModeChange = (isFaceEditMode: boolean) => {
    if (isFaceEditMode && assetViewerManager.zoom > 1) {
      onZoom();
    }
  };

  const onPlaySlideshow = () => ($slideshowState = SlideshowState.PlaySlideshow);

  // TODO move to action + command palette
  const onCopyShortcut = (event: KeyboardEvent) => {
    if (globalThis.getSelection()?.type === 'Range') {
      return;
    }
    event.preventDefault();

    handlePromiseError(onCopy());
  };

  let currentPreviewUrl = $state<string>();

  const onUrlChange = (url: string) => {
    currentPreviewUrl = url;
  };

  $effect(() => {
    if (currentPreviewUrl) {
      void cast(currentPreviewUrl);
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

  const blurredSlideshow = $derived(
    $slideshowState !== SlideshowState.None && $slideshowLook === SlideshowLook.BlurredBackground && !!asset.thumbhash,
  );

  let adaptiveImage = $state<HTMLDivElement | undefined>();

  const faceToNameMap = $derived.by(() => {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const map = new Map<Faces, string>();
    for (const person of asset.people ?? []) {
      if (person.isHidden && !assetViewerManager.isShowingHiddenPeople) {
        continue;
      }
      for (const face of person.faces ?? []) {
        map.set(face, person.name);
      }
    }
    return map;
  });

  const faces = $derived(Array.from(faceToNameMap.keys()));

  const boundingBoxes = $derived.by(() => {
    if (assetViewerManager.isFaceEditMode || ocrManager.showOverlay) {
      return [];
    }

    const knownBoxes = getBoundingBox(faces, overlaySize);
    const result = knownBoxes.map((box, index) => ({
      ...box,
      face: faces[index],
      name: faceToNameMap.get(faces[index]),
    }));

    if (assetViewerManager.highlightedFaces.length === 0) {
      return result;
    }

    const knownIds = new Set(faces.map((f) => f.id));
    const unassignedFaces = assetViewerManager.highlightedFaces.filter((f) => !knownIds.has(f.id));
    const unassignedBoxes = getBoundingBox(unassignedFaces, overlaySize);
    for (let i = 0; i < unassignedBoxes.length; i++) {
      result.push({ ...unassignedBoxes[i], face: unassignedFaces[i], name: undefined });
    }

    return result;
  });
</script>

<AssetViewerEvents {onCopy} {onZoom} {onFaceEditModeChange} />

<svelte:document
  use:shortcuts={[
    { shortcut: { key: 'z' }, onShortcut: onZoom, preventDefault: true },
    { shortcut: { key: 's' }, onShortcut: onPlaySlideshow, preventDefault: true },
    { shortcut: { key: 'c', ctrl: true }, onShortcut: onCopyShortcut, preventDefault: false },
    { shortcut: { key: 'c', meta: true }, onShortcut: onCopyShortcut, preventDefault: false },
  ]}
/>

<div
  bind:this={element}
  class="relative size-full select-none"
  bind:clientWidth={containerWidth}
  bind:clientHeight={containerHeight}
  role="presentation"
  ondblclick={onZoom}
  use:zoomImageAction={{ zoomTarget: adaptiveImage }}
  {...useSwipe((event) => onSwipe?.(event))}
>
  <AdaptiveImage
    {asset}
    {sharedLink}
    {container}
    objectFit={$slideshowState !== SlideshowState.None && $slideshowLook === SlideshowLook.Cover ? 'cover' : 'contain'}
    {onUrlChange}
    onImageReady={() => {
      visibleImageReady = true;
      onReady?.();
    }}
    onError={() => {
      onError?.();
      onReady?.();
    }}
    bind:imgRef={assetViewerManager.imgRef}
    bind:ref={adaptiveImage}
  >
    {#snippet backdrop()}
      {#if blurredSlideshow}
        <Thumbhash base64ThumbHash={asset.thumbhash!} class="absolute inset-s-0 top-0 left-0 h-dvh w-dvw" />
      {/if}
    {/snippet}
    {#snippet overlays()}
      <div
        class="pointer-events-none absolute inset-0 transition-opacity duration-150"
        style:opacity={isHighlighting ? 1 : 0}
      >
        <svg class="absolute inset-0 size-full">
          <defs>
            <mask id="face-dim-mask">
              <rect width="100%" height="100%" fill="white" />
              {#each visibleBoxes as box (box.id)}
                <rect x={box.left} y={box.top} width={box.width} height={box.height} fill="black" rx="8" />
              {/each}
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(0,0,0,0.4)" mask="url(#face-dim-mask)" />
        </svg>
      </div>
      {#each boundingBoxes as boundingbox (boundingbox.id)}
        {@const isActive = assetViewerManager.highlightedFaces.some((f) => f.id === boundingbox.id)}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="pointer-events-auto absolute rounded-lg {isActive && 'border-3 border-solid border-white'}"
          style="top: {boundingbox.top}px; left: {boundingbox.left}px; height: {boundingbox.height}px; width: {boundingbox.width}px;"
          onpointerenter={() => assetViewerManager.setHighlightedFaces([boundingbox.face])}
          onpointerleave={() => assetViewerManager.clearHighlightedFaces()}
        >
          {#if isActive && boundingbox.name}
            <div
              aria-hidden="true"
              class="absolute rounded-sm bg-white/90 px-2 py-1 text-sm font-medium whitespace-nowrap text-black shadow-lg"
              style="top: {boundingbox.height + 4}px; right: 0;"
            >
              {boundingbox.name}
            </div>
          {/if}
        </div>
      {/each}

      {#each ocrBoxes as ocrBox (ocrBox.id)}
        <OcrBoundingBox {ocrBox} />
      {/each}
    {/snippet}
  </AdaptiveImage>

  {#if assetViewerManager.isFaceEditMode && assetViewerManager.imgRef}
    <FaceEditor htmlElement={assetViewerManager.imgRef} {containerWidth} {containerHeight} assetId={asset.id} />
  {/if}
</div>
