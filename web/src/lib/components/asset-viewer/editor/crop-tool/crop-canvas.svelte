<script lang="ts">
  import { onMount, afterUpdate, onDestroy } from 'svelte';
  import { t } from 'svelte-i18n';
  import { getAssetOriginalUrl } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';

  import { imgElement, canvasElement, resetCropStore } from './crop-store';

  import { draw } from './canvas-drawing';
  import { onImageLoad, resizeCanvas } from './image-loading';
  import { handleMouseDown, handleMouseMove, handleMouseUp, handleMouseOut } from './mouse-handlers';
  import { recalculateCrop, animateCropChange } from './crop-settings';
  import { cropAspectRatio, cropSettings, resetGlobalCropStore } from '$lib/stores/asset-editor.store';

  export let asset;

  let canvas: HTMLCanvasElement;
  let img: HTMLImageElement;

  $: imgElement.set(img);
  $: canvasElement.set(canvas);

  cropAspectRatio.subscribe((value) => {
    if (!$imgElement || !$canvasElement) {
      return;
    }
    const newCrop = recalculateCrop($cropSettings, $canvasElement, value, true);
    if (newCrop) {
      animateCropChange($cropSettings, newCrop, () => draw($canvasElement, $cropSettings));
    }
  });

  onMount(() => {
    resetCropStore();
    resetGlobalCropStore();
    $imgElement = new Image();
    $imgElement.src = getAssetOriginalUrl({ id: asset.id, checksum: asset.checksum });
    $imgElement.addEventListener('load', onImageLoad);
    $imgElement.addEventListener('error', (error) => {
      handleError(error, $t('error_loading_image'));
    });
  });

  onDestroy(() => {
    resetCropStore();
    resetGlobalCropStore();
  });

  afterUpdate(() => {
    resizeCanvas();
  });
</script>

<div class="canvas-container">
  <canvas
    bind:this={canvas}
    on:mousedown={handleMouseDown}
    on:mousemove={handleMouseMove}
    on:mouseup={handleMouseUp}
    on:blur={handleMouseOut}
  ></canvas>
</div>

<style>
  .canvas-container {
    width: 90%;
    margin: auto;
    margin-top: 2rem;
    height: calc(100% - 4rem);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  canvas {
    cursor: default;
  }
</style>
