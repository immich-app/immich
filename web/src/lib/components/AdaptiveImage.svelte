<script lang="ts">
  import AlphaBackground from '#lib/components/AlphaBackground.svelte';
  import DelayedLoadingSpinner from '#lib/components/DelayedLoadingSpinner.svelte';
  import ImageLayer from '#lib/components/ImageLayer.svelte';
  import Thumbhash from '#lib/components/Thumbhash.svelte';
  import BrokenAsset from '#lib/components/assets/BrokenAsset.svelte';
  import { assetViewerManager } from '#lib/managers/asset-viewer-manager.svelte.ts';
  import { getAssetUrls } from '#lib/utils.ts';
  import { AdaptiveImageLoader, type QualityList } from '#lib/utils/adaptive-image-loader.svelte.ts';
  import { scaleToCover, scaleToFit, type Size } from '#lib/utils/container-utils.ts';
  import { getAltText } from '#lib/utils/thumbnail-util.ts';
  import { toTimelineAsset } from '#lib/utils/timeline-util.ts';
  import type { AssetResponseDto, SharedLinkResponseDto } from '@immich/sdk';
  import { untrack, type Snippet } from 'svelte';

  type Props = {
    asset: AssetResponseDto;
    sharedLink?: SharedLinkResponseDto;
    objectFit?: 'contain' | 'cover';
    container: Size;
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

  const { insetInlineStart, top, width, height } = $derived.by(() => {
    const scaleFn = objectFit === 'cover' ? scaleToCover : scaleToFit;
    const { width, height } = scaleFn(imageDimensions, container);
    return {
      insetInlineStart: (container.width - width) / 2 + 'px',
      top: (container.height - height) / 2 + 'px',
      width: width + 'px',
      height: height + 'px',
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
</script>

<div class="relative size-full overflow-hidden" bind:this={ref}>
  {@render backdrop?.()}

  <div
    class="pointer-events-none absolute overflow-hidden"
    style:inset-inline-start={insetInlineStart}
    style:top
    style:width
    style:height
  >
    {#if show.alphaBackground}
      <AlphaBackground />
    {/if}

    {#if show.thumbhash}
      {#if asset.thumbhash}
        <!-- Thumbhash / spinner layer  -->
        <Thumbhash base64ThumbHash={asset.thumbhash} class="absolute size-full" />
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

    {#if show.preview}
      <ImageLayer
        {adaptiveImageLoader}
        {alt}
        {width}
        {height}
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
        quality="original"
        src={status.urls.original}
        bind:ref={originalElement}
      />
    {/if}

    {#if show.brokenAsset}
      <BrokenAsset class="absolute inset-0 z-10 size-full text-xl" />
    {/if}

    {#if overlays}
      <div class="pointer-events-none absolute inset-0">
        {@render overlays()}
      </div>
    {/if}
  </div>
</div>
