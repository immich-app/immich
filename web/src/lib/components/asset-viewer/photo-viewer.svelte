<script lang="ts">
  import { shortcuts } from '$lib/actions/shortcut';
  import AdaptiveImage from '$lib/components/asset-viewer/adaptive-image.svelte';
  import FaceEditor from '$lib/components/asset-viewer/face-editor/face-editor.svelte';
  import OcrBoundingBox from '$lib/components/asset-viewer/ocr-bounding-box.svelte';
  import AssetViewerEvents from '$lib/components/AssetViewerEvents.svelte';
  import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';
  import { castManager } from '$lib/managers/cast-manager.svelte';
  import { isFaceEditMode } from '$lib/stores/face-edit.svelte';
  import { ocrManager } from '$lib/stores/ocr.svelte';
  import { boundingBoxesArray } from '$lib/stores/people.store';
  import { SlideshowState, slideshowLookCssMapping, slideshowStore } from '$lib/stores/slideshow.store';
  import { handlePromiseError } from '$lib/utils';
  import { canCopyImageToClipboard, copyImageToClipboard } from '$lib/utils/asset-utils';
  import { handleError } from '$lib/utils/handle-error';
  import { getOcrBoundingBoxes } from '$lib/utils/ocr-utils';
  import { getBoundingBox } from '$lib/utils/people-utils';
  import { type SharedLinkResponseDto } from '@immich/sdk';
  import { toastManager } from '@immich/ui';
  import { onDestroy } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { AssetCursor } from './asset-viewer.svelte';

  interface Props {
    cursor: AssetCursor;
    element?: HTMLDivElement;
    sharedLink?: SharedLinkResponseDto;
    onReady?: () => void;
    onError?: () => void;
  }

  let { cursor, element = $bindable(), sharedLink, onReady, onError }: Props = $props();

  const { slideshowState, slideshowLook } = slideshowStore;
  const asset = $derived(cursor.current);

  onDestroy(() => {
    $boundingBoxesArray = [];
  });

  let ocrBoxes = $derived(
    ocrManager.showOverlay && assetViewerManager.imgRef
      ? getOcrBoundingBoxes(ocrManager.data, assetViewerManager.zoomState, assetViewerManager.imgRef)
      : [],
  );

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

  let currentPreviewUrl = $state<string>();

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

  let containerWidth = $state(0);
  let containerHeight = $state(0);
  const container = $derived({
    width: containerWidth,
    height: containerHeight,
  });
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

<div
  bind:this={element}
  class="relative h-full w-full select-none"
  bind:clientWidth={containerWidth}
  bind:clientHeight={containerHeight}
>
  <AdaptiveImage
    {asset}
    {sharedLink}
    {container}
    zoomDisabled={isOcrActive}
    imageClass={$slideshowState === SlideshowState.None ? 'object-contain' : slideshowLookCssMapping[$slideshowLook]}
    slideshowState={$slideshowState}
    slideshowLook={$slideshowLook}
    onImageReady={() => onReady?.()}
    onError={() => {
      onError?.();
      onReady?.();
    }}
    bind:imgElement={assetViewerManager.imgRef}
  >
    {#snippet overlays()}
      <!-- eslint-disable-next-line svelte/require-each-key -->
      {#each getBoundingBox($boundingBoxesArray, assetViewerManager.zoomState, assetViewerManager.imgRef) as boundingbox}
        <div
          class="absolute border-solid border-white border-3 rounded-lg"
          style="top: {boundingbox.top}px; left: {boundingbox.left}px; height: {boundingbox.height}px; width: {boundingbox.width}px;"
        ></div>
      {/each}

      {#each ocrBoxes as ocrBox (ocrBox.id)}
        <OcrBoundingBox {ocrBox} />
      {/each}
    {/snippet}
  </AdaptiveImage>

  {#if isFaceEditMode.value && assetViewerManager.imgRef}
    <FaceEditor htmlElement={assetViewerManager.imgRef} {containerWidth} {containerHeight} assetId={asset.id} />
  {/if}
</div>
