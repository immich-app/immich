<script lang="ts">
  import { photoViewer } from '$lib/stores/assets.store';
  import { boundingBoxesArray } from '$lib/stores/people.store';
  import { alwaysLoadOriginalFile } from '$lib/stores/preferences.store';
  import { photoZoomState } from '$lib/stores/zoom-image.store';
  import { downloadRequest, getAssetFileUrl, handlePromiseError } from '$lib/utils';
  import { isWebCompatibleImage } from '$lib/utils/asset-utils';
  import { getBoundingBox } from '$lib/utils/people-utils';
  import { shortcuts } from '$lib/utils/shortcut';
  import { type AssetResponseDto, AssetTypeEnum } from '@immich/sdk';
  import { useZoomImageWheel } from '@zoom-image/svelte';
  import { onDestroy, onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import LoadingSpinner from '../shared-components/loading-spinner.svelte';
  import { NotificationType, notificationController } from '../shared-components/notification/notification';
  import { getAltText } from '$lib/utils/thumbnail-util';
  import { SlideshowLookCssMapping, SlideshowState, slideshowStore } from '$lib/stores/slideshow.store';

  const { slideshowState, slideshowLook } = slideshowStore;

  export let asset: AssetResponseDto;
  export let preloadAssets: AssetResponseDto[] | null = null;
  export let element: HTMLDivElement | undefined = undefined;
  export let haveFadeTransition = true;

  let imgElement: HTMLDivElement;
  let assetData: string;
  let abortController: AbortController;
  let hasZoomed = false;
  let copyImageToClipboard: (source: string) => Promise<Blob>;
  let canCopyImagesToClipboard: () => boolean;
  let imageLoaded: boolean = false;

  const loadOriginalByDefault = $alwaysLoadOriginalFile && isWebCompatibleImage(asset);

  $: if (imgElement) {
    createZoomImageWheel(imgElement, {
      maxZoom: 10,
      wheelZoomRatio: 0.2,
    });
  }

  onMount(async () => {
    // Import hack :( see https://github.com/vadimkorr/svelte-carousel/issues/27#issuecomment-851022295
    // TODO: Move to regular import once the package correctly supports ESM.
    const module = await import('copy-image-clipboard');
    copyImageToClipboard = module.copyImageToClipboard;
    canCopyImagesToClipboard = module.canCopyImagesToClipboard;

    imageLoaded = false;
    await loadAssetData({ loadOriginal: loadOriginalByDefault });
  });

  onDestroy(() => {
    $boundingBoxesArray = [];
    abortController?.abort();
  });

  const loadAssetData = async ({ loadOriginal }: { loadOriginal: boolean }) => {
    try {
      abortController?.abort();
      abortController = new AbortController();

      // TODO: Use sdk once it supports signals
      const { data } = await downloadRequest({
        url: getAssetFileUrl(asset.id, !loadOriginal, false),
        signal: abortController.signal,
      });

      assetData = URL.createObjectURL(data);
      imageLoaded = true;

      if (!preloadAssets) {
        return;
      }

      for (const preloadAsset of preloadAssets) {
        if (preloadAsset.type === AssetTypeEnum.Image) {
          await downloadRequest({
            url: getAssetFileUrl(preloadAsset.id, !loadOriginal, false),
            signal: abortController.signal,
          });
        }
      }
    } catch {
      imageLoaded = false;
    }
  };

  const doCopy = async () => {
    if (!canCopyImagesToClipboard()) {
      return;
    }

    try {
      await copyImageToClipboard(assetData);
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

    if (state.currentZoom > 1 && isWebCompatibleImage(asset) && !hasZoomed && !$alwaysLoadOriginalFile) {
      hasZoomed = true;

      handlePromiseError(loadAssetData({ loadOriginal: true }));
    }
  });

  const onCopyShortcut = () => {
    if (window.getSelection()?.type === 'Range') {
      return;
    }
    handlePromiseError(doCopy());
  };
</script>

<svelte:window
  on:copyImage={doCopy}
  on:zoomImage={doZoomImage}
  use:shortcuts={[
    { shortcut: { key: 'c', ctrl: true }, onShortcut: onCopyShortcut },
    { shortcut: { key: 'c', meta: true }, onShortcut: onCopyShortcut },
  ]}
/>

<div
  bind:this={element}
  transition:fade={{ duration: haveFadeTransition ? 150 : 0 }}
  class="flex h-full select-none place-content-center place-items-center"
>
  {#if !imageLoaded}
    <LoadingSpinner />
  {:else}
    <div bind:this={imgElement} class="h-full w-full">
      <img
        bind:this={$photoViewer}
        transition:fade={{ duration: haveFadeTransition ? 150 : 0 }}
        src={assetData}
        alt={getAltText(asset)}
        class="h-full w-full {$slideshowState === SlideshowState.None
          ? 'object-contain'
          : SlideshowLookCssMapping[$slideshowLook]}"
        draggable="false"
      />
      {#each getBoundingBox($boundingBoxesArray, $photoZoomState, $photoViewer) as boundingbox}
        <div
          class="absolute border-solid border-white border-[3px] rounded-lg"
          style="top: {boundingbox.top}px; left: {boundingbox.left}px; height: {boundingbox.height}px; width: {boundingbox.width}px;"
        />
      {/each}
    </div>
  {/if}
</div>
