<script module lang="ts">
  import { TUNABLES } from '$lib/utils/tunables';

  // Chrome renders HDR images with normally invisible seam lines in a regular
  // grid pattern. When the user pinch/scroll zooms, these seams become visible
  // and grow more prominent at higher zoom levels.
  //
  // Adding `will-change: transform` prevents the seams by converting the
  // element into a GPU texture that Chrome rasterizes once and reuses. But
  // this texture is frozen at a fixed resolution and never re-renders from
  // the source image, so zooming in magnifies the frozen texture rather than
  // the source, which can appear blurry.
  //
  // To keep the texture sharp, we size this div closer to the image's native
  // dimensions and apply a CSS counter-scale. Chrome renders these textures
  // as a grid of small tiles backed by a shared GPU memory budget — if the
  // texture is too large, tiles go missing and show up as transparent gaps.
  // We cap the texture size based on the device's GPU capability.
  //
  // This workaround is only needed in Chromium-based browsers. Firefox and
  // Safari use different rasterization pipelines and don't exhibit this bug.
  // See https://issues.chromium.org/issues/40084005
  const isChromium = 'chrome' in globalThis;

  function getMaxRasterPixels() {
    const override = TUNABLES.IMAGE_RASTER.MAX_PIXELS;
    if (override > 0) {
      return override;
    }
    if (override < 0 || !isChromium) {
      return 0;
    }
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl');
      const maxTextureSize = gl?.getParameter(gl.MAX_TEXTURE_SIZE) ?? 0;
      if (maxTextureSize >= 16_384) {
        return 16_000_000;
      }
      if (maxTextureSize >= 8192) {
        return 10_000_000;
      }
      return 4_000_000;
    } catch {
      return 4_000_000;
    }
  }

  const maxRasterPixels = getMaxRasterPixels();
</script>

<script lang="ts">
  import AlphaBackground from '$lib/components/AlphaBackground.svelte';
  import BrokenAsset from '$lib/components/assets/BrokenAsset.svelte';
  import DelayedLoadingSpinner from '$lib/components/DelayedLoadingSpinner.svelte';
  import ImageLayer from '$lib/components/ImageLayer.svelte';
  import Thumbhash from '$lib/components/Thumbhash.svelte';
  import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';
  import { getAssetUrls } from '$lib/utils';
  import { AdaptiveImageLoader, type QualityList } from '$lib/utils/adaptive-image-loader.svelte';
  import { scaleToCover, scaleToFit, type Size } from '$lib/utils/container-utils';
  import { getAltText } from '$lib/utils/thumbnail-util';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
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

  const { insetInlineStart, top, displayWidth, displayHeight, rasterWidth, rasterHeight, rasterScale } = $derived.by(
    () => {
      const scaleFn = objectFit === 'cover' ? scaleToCover : scaleToFit;
      const { width, height } = scaleFn(imageDimensions, container);
      if (maxRasterPixels === 0) {
        return {
          insetInlineStart: (container.width - width) / 2 + 'px',
          top: (container.height - height) / 2 + 'px',
          displayWidth: width + 'px',
          displayHeight: height + 'px',
          rasterWidth: width + 'px',
          rasterHeight: height + 'px',
          rasterScale: 1,
        };
      }
      const nativeRatio = imageDimensions.width / width;
      const budgetRatio = Math.sqrt(maxRasterPixels / Math.max(width * height, 1));
      const rasterRatio = Math.max(1, Math.min(nativeRatio, budgetRatio));
      return {
        insetInlineStart: (container.width - width) / 2 + 'px',
        top: (container.height - height) / 2 + 'px',
        displayWidth: width + 'px',
        displayHeight: height + 'px',
        rasterWidth: width * rasterRatio + 'px',
        rasterHeight: height * rasterRatio + 'px',
        rasterScale: 1 / rasterRatio,
      };
    },
  );

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
    style:width={displayWidth}
    style:height={displayHeight}
  >
    <div
      style:width={rasterWidth}
      style:height={rasterHeight}
      style:transform="scale({rasterScale})"
      style:transform-origin="0 0"
      style:will-change={maxRasterPixels > 0 ? 'transform' : undefined}
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
          width={rasterWidth}
          height={rasterHeight}
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
          width={rasterWidth}
          height={rasterHeight}
          quality="preview"
          src={status.urls.preview}
          bind:ref={previewElement}
        />
      {/if}

      {#if show.original}
        <ImageLayer
          {adaptiveImageLoader}
          {alt}
          width={rasterWidth}
          height={rasterHeight}
          quality="original"
          src={status.urls.original}
          bind:ref={originalElement}
        />
      {/if}
    </div>

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
