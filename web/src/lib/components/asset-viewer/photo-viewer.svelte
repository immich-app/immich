<script lang="ts">
  import { fade } from 'svelte/transition';
  import { onDestroy, onMount } from 'svelte';
  import LoadingSpinner from '../shared-components/loading-spinner.svelte';
  import { api, type AssetResponseDto } from '@api';
  import { notificationController, NotificationType } from '../shared-components/notification/notification';
  import { useZoomImageWheel } from '@zoom-image/svelte';
  import { photoZoomState } from '$lib/stores/zoom-image.store';
  import { isWebCompatibleImage } from '$lib/utils/asset-utils';
  import { shouldIgnoreShortcut } from '$lib/utils/shortcut';
  import { photoViewer } from '$lib/stores/assets.store';
  import { getBoundingBox } from '$lib/utils/people-utils';
  import { boundingBoxesArray } from '$lib/stores/people.store';
  import { handleError } from '$lib/utils/handle-error';
  import { user } from '$lib/stores/user.store';

  export let asset: AssetResponseDto;
  export let haveFadeTransition = true;
  export let element: HTMLDivElement | undefined = undefined;

  const orientationToRotation = (value: string): number => {
    if (value === '1' || value === '6' || value === '8') {
      if (imgWidth > imgHeight) {
        return 0;
      } else {
        return 90;
      }
    }
    switch (value) {
      case '1':
        return 0;
      case '2':
        return 0;
      case '3':
        return 180;
      case '4':
        return 0;
      case '5':
        return 270;
      case '6':
        return 90;
      case '7':
        return 90;
      case '8':
        return 270;
      default:
        return 0;
    }
  };

  const getRotationModulo = (rotation: number): number => {
    return ((rotation % 360) + 360) % 360;
  };

  $: {
    getRotationModulo($zoomImageWheelState.currentRotation) === 0 ||
    getRotationModulo($zoomImageWheelState.currentRotation) === 180
      ? ([imgHeight, imgWidth] = [clientHeight, clientWidth])
      : ([imgWidth, imgHeight] = [clientHeight, clientWidth]);
  }

  const rotationToOrientation = (rotation: number): number => {
    switch (getRotationModulo(rotation)) {
      case 0:
        return 1;
      case 90:
        return 8;
      case 180:
        return 3;
      case 270:
        return 6;
      default:
        return 1;
    }
  };

  const doRotate = async () => {
    setZoomImageWheelState({ currentRotation: $zoomImageWheelState.currentRotation + 90, currentZoom: 1 });

    if (($user && $user.id !== asset.ownerId) || $user === null || asset.isReadOnly) {
      return;
    }
    try {
      await api.assetApi.updateAsset({
        id: asset.id,
        updateAssetDto: { orientation: rotationToOrientation($zoomImageWheelState.currentRotation) },
      });
    } catch (error) {
      handleError(error, 'Unable to change orientation');
    }
  };

  let clientWidth: number;
  let clientHeight: number;
  let imgWidth: number;
  let imgHeight: number;
  let imgElement: HTMLDivElement;
  let assetData: string;
  let abortController: AbortController;
  let hasZoomed = false;
  let copyImageToClipboard: (src: string) => Promise<Blob>;
  let canCopyImagesToClipboard: () => boolean;

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
  });

  onDestroy(() => {
    $boundingBoxesArray = [];
    abortController?.abort();
  });

  const loadAssetData = async ({ loadOriginal }: { loadOriginal: boolean }) => {
    try {
      abortController?.abort();
      abortController = new AbortController();

      const { data } = await api.assetApi.serveFile(
        { id: asset.id, isThumb: false, isWeb: !loadOriginal, key: api.getKey() },
        {
          responseType: 'blob',
          signal: abortController.signal,
        },
      );

      if (!(data instanceof Blob)) {
        return;
      }

      assetData = URL.createObjectURL(data);
    } catch {
      // Do nothing
    }
  };

  const handleKeypress = async (event: KeyboardEvent) => {
    if (shouldIgnoreShortcut(event)) {
      return;
    }
    if (window.getSelection()?.type === 'Range') {
      return;
    }
    if ((event.metaKey || event.ctrlKey) && event.key === 'c') {
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

    if (state.currentZoom > 1 && isWebCompatibleImage(asset) && !hasZoomed) {
      hasZoomed = true;

      loadAssetData({ loadOriginal: true });
    }
  });

  $: if (imgElement) {
    createZoomImageWheel(imgElement, {
      maxZoom: 10,
      wheelZoomRatio: 0.2,
    });
  }
</script>

<svelte:window on:keydown={handleKeypress} on:rotateImage={doRotate} on:copyImage={doCopy} on:zoomImage={doZoomImage} />

<div
  bind:this={element}
  bind:clientHeight
  bind:clientWidth
  transition:fade={{ duration: haveFadeTransition ? 150 : 0 }}
  class="flex h-full w-full select-none place-content-center place-items-center"
>
  {#await loadAssetData({ loadOriginal: false })}
    <LoadingSpinner />
  {:then}
    <div
      bind:this={imgElement}
      class="duration-500"
      style={asset.exifInfo?.orientation
        ? `transform: rotate(${orientationToRotation(asset.exifInfo?.orientation)}deg);`
        : ''}
    >
      <img
        bind:this={$photoViewer}
        transition:fade={{ duration: haveFadeTransition ? 150 : 0 }}
        src={assetData}
        alt={asset.id}
        class="h-full w-full object-contain"
        draggable="false"
        style={`width:${imgWidth}px;height:${imgHeight}px;transform-origin: 0px 0px 0px;`}
      />
      {#each getBoundingBox($boundingBoxesArray, $photoZoomState, $photoViewer) as boundingbox}
        <div
          class="absolute border-solid border-white border-[3px] rounded-lg"
          style="top: {boundingbox.top}px; left: {boundingbox.left}px; height: {boundingbox.height}px; width: {boundingbox.width}px;"
        />
      {/each}
    </div>
  {/await}
</div>
