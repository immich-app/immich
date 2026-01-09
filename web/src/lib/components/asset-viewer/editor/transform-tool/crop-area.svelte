<script lang="ts">
  import { transformManager } from '$lib/managers/edit/transform-manager.svelte';
  import { getAssetThumbnailUrl } from '$lib/utils';
  import { getAltText } from '$lib/utils/thumbnail-util';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
  import { AssetMediaSize, type AssetResponseDto } from '@immich/sdk';

  interface Props {
    asset: AssetResponseDto;
  }

  let { asset }: Props = $props();

  let canvasContainer = $state<HTMLElement | null>(null);

  let imageSrc = $derived(
    getAssetThumbnailUrl({ id: asset.id, cacheKey: asset.thumbhash, edited: false, size: AssetMediaSize.Preview }),
  );

  let imageTransform = $derived.by(() => {
    const transforms: string[] = [];

    if (transformManager.mirrorHorizontal) {
      transforms.push('scaleX(-1)');
    }
    if (transformManager.mirrorVertical) {
      transforms.push('scaleY(-1)');
    }

    return transforms.join(' ');
  });

  $effect(() => {
    if (!canvasContainer) {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      transformManager.resizeCanvas();
    });

    resizeObserver.observe(canvasContainer);

    return () => {
      resizeObserver.disconnect();
    };
  });
</script>

<div class="canvas-container" bind:this={canvasContainer}>
  <button
    class={`crop-area ${transformManager.orientationChanged ? 'changedOriention' : ''}`}
    style={`rotate:${transformManager.imageRotation}deg`}
    bind:this={transformManager.cropAreaEl}
    onmousedown={(e) => transformManager.handleMouseDown(e)}
    onmouseup={() => transformManager.handleMouseUp()}
    aria-label="Crop area"
    type="button"
  >
    <img
      draggable="false"
      src={imageSrc}
      alt={$getAltText(toTimelineAsset(asset))}
      style={imageTransform ? `transform: ${imageTransform}` : ''}
    />
    <div
      class={`${transformManager.isInteracting ? 'resizing' : ''} crop-frame`}
      bind:this={transformManager.cropFrame}
    >
      <div class="grid"></div>
      <div class="corner top-left"></div>
      <div class="corner top-right"></div>
      <div class="corner bottom-left"></div>
      <div class="corner bottom-right"></div>
    </div>
    <div
      class={`${transformManager.isInteracting ? 'light' : ''} overlay`}
      bind:this={transformManager.overlayEl}
    ></div>
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
    background-image:
      linear-gradient(var(--color) 1px, transparent 0), linear-gradient(90deg, var(--color) 1px, transparent 0),
      linear-gradient(var(--shadow) 3px, transparent 0), linear-gradient(90deg, var(--shadow) 3px, transparent 0);
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
    transition: transform 0.15s ease;
  }

  .crop-frame {
    position: absolute;
    border: 2px solid white;
    box-sizing: border-box;
    pointer-events: none;
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
