<script lang="ts">
  import { thumbhash } from '$lib/actions/thumbhash';
  import AlphaBackground from '$lib/components/AlphaBackground.svelte';
  import BrokenAsset from '$lib/components/assets/broken-asset.svelte';
  import Image from '$lib/components/Image.svelte';
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
    imageClass?: string;
    container: {
      width: number;
      height: number;
    };
    slideshowState: SlideshowState;
    slideshowLook: SlideshowLook;
    onUrlChange?: (url: string) => void;
    onImageReady?: () => void;
    onError?: () => void;
    ref?: HTMLDivElement;
    imgRef?: HTMLImageElement;
    overlays?: Snippet;
  }

  let {
    ref = $bindable(),
    imgRef = $bindable(),
    asset,
    sharedLink,
    imageClass = '',
    container,
    slideshowState,
    slideshowLook,
    onUrlChange,
    onImageReady,
    onError,
    overlays,
  }: Props = $props();

  let adaptiveImageLoader = $state<AdaptiveImageLoader>();
  let previousLoader: AdaptiveImageLoader | undefined;

  const reuseLoader = (loader: AdaptiveImageLoader | undefined) =>
    loader?.asset.id === asset.id &&
    loader?.asset.thumbhash === asset.thumbhash &&
    loader?.sharedLink?.id === sharedLink?.id;

  $effect.pre(() => {
    if (reuseLoader(adaptiveImageLoader)) {
      previousLoader?.destroy();
      previousLoader = undefined;
      return;
    }
    previousLoader?.destroy();
    previousLoader = adaptiveImageLoader;
    return untrack(() => {
      assetViewerManager.resetZoomState();
      const loader = new AdaptiveImageLoader(asset, sharedLink, {
        currentZoomFn: () => assetViewerManager.zoom,
        onImageReady,
        onError,
        onUrlChange,
      });
      adaptiveImageLoader = loader;
    });
  });

  onDestroy(() => {
    previousLoader?.destroy();
    adaptiveImageLoader?.destroy();
  });

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

  const loaderState = $derived(adaptiveImageLoader!.state);
  // $inspect(adaptiveImageLoader).with(console.log);
  const imageAltText = $derived(loaderState.previewUrl ? $getAltText(toTimelineAsset(asset)) : '');

  const showAlphaBackground = $derived(
    !loaderState.hasError &&
      ['thumbnail', 'loading-thumbnail', 'loading-preview', 'loading-original', 'preview', 'original'].includes(
        loaderState.quality,
      ),
  );
  const showSpinner = $derived(!asset.thumbhash && loaderState.quality === 'basic');
  const showBrokenAsset = $derived(loaderState.hasError);
  const showThumbhash = $derived(['basic', 'loading-thumbnail'].includes(loaderState.quality));
  const showThumbnail = true;
  const showPreview = true;
  const showOriginal = true;

  // Effect: Upgrade to original when user zooms in
  $effect(() => {
    if (assetViewerManager.zoom > 1 && loaderState.quality === 'preview') {
      untrack(() => {
        void adaptiveImageLoader!.triggerOriginal();
      });
    }
  });
  let thumbnailElement = $state<HTMLImageElement>();
  let previewElement = $state<HTMLImageElement>();
  let originalElement = $state<HTMLImageElement>();
  let mainImageBox = $state<HTMLElement>();

  // Effect: Synchronize highest quality element as main imgElement
  $effect(() => {
    imgRef = originalElement ?? previewElement ?? thumbnailElement;
  });
</script>

<div class="relative h-full w-full" bind:this={ref}>
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
    {#if showAlphaBackground}
      <AlphaBackground class="-z-3" />
    {/if}

    {#if showThumbhash}
      {#if asset.thumbhash}
        <!-- Thumbhash / spinner layer  -->
        <canvas use:thumbhash={{ base64ThumbHash: asset.thumbhash }} class="h-full w-full absolute -z-2"></canvas>
      {:else if showSpinner}
        <div id="spinner" class="absolute flex h-full items-center justify-center">
          <LoadingSpinner />
        </div>
      {/if}
    {/if}

    {#if showThumbnail}
      {#key adaptiveImageLoader}
        {@const loader = adaptiveImageLoader!}
        <div class="absolute top-0 z-1" style:width={renderDimensions.width} style:height={renderDimensions.height}>
          <Image
            src={loaderState.thumbnailUrl}
            onStart={() => loader.onThumbnailStart()}
            onLoad={() => loader.onThumbnailLoad()}
            onError={() => loader.onThumbnailError()}
            bind:ref={thumbnailElement}
            class={['absolute h-full', 'w-full']}
            alt=""
            role="presentation"
            data-testid="thumbnail"
          />
        </div>
      {/key}
    {/if}

    {#if showBrokenAsset}
      <BrokenAsset class="text-xl h-full w-full absolute" />
    {/if}

    {#if showPreview}
      {#key adaptiveImageLoader}
        {@const loader = adaptiveImageLoader!}
        <div class="absolute top-0 z-2" style:width={renderDimensions.width} style:height={renderDimensions.height}>
          <Image
            src={loaderState.previewUrl}
            onStart={() => loader.onPreviewStart()}
            onLoad={() => loader.onPreviewLoad()}
            onError={() => loader.onPreviewError()}
            bind:ref={previewElement}
            class={['h-full', 'w-full', imageClass]}
            alt={imageAltText}
            draggable={false}
            data-testid="preview"
          />
          {@render overlays?.()}
        </div>
      {/key}
    {/if}

    {#if showOriginal}
      {#key adaptiveImageLoader}
        {@const loader = adaptiveImageLoader!}
        <div class="absolute top-0 z-3" style:width={renderDimensions.width} style:height={renderDimensions.height}>
          <Image
            src={loaderState.originalUrl}
            onStart={() => loader.onOriginalStart()}
            onLoad={() => loader.onOriginalLoad()}
            onError={() => loader.onOriginalError()}
            bind:ref={originalElement}
            class={['h-full', 'w-full', imageClass]}
            alt={imageAltText}
            draggable={false}
            data-testid="original"
          />
          {@render overlays?.()}
        </div>
      {/key}
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
