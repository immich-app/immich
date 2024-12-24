<script lang="ts">
  import { onMount, onDestroy, tick } from 'svelte';
  import { t } from 'svelte-i18n';
  import { getAssetOriginalUrl } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import { getAltText } from '$lib/utils/thumbnail-util';

  import { imgElement, cropAreaEl, resetCropStore, overlayEl, isResizingOrDragging, cropFrame } from './crop-store';
  import { draw } from './drawing';
  import { onImageLoad, resizeCanvas } from './image-loading';
  import { handleMouseDown, handleMouseMove, handleMouseUp } from './mouse-handlers';
  import { recalculateCrop, animateCropChange } from './crop-settings';
  import {
    changedOriention,
    cropAspectRatio,
    cropSettings,
    resetGlobalCropStore,
    rotateDegrees,
  } from '$lib/stores/asset-editor.store';
  import type { AssetResponseDto } from '@immich/sdk';

  interface Props {
    asset: AssetResponseDto;
  }

  let { asset }: Props = $props();

  let img = $state<HTMLImageElement>();

  $effect(() => {
    if (!img) {
      return;
    }

    imgElement.set(img);
  });

  cropAspectRatio.subscribe((value) => {
    if (!img || !$cropAreaEl) {
      return;
    }
    const newCrop = recalculateCrop($cropSettings, $cropAreaEl, value, true);
    if (newCrop) {
      animateCropChange($cropSettings, newCrop, () => draw($cropSettings));
    }
  });

  onMount(async () => {
    resetGlobalCropStore();
    img = new Image();
    await tick();

    img.src = getAssetOriginalUrl({ id: asset.id, checksum: asset.checksum });

    img.addEventListener('load', () => onImageLoad(true));
    img.addEventListener('error', (error) => {
      handleError(error, $t('error_loading_image'));
    });

    globalThis.addEventListener('mousemove', handleMouseMove);
  });

  onDestroy(() => {
    globalThis.removeEventListener('mousemove', handleMouseMove);
    resetCropStore();
    resetGlobalCropStore();
  });

  $effect(() => {
    resizeCanvas();
  });
</script>

<div class="canvas-container">
  <button
    class={`crop-area ${$changedOriention ? 'changedOriention' : ''}`}
    style={`rotate:${$rotateDegrees}deg`}
    bind:this={$cropAreaEl}
    onmousedown={handleMouseDown}
    onmouseup={handleMouseUp}
    aria-label="Crop area"
    type="button"
  >
    <img draggable="false" src={img?.src} alt={$getAltText(asset)} />
    <div class={`${$isResizingOrDragging ? 'resizing' : ''} crop-frame`} bind:this={$cropFrame}>
      <div class="grid"></div>
      <div class="corner top-left"></div>
      <div class="corner top-right"></div>
      <div class="corner bottom-left"></div>
      <div class="corner bottom-right"></div>
    </div>
    <div class={`${$isResizingOrDragging ? 'light' : ''} overlay`} bind:this={$overlayEl}></div>
  </button>
</div>

<style>
  .canvas-container {
    width: calc(100% - 4rem);
    margin: auto;
    margin-top: 2rem;
    height: calc(100% - 4rem);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .crop-area {
    position: relative;
    display: inline-block;
    outline: none;
    transition: rotate 0.15s ease;
    max-height: 100%;
    max-width: 100%;
    width: max-content;
  }
  .crop-area.changedOriention {
    max-width: 92vh;
    max-height: calc(100vw - 400px - 1.5rem);
  }

  .crop-frame.transition {
    transition: all 0.15s ease;
  }
  .overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.56);
    pointer-events: none;
    transition: background 0.1s;
  }

  .overlay.light {
    background: rgba(0, 0, 0, 0.3);
  }

  .grid {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    --color: white;
    --shadow: #00000057;
    background-image: linear-gradient(var(--color) 1px, transparent 0),
      linear-gradient(90deg, var(--color) 1px, transparent 0), linear-gradient(var(--shadow) 3px, transparent 0),
      linear-gradient(90deg, var(--shadow) 3px, transparent 0);
    background-size: calc(100% / 3) calc(100% / 3);
    opacity: 0;
    transition: opacity 0.1s ease;
  }

  .crop-frame.resizing .grid {
    opacity: 1;
  }

  .crop-area img {
    display: block;
    max-width: 100%;
    height: 100%;
    user-select: none;
  }

  .crop-frame {
    position: absolute;
    border: 2px solid white;
    box-sizing: border-box;
    pointer-events: none;
    z-index: 1;
  }

  .corner {
    position: absolute;
    width: 20px;
    height: 20px;
    --size: 5.2px;
    --mSize: calc(-0.5 * var(--size));
    border: var(--size) solid white;
    box-sizing: border-box;
  }

  .top-left {
    top: var(--mSize);
    left: var(--mSize);
    border-right: none;
    border-bottom: none;
  }

  .top-right {
    top: var(--mSize);
    right: var(--mSize);
    border-left: none;
    border-bottom: none;
  }

  .bottom-left {
    bottom: var(--mSize);
    left: var(--mSize);
    border-right: none;
    border-top: none;
  }

  .bottom-right {
    bottom: var(--mSize);
    right: var(--mSize);
    border-left: none;
    border-top: none;
  }
</style>
