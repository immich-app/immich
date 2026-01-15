<script lang="ts">
  import { imageLoader } from '$lib/actions/image-loader.svelte';
  import { thumbhash } from '$lib/actions/thumbhash';
  import { zoomImageAction } from '$lib/actions/zoom-image';
  import BrokenAsset from '$lib/components/assets/broken-asset.svelte';
  import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';
  import { SlideshowLook, SlideshowState } from '$lib/stores/slideshow.store';
  import { AdaptiveImageLoader } from '$lib/utils/adaptive-image-loader.svelte';
  import { getDimensions } from '$lib/utils/asset-utils';
  import { scaleToFit } from '$lib/utils/layout-utils';
  import { getAltText } from '$lib/utils/thumbnail-util';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
  import type { AssetResponseDto, SharedLinkResponseDto } from '@immich/sdk';
  import { LoadingSpinner } from '@immich/ui';
  import { onDestroy, untrack, type Snippet } from 'svelte';

  interface Props {
    asset: AssetResponseDto;
    sharedLink?: SharedLinkResponseDto;
    zoomDisabled?: boolean;
    imageClass?: string;
    container: {
      width: number;
      height: number;
    };
    slideshowState: SlideshowState;
    slideshowLook: SlideshowLook;
    onImageReady?: () => void;
    onError?: () => void;
    imgElement?: HTMLImageElement;
    overlays?: Snippet;
  }

  let {
    imgElement = $bindable<HTMLImageElement | undefined>(),
    asset,
    sharedLink,
    zoomDisabled = false,
    imageClass = '',
    container,
    slideshowState,
    slideshowLook,
    onImageReady,
    onError,
    overlays,
  }: Props = $props();

  let previousLoader = $state<AdaptiveImageLoader>();
  let previousAssetId: string | undefined;
  let previousSharedLinkId: string | undefined;

  const adaptiveImageLoader = $derived.by(() => {
    if (previousAssetId === asset.id && previousSharedLinkId === sharedLink?.id) {
      return previousLoader!;
    }

    return untrack(() => {
      previousAssetId = asset.id;
      previousSharedLinkId = sharedLink?.id;

      previousLoader?.destroy();
      assetViewerManager.resetZoomState();
      const loader = new AdaptiveImageLoader(asset, sharedLink, {
        currentZoomFn: () => assetViewerManager.zoom,
        onImageReady,
        onError,
      });
      previousLoader = loader;
      return loader;
    });
  });
  onDestroy(() => adaptiveImageLoader.destroy());

  const imageDimensions = $derived.by(() => {
    if ((asset.width ?? 0) > 0 && (asset.height ?? 0) > 0) {
      return { width: asset.width!, height: asset.height! };
    }

    if (asset.exifInfo?.exifImageHeight && asset.exifInfo.exifImageWidth) {
      return getDimensions(asset.exifInfo) as { width: number; height: number };
    }

    return { width: 1, height: 1 };
  });

  const scaledDimensions = $derived(scaleToFit(imageDimensions, container));

  const renderDimensions = $derived.by(() => {
    const { width, height } = scaledDimensions;
    return {
      width: width + 'px',
      height: height + 'px',
      left: (container.width - width) / 2 + 'px',
      top: (container.height - height) / 2 + 'px',
    };
  });

  const blurredSlideshow = $derived(
    slideshowState !== SlideshowState.None && slideshowLook === SlideshowLook.BlurredBackground && !!asset.thumbhash,
  );

  const loadState = $derived(adaptiveImageLoader.adaptiveLoaderState);
  const imageAltText = $derived(loadState.previewUrl ? $getAltText(toTimelineAsset(asset)) : '');
  const thumbnailUrl = $derived(loadState.thumbnailUrl);
  const previewUrl = $derived(loadState.previewUrl);
  const originalUrl = $derived(loadState.originalUrl);
  const showSpinner = $derived(!asset.thumbhash && loadState.quality === 'basic');
  const showBrokenAsset = $derived(loadState.hasError);

  // Effect: Upgrade to original when user zooms in
  $effect(() => {
    if (assetViewerManager.zoom > 1 && loadState.quality === 'preview') {
      void adaptiveImageLoader.triggerOriginal();
    }
  });
  let thumbnailElement = $state<HTMLImageElement>();
  let previewElement = $state<HTMLImageElement>();
  let originalElement = $state<HTMLImageElement>();
  let mainImageBox = $state<HTMLElement>();

  // Effect: Synchronize highest quality element as main imgElement
  $effect(() => {
    imgElement = originalElement ?? previewElement ?? thumbnailElement;
  });
</script>

<div class="relative h-full w-full" use:zoomImageAction={{ disabled: zoomDisabled, zoomTarget: mainImageBox }}>
  <!-- Blurred slideshow background (full viewport) -->
  {#if blurredSlideshow}
    <canvas use:thumbhash={{ base64ThumbHash: asset.thumbhash! }} class="-z-1 absolute top-0 left-0 start-0 h-dvh w-dvw"
    ></canvas>
  {/if}

  <!-- Main image box with transition -->
  <div
    bind:this={mainImageBox}
    class="absolute"
    style:left={renderDimensions.left}
    style:top={renderDimensions.top}
    style:width={renderDimensions.width}
    style:height={renderDimensions.height}
  >
    {#if asset.thumbhash}
      <!-- Thumbhash / spinner layer  -->
      <canvas use:thumbhash={{ base64ThumbHash: asset.thumbhash }} class="h-full w-full absolute -z-2"></canvas>
    {:else if showSpinner}
      <div id="spinner" class="absolute flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    {/if}

    <div
      class="absolute top-0"
      style:width={renderDimensions.width}
      style:height={renderDimensions.height}
      use:imageLoader={{
        src: thumbnailUrl,
        onStart: () => adaptiveImageLoader.onThumbnailStart(),
        onLoad: () => adaptiveImageLoader.onThumbnailLoad(),
        onError: () => adaptiveImageLoader.onThumbnailError(),
        onElementCreated: (element) => (thumbnailElement = element),
        imgClass: ['absolute h-full', 'w-full'],
        alt: '',
        role: 'presentation',
        dataAttributes: {
          'data-testid': 'thumbnail',
        },
      }}
    ></div>

    {#if showBrokenAsset}
      <BrokenAsset class="text-xl h-full w-full absolute" />
    {:else}
      <div
        class="absolute top-0"
        style:width={renderDimensions.width}
        style:height={renderDimensions.height}
        use:imageLoader={{
          src: previewUrl,
          onStart: () => adaptiveImageLoader.onPreviewStart(),
          onLoad: () => adaptiveImageLoader.onPreviewLoad(),
          onError: () => adaptiveImageLoader.onPreviewError(),
          onElementCreated: (element) => (previewElement = element),
          imgClass: ['h-full', 'w-full', imageClass],
          alt: imageAltText,
          draggable: false,
          dataAttributes: {
            'data-testid': 'preview',
          },
        }}
      >
        {@render overlays?.()}
      </div>

      <div
        class="absolute top-0"
        style:width={renderDimensions.width}
        style:height={renderDimensions.height}
        use:imageLoader={{
          src: originalUrl,
          onStart: () => adaptiveImageLoader.onOriginalStart(),
          onLoad: () => adaptiveImageLoader.onOriginalLoad(),
          onError: () => adaptiveImageLoader.onOriginalError(),
          onElementCreated: (element) => (originalElement = element),
          imgClass: ['h-full', 'w-full', imageClass],
          alt: imageAltText,
          draggable: false,
          dataAttributes: {
            'data-testid': 'original',
          },
        }}
      >
        {@render overlays?.()}
      </div>
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
</style>
