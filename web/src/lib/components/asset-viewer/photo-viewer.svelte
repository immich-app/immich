<script lang="ts">
  import { shortcuts } from '$lib/actions/shortcut';
  import { zoomImageAction } from '$lib/actions/zoom-image';
  import FaceEditor from '$lib/components/asset-viewer/face-editor/face-editor.svelte';
  import BrokenAsset from '$lib/components/assets/broken-asset.svelte';
  import { assetViewerFadeDuration } from '$lib/constants';
  import { castManager } from '$lib/managers/cast-manager.svelte';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import { photoViewerImgElement } from '$lib/stores/assets-store.svelte';
  import { isFaceEditMode } from '$lib/stores/face-edit.svelte';
  import { boundingBoxesArray } from '$lib/stores/people.store';
  import { alwaysLoadOriginalFile } from '$lib/stores/preferences.store';
  import { SlideshowLook, SlideshowState, slideshowLookCssMapping, slideshowStore } from '$lib/stores/slideshow.store';
  import { photoZoomState } from '$lib/stores/zoom-image.store';
  import { getAssetOriginalUrl, getAssetThumbnailUrl, handlePromiseError } from '$lib/utils';
  import { canCopyImageToClipboard, copyImageToClipboard, isWebCompatibleImage } from '$lib/utils/asset-utils';
  import { handleError } from '$lib/utils/handle-error';
  import { getBoundingBox } from '$lib/utils/people-utils';
  import { cancelImageUrl } from '$lib/utils/sw-messaging';
  import { getAltText } from '$lib/utils/thumbnail-util';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
  import { AssetMediaSize, type AssetResponseDto, type SharedLinkResponseDto } from '@immich/sdk';
  import { LoadingSpinner } from '@immich/ui';
  import { onDestroy, onMount } from 'svelte';
  import { swipe, type SwipeCustomEvent } from 'svelte-gestures';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';
  import { NotificationType, notificationController } from '../shared-components/notification/notification';

  interface Props {
    asset: AssetResponseDto;
    preloadAssets?: TimelineAsset[] | undefined;
    element?: HTMLDivElement | undefined;
    haveFadeTransition?: boolean;
    sharedLink?: SharedLinkResponseDto | undefined;
    onPreviousAsset?: (() => void) | null;
    onNextAsset?: (() => void) | null;
    copyImage?: () => Promise<void>;
    zoomToggle?: (() => void) | null;
  }

  let {
    asset,
    preloadAssets = undefined,
    element = $bindable(),
    haveFadeTransition = true,
    sharedLink = undefined,
    onPreviousAsset = null,
    onNextAsset = null,
    copyImage = $bindable(),
    zoomToggle = $bindable(),
  }: Props = $props();

  const { slideshowState, slideshowLook } = slideshowStore;

  let assetFileUrl: string = $state('');
  let imageLoaded: boolean = $state(false);
  let originalImageLoaded: boolean = $state(false);
  let imageError: boolean = $state(false);

  let loader = $state<HTMLImageElement>();

  photoZoomState.set({
    currentRotation: 0,
    currentZoom: 1,
    enable: true,
    currentPositionX: 0,
    currentPositionY: 0,
  });

  onDestroy(() => {
    $boundingBoxesArray = [];
  });

  const preload = (targetSize: AssetMediaSize | 'original', preloadAssets?: TimelineAsset[]) => {
    for (const preloadAsset of preloadAssets || []) {
      if (preloadAsset.isImage) {
        let img = new Image();
        img.src = getAssetUrl(preloadAsset.id, targetSize, preloadAsset.thumbhash);
      }
    }
  };

  const getAssetUrl = (id: string, targetSize: AssetMediaSize | 'original', cacheKey: string | null) => {
    if (sharedLink && (!sharedLink.allowDownload || !sharedLink.showMetadata)) {
      return getAssetThumbnailUrl({ id, size: AssetMediaSize.Preview, cacheKey });
    }

    return targetSize === 'original'
      ? getAssetOriginalUrl({ id, cacheKey })
      : getAssetThumbnailUrl({ id, size: targetSize, cacheKey });
  };

  copyImage = async () => {
    if (!canCopyImageToClipboard()) {
      return;
    }

    try {
      await copyImageToClipboard($photoViewerImgElement ?? assetFileUrl);
      notificationController.show({
        type: NotificationType.Info,
        message: $t('copied_image_to_clipboard'),
        timeout: 3000,
      });
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
    if (onNextAsset && event.detail.direction === 'left') {
      onNextAsset();
    }
    if (onPreviousAsset && event.detail.direction === 'right') {
      onPreviousAsset();
    }
  };

  // when true, will force loading of the original image
  let forceUseOriginal: boolean = $derived(asset.originalMimeType === 'image/gif' || $photoZoomState.currentZoom > 1);

  const targetImageSize = $derived.by(() => {
    if ($alwaysLoadOriginalFile || forceUseOriginal || originalImageLoaded) {
      return isWebCompatibleImage(asset) ? 'original' : AssetMediaSize.Fullsize;
    }

    return AssetMediaSize.Preview;
  });

  $effect(() => {
    if (assetFileUrl) {
      // this can't be in an async context with $effect
      void cast(assetFileUrl);
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
    assetFileUrl = imageLoaderUrl;
    originalImageLoaded = targetImageSize === AssetMediaSize.Fullsize || targetImageSize === 'original';
  };

  const onerror = () => {
    imageError = imageLoaded = true;
  };

  $effect(() => {
    preload(targetImageSize, preloadAssets);
  });

  onMount(() => {
    if (loader?.complete) {
      onload();
    }
    loader?.addEventListener('load', onload, { passive: true });
    loader?.addEventListener('error', onerror, { passive: true });
    return () => {
      loader?.removeEventListener('load', onload);
      loader?.removeEventListener('error', onerror);
      cancelImageUrl(imageLoaderUrl);
    };
  });

  let imageLoaderUrl = $derived(getAssetUrl(asset.id, targetImageSize, asset.thumbhash));

  let containerWidth = $state(0);
  let containerHeight = $state(0);
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
<!-- svelte-ignore a11y_missing_attribute -->
<img bind:this={loader} style="display:none" src={imageLoaderUrl} aria-hidden="true" />
<div
  bind:this={element}
  class="relative h-full select-none"
  bind:clientWidth={containerWidth}
  bind:clientHeight={containerHeight}
>
  <img style="display:none" src={imageLoaderUrl} alt="" {onload} {onerror} />
  {#if !imageLoaded}
    <div id="spinner" class="flex h-full items-center justify-center">
      <LoadingSpinner />
    </div>
  {:else if !imageError}
    <div
      use:zoomImageAction
      use:swipe={() => ({})}
      onswipe={onSwipe}
      class="h-full w-full"
      transition:fade={{ duration: haveFadeTransition ? assetViewerFadeDuration : 0 }}
    >
      {#if $slideshowState !== SlideshowState.None && $slideshowLook === SlideshowLook.BlurredBackground}
        <img
          src={assetFileUrl}
          alt=""
          class="-z-1 absolute top-0 start-0 object-cover h-full w-full blur-lg"
          draggable="false"
        />
      {/if}
      <img
        bind:this={$photoViewerImgElement}
        src={assetFileUrl}
        alt={$getAltText(toTimelineAsset(asset))}
        class="h-full w-full {$slideshowState === SlideshowState.None
          ? 'object-contain'
          : slideshowLookCssMapping[$slideshowLook]}"
        draggable="false"
      />
      <!-- eslint-disable-next-line svelte/require-each-key -->
      {#each getBoundingBox($boundingBoxesArray, $photoZoomState, $photoViewerImgElement) as boundingbox}
        <div
          class="absolute border-solid border-white border-[3px] rounded-lg"
          style="top: {boundingbox.top}px; left: {boundingbox.left}px; height: {boundingbox.height}px; width: {boundingbox.width}px;"
        ></div>
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
