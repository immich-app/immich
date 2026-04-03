<script lang="ts">
  import { ResizeBoundary, transformManager } from '$lib/managers/edit/transform-manager.svelte';
  import { getAssetMediaUrl } from '$lib/utils';
  import { getAltText } from '$lib/utils/thumbnail-util';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
  import { AssetMediaSize, type AssetResponseDto } from '@immich/sdk';
  import { Icon } from '@immich/ui';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';

  interface Props {
    asset: AssetResponseDto;
  }

  let { asset }: Props = $props();

  // viewBox 0 0 24 24 is assumed. Without rotation this icon is top-left.
  const cornerIcon = 'M 12 24 L 12 12 L 24 12';

  let canvasContainer = $state<HTMLElement | null>(null);

  let imageSrc = $derived(
    getAssetMediaUrl({ id: asset.id, cacheKey: asset.thumbhash, edited: false, size: AssetMediaSize.Preview }),
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

  const edges = [ResizeBoundary.Top, ResizeBoundary.Right, ResizeBoundary.Bottom, ResizeBoundary.Left];
  const corners = [
    ResizeBoundary.TopLeft,
    ResizeBoundary.TopRight,
    ResizeBoundary.BottomRight,
    ResizeBoundary.BottomLeft,
  ];
  function rotateBoundary(arr: ResizeBoundary[], input: ResizeBoundary, times: number) {
    return arr[(arr.indexOf(input) + times) % 4];
  }

  onMount(() => {
    const resizeObserver = new ResizeObserver(() => {
      transformManager.resizeCanvas();
    });

    resizeObserver.observe(canvasContainer!);

    return () => {
      resizeObserver.disconnect();
    };
  });
</script>

<div class="flex flex-col items-center justify-center w-full h-full p-8" bind:this={canvasContainer}>
  <div
    class="crop-area max-w-full max-h-full transition-transform motion-reduce:transition-none"
    class:rotated={transformManager.normalizedRotation % 180 > 0}
    style:rotate={transformManager.imageRotation + 'deg'}
    bind:this={transformManager.cropAreaEl}
    aria-label="Crop area"
  >
    <img
      draggable="false"
      src={imageSrc}
      alt={$getAltText(toTimelineAsset(asset))}
      class="h-full select-none transition-transform motion-reduce:transition-none"
      style:transform={imageTransform}
      onload={() => assetViewerManager.emit('ViewerOpenTransitionReady')}
      onerror={() => assetViewerManager.emit('ViewerOpenTransitionReady')}
    />
    <div
      class={[
        'overlay w-full h-full absolute top-0 transition-colors motion-reduce:transition-none pointer-events-none',
        transformManager.isInteracting ? 'bg-black/30' : 'bg-black/56',
      ]}
      bind:this={transformManager.overlayEl}
    ></div>
    <div class="crop-frame absolute border-2 border-white" bind:this={transformManager.cropFrame}>
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class={[
          'grid w-full h-full cursor-move transition-opacity motion-reduce:transition-none',
          transformManager.isInteracting ? 'opacity-100' : 'opacity-0',
        ]}
        onmousedown={(e) => transformManager.handleMouseDownOn(e, ResizeBoundary.None)}
      ></div>

      {#each edges as edge (edge)}
        {@const rotatedEdge = rotateBoundary(edges, edge, transformManager.normalizedRotation / 90)}
        <button
          class={['absolute', edge]}
          style={`${edge}: -10px`}
          onmousedown={(e) => transformManager.handleMouseDownOn(e, edge)}
          type="button"
          aria-label={$t('editor_handle_edge', { values: { edge: rotatedEdge } })}
        ></button>
      {/each}

      {#each corners as corner (corner)}
        {@const rotatedCorner = rotateBoundary(corners, corner, transformManager.normalizedRotation / 90)}
        <button
          class={['corner', corner]}
          onmousedown={(e) => transformManager.handleMouseDownOn(e, corner)}
          type="button"
          aria-label={$t('editor_handle_corner', { values: { corner: rotatedCorner.replace('-', '_') } })}
        >
          <Icon icon={cornerIcon} size="30" strokeWidth={4} strokeColor="white" color="transparent" />
        </button>
      {/each}
    </div>
  </div>
</div>

<style>
  .crop-frame.transition {
    transition: all 0.15s ease;
  }

  .grid {
    --color: white;
    --shadow: #00000057;
    background-image:
      linear-gradient(var(--color) 1px, transparent 0), linear-gradient(90deg, var(--color) 1px, transparent 0),
      linear-gradient(var(--shadow) 3px, transparent 0), linear-gradient(90deg, var(--shadow) 3px, transparent 0);
    background-size: calc(100% / 3) calc(100% / 3);
  }

  .left,
  .right {
    top: 0;
    width: 20px;
    height: 100%;
    cursor: ew-resize;
  }

  .top,
  .bottom {
    width: 100%;
    height: 20px;
    cursor: ns-resize;
  }

  .corner {
    position: absolute;
    --offset: -15px;
  }

  .top-left {
    top: var(--offset);
    left: var(--offset);
    cursor: nwse-resize;
  }

  .top-right {
    top: var(--offset);
    right: var(--offset);
    cursor: nesw-resize;
    rotate: 90deg;
  }

  .bottom-right {
    bottom: var(--offset);
    right: var(--offset);
    cursor: nwse-resize;
    rotate: 180deg;
  }

  .bottom-left {
    bottom: var(--offset);
    left: var(--offset);
    cursor: nesw-resize;
    rotate: 270deg;
  }

  .crop-area.rotated {
    max-width: calc(100vh - 16 * var(--spacing));
    max-height: calc(100vw - 400px - 16 * var(--spacing));

    .left,
    .right {
      cursor: ns-resize;
    }
    .top,
    .bottom {
      cursor: ew-resize;
    }
    .top-left,
    .bottom-right {
      cursor: nesw-resize;
    }
    .top-right,
    .bottom-left {
      cursor: nwse-resize;
    }
  }
</style>
