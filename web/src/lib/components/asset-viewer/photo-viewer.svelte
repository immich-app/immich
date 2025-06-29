<script lang="ts">
  import { shortcuts } from '$lib/actions/shortcut';
  import FaceEditor from '$lib/components/asset-viewer/face-editor/face-editor.svelte';
  import BrokenAsset from '$lib/components/assets/broken-asset.svelte';
  import { assetViewerFadeDuration } from '$lib/constants';
  import { type AssetManager } from '$lib/managers/asset-manager/asset-manager.svelte';
  import {
    cancelImageLoad,
    mediaLoadError,
    mediaLoaded,
  } from '$lib/managers/asset-manager/internal/load-support.svelte';
  import { zoomImageAttachment } from '$lib/managers/asset-manager/internal/zoom-support.svelte';
  import { castManager } from '$lib/managers/cast-manager.svelte';
  import { photoViewerImgElement } from '$lib/stores/assets-store.svelte';
  import { isFaceEditMode } from '$lib/stores/face-edit.svelte';
  import { boundingBoxesArray } from '$lib/stores/people.store';
  import { SlideshowLook, SlideshowState, slideshowLookCssMapping, slideshowStore } from '$lib/stores/slideshow.store';
  import { handlePromiseError } from '$lib/utils';
  import { canCopyImageToClipboard, copyImageToClipboard } from '$lib/utils/asset-utils';
  import { handleError } from '$lib/utils/handle-error';
  import { getBoundingBox } from '$lib/utils/people-utils';
  import { getAltText } from '$lib/utils/thumbnail-util';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
  import { type SharedLinkResponseDto } from '@immich/sdk';
  import { onDestroy } from 'svelte';
  import { swipe, type SwipeCustomEvent } from 'svelte-gestures';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';
  import LoadingSpinner from '../shared-components/loading-spinner.svelte';
  import { NotificationType, notificationController } from '../shared-components/notification/notification';

  interface Props {
    assetManager: AssetManager;
    element?: HTMLDivElement | undefined;
    haveFadeTransition?: boolean;
    sharedLink?: SharedLinkResponseDto | undefined;
    onPreviousAsset?: (() => void) | null;
    onNextAsset?: (() => void) | null;
    copyImage?: () => Promise<void>;
    zoomToggle?: (() => void) | null;
  }

  let {
    assetManager = $bindable(),
    element = $bindable(),
    haveFadeTransition = true,
    sharedLink = undefined,
    onPreviousAsset = null,
    onNextAsset = null,
    copyImage = $bindable(),
    zoomToggle = $bindable(),
  }: Props = $props();

  const { slideshowState, slideshowLook } = slideshowStore;

  let zoomImageState = $derived(assetManager.zoomImageState);

  zoomToggle = () => {
    if (zoomImageState) {
      zoomImageState.currentZoom = zoomImageState.currentZoom > 1 ? 1 : 2;
    }
  };

  onDestroy(() => {
    $boundingBoxesArray = [];
  });

  copyImage = async () => {
    if (!canCopyImageToClipboard()) {
      return;
    }

    try {
      await copyImageToClipboard($photoViewerImgElement ?? assetManager.url!);
      notificationController.show({
        type: NotificationType.Info,
        message: $t('copied_image_to_clipboard'),
        timeout: 3000,
      });
    } catch (error) {
      handleError(error, $t('copy_error'));
    }
  };

  const onPlaySlideshow = () => ($slideshowState = SlideshowState.PlaySlideshow);

  $effect(() => {
    if (isFaceEditMode.value && zoomImageState && zoomImageState.currentZoom > 1) {
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
    if (!zoomImageState || zoomImageState.currentZoom > 1) {
      return;
    }
    if (onNextAsset && event.detail.direction === 'left') {
      onNextAsset();
    }
    if (onPreviousAsset && event.detail.direction === 'right') {
      onPreviousAsset();
    }
  };

  $effect(() => {
    if (assetManager.url) {
      // this can't be in an async context with $effect
      void cast(assetManager.url);
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

  onDestroy(() => {
    cancelImageLoad(assetManager);
  });

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
{#if assetManager.loadError}
  <div class="h-full w-full">
    <BrokenAsset class="text-xl h-full w-full" />
  </div>
{/if}
<div
  bind:this={element}
  class="relative h-full select-none"
  bind:clientWidth={containerWidth}
  bind:clientHeight={containerHeight}
>
  <img
    style="display:none"
    src={assetManager.url}
    alt=""
    aria-hidden="true"
    onload={() => mediaLoaded(assetManager)}
    onerror={() => mediaLoadError(assetManager)}
  />
  {#if !assetManager.isLoaded}
    <div id="spinner" class="flex h-full items-center justify-center">
      <LoadingSpinner />
    </div>
  {:else if !assetManager.loadError}
    <div
      {@attach zoomImageAttachment(assetManager)}
      use:swipe={() => ({})}
      onswipe={onSwipe}
      class="h-full w-full"
      transition:fade={{ duration: haveFadeTransition ? assetViewerFadeDuration : 0 }}
    >
      {#if $slideshowState !== SlideshowState.None && $slideshowLook === SlideshowLook.BlurredBackground}
        <img
          src={assetManager.url}
          alt=""
          class="-z-1 absolute top-0 start-0 object-cover h-full w-full blur-lg"
          draggable="false"
        />
      {/if}
      <img
        bind:this={$photoViewerImgElement}
        src={assetManager.url}
        alt={$getAltText(toTimelineAsset(assetManager.asset!))}
        class="h-full w-full {$slideshowState === SlideshowState.None
          ? 'object-contain'
          : slideshowLookCssMapping[$slideshowLook]}"
        draggable="false"
      />
      <!-- eslint-disable-next-line svelte/require-each-key -->
      {#each getBoundingBox($boundingBoxesArray, zoomImageState!, $photoViewerImgElement) as boundingbox}
        <div
          class="absolute border-solid border-white border-[3px] rounded-lg"
          style="top: {boundingbox.top}px; left: {boundingbox.left}px; height: {boundingbox.height}px; width: {boundingbox.width}px;"
        ></div>
      {/each}
    </div>

    {#if isFaceEditMode.value}
      <FaceEditor
        htmlElement={$photoViewerImgElement}
        {containerWidth}
        {containerHeight}
        assetId={assetManager.asset!.id}
      />
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
