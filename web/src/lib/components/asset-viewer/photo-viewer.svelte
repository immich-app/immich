<script lang="ts">
  import { fade } from 'svelte/transition';
  import { onMount } from 'svelte';
  import LoadingSpinner from '../shared-components/loading-spinner.svelte';
  import { api, AssetResponseDto } from '@api';
  import { notificationController, NotificationType } from '../shared-components/notification/notification';
  import { useZoomImageWheel } from '@zoom-image/svelte';
  import { photoZoomState } from '$lib/stores/zoom-image.store';
  import { loadFullSizeImage } from '$lib/stores/preferences.store';
  import { isImageCommonlySupportedByWeb } from '$lib/utils/asset-utils';

  export let asset: AssetResponseDto;
  export let element: HTMLDivElement | undefined = undefined;

  let imgElement: HTMLDivElement;
  let assetData = '';
  let copyImageToClipboard: (src: string) => Promise<Blob>;
  let canCopyImagesToClipboard: () => boolean;
  let webVersionForced = false;

  onMount(async () => {
    // Import hack :( see https://github.com/vadimkorr/svelte-carousel/issues/27#issuecomment-851022295
    // TODO: Move to regular import once the package correctly supports ESM.
    const module = await import('copy-image-clipboard');
    copyImageToClipboard = module.copyImageToClipboard;
    canCopyImagesToClipboard = module.canCopyImagesToClipboard;
  });

  /**
   * Loads the asset data from the API.
   * @param forceWebImage - If true, the web version of the image will be loaded even if
   * it's already in a format commonly supported by web browsers.
   */
  const loadAssetData = async (forceWebImage?: boolean) => {
    try {
      const { data } = await api.assetApi.serveFile(
        {
          id: asset.id,
          isThumb: false,
          isWeb: forceWebImage || !isImageCommonlySupportedByWeb(asset),
          key: api.getKey(),
        },
        {
          responseType: 'blob',
        },
      );

      if (!(data instanceof Blob)) {
        return;
      }

      assetData = URL.createObjectURL(data);
      return assetData;
    } catch {
      // Do nothing
    }
  };

  // Load/reload asset data whenever the toggle changes
  // but not if the web version is forced due to an error loading the full size image
  $: if (loadFullSizeImage) {
    if (!webVersionForced) {
      loadAssetData(!$loadFullSizeImage);
    }
  }
  $: if ($loadFullSizeImage && webVersionForced) {
    loadAssetData(true);
  }

  const handleKeypress = async ({ metaKey, ctrlKey, key }: KeyboardEvent) => {
    if (window.getSelection()?.type === 'Range') {
      return;
    }
    if ((metaKey || ctrlKey) && key === 'c') {
      await doCopy();
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
    } catch (err) {
      console.error('Error [photo-viewer]:', err);
      notificationController.show({
        type: NotificationType.Error,
        message: 'Copying image to clipboard failed.',
      });
    }
  };

  const doZoomImage = async () => {
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
  });

  $: if (imgElement) {
    createZoomImageWheel(imgElement, {
      wheelZoomRatio: 0.2,
    });
  }
</script>

<svelte:window on:keydown={handleKeypress} on:copyImage={doCopy} on:zoomImage={doZoomImage} />

<div
  bind:this={element}
  transition:fade={{ duration: 150 }}
  class="flex h-full select-none place-content-center place-items-center"
>
  {#if !assetData.length}
    <LoadingSpinner />
  {:else}
    <div bind:this={imgElement} class="h-full w-full">
      <img
        transition:fade={{ duration: 150 }}
        src={assetData}
        alt={asset.id}
        class="h-full w-full object-contain"
        draggable="false"
        on:error={async (e) => {
          if ($loadFullSizeImage && !webVersionForced) {
            // There was an error loading the image, force web version
            console.log('Error loading full size image, dropping back to web version...');
            assetData = '';
            webVersionForced = true;
            await loadAssetData(true);
            return;
          }
          console.error('Error loading image', e);
        }}
      />
    </div>
  {/if}
</div>
