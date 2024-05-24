<script lang="ts">
  import { photoViewer } from '$lib/stores/assets.store';
  import { boundingBoxesArray } from '$lib/stores/people.store';
  import { alwaysLoadOriginalFile } from '$lib/stores/preferences.store';
  import { photoZoomState } from '$lib/stores/zoom-image.store';
  import { getAssetFileUrl, handlePromiseError } from '$lib/utils';
  import { isWebCompatibleImage } from '$lib/utils/asset-utils';
  import { getBoundingBox } from '$lib/utils/people-utils';
  import { shortcuts } from '$lib/actions/shortcut';
  import { type AssetResponseDto, AssetTypeEnum } from '@immich/sdk';
  import { useZoomImageWheel } from '@zoom-image/svelte';
  import { onDestroy, onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import LoadingSpinner from '../shared-components/loading-spinner.svelte';
  import { NotificationType, notificationController } from '../shared-components/notification/notification';
  import { getAltText } from '$lib/utils/thumbnail-util';
  import { SlideshowLook, slideshowLookCssMapping, SlideshowState, slideshowStore } from '$lib/stores/slideshow.store';

  const { slideshowState, slideshowLook } = slideshowStore;

  export let asset: AssetResponseDto;
  export let preloadAssets: AssetResponseDto[] | null = null;
  export let element: HTMLDivElement | undefined = undefined;
  export let haveFadeTransition = true;

  let imgElement: HTMLDivElement;
  let assetFileUrl: string = '';
  let copyImageToClipboard: (source: string) => Promise<Blob>;
  let canCopyImagesToClipboard: () => boolean;
  let imageLoaded: boolean = false;
  let imageError: boolean = false;
  // set to true when am image has been zoomed, to force loading of the original image regardless
  // of app settings
  let forceLoadOriginal: boolean = false;

  const loadOriginalByDefault = $alwaysLoadOriginalFile && isWebCompatibleImage(asset);

  $: if (imgElement) {
    createZoomImageWheel(imgElement, {
      maxZoom: 10,
      wheelZoomRatio: 0.2,
    });
  }

  $: {
    preload({ preloadAssets, loadOriginal: loadOriginalByDefault });
  }

  $: assetFileUrl = load(asset.id, !loadOriginalByDefault || forceLoadOriginal, false, asset.checksum);

  onMount(async () => {
    // Import hack :( see https://github.com/vadimkorr/svelte-carousel/issues/27#issuecomment-851022295
    // TODO: Move to regular import once the package correctly supports ESM.
    const module = await import('copy-image-clipboard');
    copyImageToClipboard = module.copyImageToClipboard;
    canCopyImagesToClipboard = module.canCopyImagesToClipboard;
  });

  onDestroy(() => {
    $boundingBoxesArray = [];
  });

  const preload = ({
    preloadAssets,
    loadOriginal,
  }: {
    preloadAssets: AssetResponseDto[] | null;
    loadOriginal: boolean;
  }) => {
    for (const preloadAsset of preloadAssets || []) {
      if (preloadAsset.type === AssetTypeEnum.Image) {
        let img = new Image();
        img.src = getAssetFileUrl(preloadAsset.id, !loadOriginal, false, preloadAsset.checksum);
      }
    }
  };

  const load = (assetId: string, isWeb: boolean, isThumb: boolean, checksum: string) => {
    const assetUrl = getAssetFileUrl(assetId, isWeb, isThumb, checksum);
    // side effect, only flag imageLoaded when url is different
    imageLoaded = assetFileUrl === assetUrl;
    return assetUrl;
  };

  const doCopy = async () => {
    if (!canCopyImagesToClipboard()) {
      return;
    }

    try {
      await copyImageToClipboard(assetFileUrl);
      notificationController.show({
        type: NotificationType.Info,
        message: 'Copied image to clipboard.',
        timeout: 3000,
      });
    } catch (error) {
      console.error('Error [photo-viewer]:', error);
      notificationController.show({
        type: NotificationType.Error,
        message: 'Copying image to clipboard failed.',
      });
    }
  };

  const doZoomImage = () => {
    setZoomImageWheelState({
      currentZoom: $zoomImageWheelState.currentZoom === 1 ? 2 : 1,
    });
  };

  const {
    createZoomImage: createZoomImageWheel,
    zoomImageState: zoomImageWheelState,
    setZoomImageState: setZoomImageWheelState,
  } = useZoomImageWheel();

  zoomImageWheelState.subscribe((state) => {
    photoZoomState.set(state);
    forceLoadOriginal = state.currentZoom > 1 && isWebCompatibleImage(asset) ? true : false;
  });

  const onCopyShortcut = (event: KeyboardEvent) => {
    if (window.getSelection()?.type === 'Range') {
      return;
    }
    event.preventDefault();
    handlePromiseError(doCopy());
  };
</script>

<svelte:window
  on:copyImage={doCopy}
  on:zoomImage={doZoomImage}
  use:shortcuts={[
    { shortcut: { key: 'c', ctrl: true }, onShortcut: onCopyShortcut, preventDefault: false },
    { shortcut: { key: 'c', meta: true }, onShortcut: onCopyShortcut, preventDefault: false },
  ]}
/>
{#if imageError}
  <div class="h-full flex items-center justify-center">Error loading image</div>
{/if}
<div bind:this={element} class="relative h-full select-none">
  <img
    style="display:none"
    src={assetFileUrl}
    alt={getAltText(asset)}
    on:load={() => (imageLoaded = true)}
    on:error={() => (imageError = imageLoaded = true)}
  />
  {#if !imageLoaded}
    <div class:hidden={imageLoaded} class="flex h-full items-center justify-center">
      <LoadingSpinner />
    </div>
  {:else if !imageError}
    {#key assetFileUrl}
      <div
        bind:this={imgElement}
        class:hidden={!imageLoaded}
        class="h-full w-full"
        transition:fade={{ duration: haveFadeTransition ? 150 : 0 }}
      >
        {#if $slideshowState !== SlideshowState.None && $slideshowLook === SlideshowLook.BlurredBackground}
          <img
            src={assetFileUrl}
            alt={getAltText(asset)}
            class="absolute top-0 left-0 -z-10 object-cover h-full w-full blur-lg"
            draggable="false"
          />
        {/if}
        <img
          bind:this={$photoViewer}
          src={assetFileUrl}
          alt={getAltText(asset)}
          class="h-full w-full {$slideshowState === SlideshowState.None
            ? 'object-contain'
            : slideshowLookCssMapping[$slideshowLook]}"
          draggable="false"
        />
        {#each getBoundingBox($boundingBoxesArray, $photoZoomState, $photoViewer) as boundingbox}
          <div
            class="absolute border-solid border-white border-[3px] rounded-lg"
            style="top: {boundingbox.top}px; left: {boundingbox.left}px; height: {boundingbox.height}px; width: {boundingbox.width}px;"
          />
        {/each}
      </div>
    {/key}
  {/if}
</div>
