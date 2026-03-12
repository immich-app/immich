<script lang="ts">
  import { thumbhash } from '$lib/actions/thumbhash';
  import AlphaBackground from '$lib/components/AlphaBackground.svelte';
  import BrokenAsset from '$lib/components/assets/broken-asset.svelte';
  import DelayedLoadingSpinner from '$lib/components/DelayedLoadingSpinner.svelte';
  import ImageLayer from '$lib/components/ImageLayer.svelte';
  import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';
  import { getAssetUrls } from '$lib/utils';
  import { AdaptiveImageLoader, type QualityList } from '$lib/utils/adaptive-image-loader.svelte';
  import { scaleToCover, scaleToFit } from '$lib/utils/container-utils';
  import { getAltText } from '$lib/utils/thumbnail-util';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
  import type { AssetResponseDto, SharedLinkResponseDto } from '@immich/sdk';
  import { untrack, type Snippet } from 'svelte';

  type Props = {
    asset: AssetResponseDto;
    sharedLink?: SharedLinkResponseDto;
    objectFit?: 'contain' | 'cover';
    container: {
      width: number;
      height: number;
    };
    onUrlChange?: (url: string) => void;
    onImageReady?: () => void;
    onError?: () => void;
    ref?: HTMLDivElement;
    imgRef?: HTMLImageElement;
    backdrop?: Snippet;
    overlays?: Snippet;
  };

  let {
    ref = $bindable(),
    // eslint-disable-next-line no-useless-assignment
    imgRef = $bindable(),
    asset,
    sharedLink,
    objectFit = 'contain',
    container,
    onUrlChange,
    onImageReady,
    onError,
    backdrop,
    overlays,
  }: Props = $props();

  const afterThumbnail = (loader: AdaptiveImageLoader) => {
    if (assetViewerManager.zoom > 1) {
      loader.trigger('original');
    } else {
      loader.trigger('preview');
    }
  };

  const buildQualityList = () => {
    const assetUrls = getAssetUrls(asset, sharedLink);
    const qualityList: QualityList = [
      {
        quality: 'thumbnail',
        url: assetUrls.thumbnail,
        onAfterLoad: afterThumbnail,
        onAfterError: afterThumbnail,
      },
      {
        quality: 'preview',
        url: assetUrls.preview,
        onAfterError: (loader) => loader.trigger('original'),
      },
      { quality: 'original', url: assetUrls.original },
    ];
    return qualityList;
  };

  const loaderKey = $derived(`${asset.id}:${asset.thumbhash}:${sharedLink?.id}`);

  const adaptiveImageLoader = $derived.by(() => {
    void loaderKey;

    return untrack(
      () =>
        new AdaptiveImageLoader(buildQualityList(), {
          onImageReady,
          onError,
          onUrlChange,
        }),
    );
  });

  $effect.pre(() => {
    const loader = adaptiveImageLoader;
    untrack(() => assetViewerManager.resetZoomState());
    return () => loader.destroy();
  });

  const imageDimensions = $derived.by(() => {
    const { width, height } = asset;
    if (width && width > 0 && height && height > 0) {
      return { width, height };
    }
    return { width: 1, height: 1 };
  });

  const { width, height, left, top } = $derived.by(() => {
    const scaleFn = objectFit === 'cover' ? scaleToCover : scaleToFit;
    const { width, height } = scaleFn(imageDimensions, container);
    return {
      width: width + 'px',
      height: height + 'px',
      left: (container.width - width) / 2 + 'px',
      top: (container.height - height) / 2 + 'px',
    };
  });

  const { status } = $derived(adaptiveImageLoader);
  const alt = $derived(status.urls.preview ? $getAltText(toTimelineAsset(asset)) : '');

  const show = $derived.by(() => {
    const { quality, started, hasError, urls } = status;
    return {
      alphaBackground: !hasError && started,
      spinner: !asset.thumbhash && !started,
      brokenAsset: hasError,
      thumbhash: quality.thumbnail !== 'success' && quality.preview !== 'success' && quality.original !== 'success',
      thumbnail: quality.thumbnail !== 'error' && quality.preview !== 'success' && quality.original !== 'success',
      preview: quality.preview !== 'error' && quality.original !== 'success',
      original: quality.original !== 'error' && urls.original !== undefined,
    };
  });

  $effect(() => {
    assetViewerManager.imageLoaderStatus = status;
  });

  $effect(() => {
    if (assetViewerManager.zoom > 1 && status.quality.original !== 'success') {
      untrack(() => void adaptiveImageLoader.trigger('original'));
    }
  });

  let thumbnailElement = $state<HTMLImageElement>();
  let previewElement = $state<HTMLImageElement>();
  let originalElement = $state<HTMLImageElement>();

  $effect(() => {
    const quality = status.quality;
    imgRef =
      (quality.original === 'success' ? originalElement : undefined) ??
      (quality.preview === 'success' ? previewElement : undefined) ??
      (quality.thumbnail === 'success' ? thumbnailElement : undefined);
  });

  const zoomTransform = $derived.by(() => {
    const { currentZoom, currentPositionX, currentPositionY } = assetViewerManager.zoomState;
    if (currentZoom === 1 && currentPositionX === 0 && currentPositionY === 0) {
      return undefined;
    }
    return `translate(${currentPositionX}px, ${currentPositionY}px) scale(${currentZoom})`;
  });
</script>

<div class="relative h-full w-full overflow-hidden will-change-transform" bind:this={ref}>
  {@render backdrop?.()}

  <!-- pointer-events-none so events pass through to the container where zoom-image listens -->
  <div
    class="absolute inset-0 pointer-events-none"
    style:transform={zoomTransform}
    style:transform-origin={zoomTransform ? '0 0' : undefined}
  >
    <div class="absolute" style:left style:top style:width style:height>
      {#if show.alphaBackground}
        <AlphaBackground />
      {/if}

      {#if show.thumbhash}
        {#if asset.thumbhash}
          <!-- Thumbhash / spinner layer  -->
          <canvas use:thumbhash={{ base64ThumbHash: asset.thumbhash }} class="h-full w-full absolute"></canvas>
        {:else if show.spinner}
          <DelayedLoadingSpinner />
        {/if}
      {/if}

      {#if show.thumbnail}
        <ImageLayer
          {adaptiveImageLoader}
          {width}
          {height}
          quality="thumbnail"
          src={status.urls.thumbnail}
          alt=""
          role="presentation"
          bind:ref={thumbnailElement}
        />
      {/if}

      {#if show.brokenAsset}
        <BrokenAsset class="text-xl h-full w-full absolute" />
      {/if}

      {#if show.preview}
        <ImageLayer
          {adaptiveImageLoader}
          {alt}
          {width}
          {height}
          {overlays}
          quality="preview"
          src={status.urls.preview}
          bind:ref={previewElement}
        />
      {/if}

      {#if show.original}
        <ImageLayer
          {adaptiveImageLoader}
          {alt}
          {width}
          {height}
          {overlays}
          quality="original"
          src={status.urls.original}
          bind:ref={originalElement}
        />
      {/if}
    </div>
  </div>
</div>
