<script lang="ts">
  import { ResizeBoundary, transformManager } from '$lib/managers/edit/transform-manager.svelte';
  import { getAssetMediaUrl } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import { getAltText } from '$lib/utils/thumbnail-util';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
  import { AssetMediaSize, type AssetResponseDto } from '@immich/sdk';
  import { Icon } from '@immich/ui';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { ColorPreviewRequest, ColorPreviewResponse } from './color-preview.worker';

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

  let previewCanvas = $state<HTMLCanvasElement | null>(null);
  let sourcePixels = $state<ImageData | null>(null);
  let previewReady = $state(false);
  let sourceSrc = $state('');
  let worker = $state<Worker | null>(null);
  let busy = false;
  let pending: ColorPreviewRequest | undefined;
  let sentSource: ImageData | null = null;

  function sendPreview(request: ColorPreviewRequest) {
    if (busy || !worker) {
      pending = request;
      return;
    }
    busy = true;
    pending = undefined;
    if (sourcePixels && sentSource !== sourcePixels) {
      request.pixels = sourcePixels.data;
      sentSource = sourcePixels;
    }
    worker.postMessage(request);
  }
  const useColorPreview = $derived(transformManager.brightness !== 0 || transformManager.contrast !== 0);

  function loadColorPreview(event: Event) {
    const image = event.currentTarget as HTMLImageElement;
    sourcePixels = null;
    previewReady = false;
    try {
      // Cache a bounded source once; slider changes only run the shared pixel calculation.
      const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
      const source = document.createElement('canvas');
      source.width = Math.max(1, Math.round(image.naturalWidth * scale));
      source.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = source.getContext('2d', { willReadFrequently: true });
      if (!context) {
        throw new Error('Unable to create the color preview');
      }
      context.drawImage(image, 0, 0, source.width, source.height);
      sourcePixels = context.getImageData(0, 0, source.width, source.height);
      sourceSrc = imageSrc;
      sentSource = null;
    } catch (error) {
      handleError(error, 'ErrorLoadingImage');
    }
  }

  $effect(() => {
    const source = sourcePixels;
    const src = imageSrc;
    const brightness = transformManager.brightness;
    const contrast = transformManager.contrast;
    if (!source || sourceSrc !== src || !worker || !useColorPreview) {
      previewReady = false;
      pending = undefined;
      return;
    }
    const frame = requestAnimationFrame(() => {
      // At most one running render and one pending render; newer slider values replace pending ones.
      sendPreview({ src, width: source.width, height: source.height, brightness, contrast });
    });
    return () => cancelAnimationFrame(frame);
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
    worker = new Worker(new URL('color-preview.worker.ts', import.meta.url), { type: 'module' });
    worker.addEventListener('message', ({ data }: MessageEvent<ColorPreviewResponse>) => {
      busy = false;
      if (data.src === imageSrc && previewCanvas && useColorPreview) {
        const context = previewCanvas.getContext('2d');
        if (context) {
          previewCanvas.width = data.width;
          previewCanvas.height = data.height;
          context.putImageData(new ImageData(new Uint8ClampedArray(data.pixels), data.width, data.height), 0, 0);
          previewReady = true;
        } else {
          handleError(new Error('Unable to create the color preview'), 'ErrorLoadingImage');
        }
      }
      if (pending && pending.src === imageSrc && useColorPreview) {
        sendPreview(pending);
      } else {
        pending = undefined;
      }
    });
    worker.addEventListener('error', (error) => {
      busy = false;
      handleError(error, 'ErrorLoadingImage');
    });
    const resizeObserver = new ResizeObserver(() => {
      transformManager.resizeCanvas();
    });

    resizeObserver.observe(canvasContainer!);

    return () => {
      resizeObserver.disconnect();
      worker?.terminate();
    };
  });
</script>

<div class="flex size-full flex-col items-center justify-center p-8" bind:this={canvasContainer}>
  <div
    class="crop-area max-h-full max-w-full transition-transform motion-reduce:transition-none"
    class:rotated={transformManager.normalizedRotation % 180 > 0}
    style:rotate={transformManager.imageRotation + 'deg'}
    bind:this={transformManager.cropAreaEl}
    aria-label="Crop area"
  >
    <img
      draggable="false"
      src={imageSrc}
      alt={$getAltText(toTimelineAsset(asset))}
      class="h-full transition-transform select-none motion-reduce:transition-none"
      style:transform={imageTransform}
      style:opacity={useColorPreview && previewReady && sourceSrc === imageSrc ? 0 : 1}
      onload={loadColorPreview}
    />
    <canvas
      bind:this={previewCanvas}
      class="pointer-events-none absolute top-0 size-full transition-transform motion-reduce:transition-none"
      style:transform={imageTransform}
      hidden={!useColorPreview || !previewReady || sourceSrc !== imageSrc}
      aria-hidden="true"
    ></canvas>
    <div
      class={[
        'overlay pointer-events-none absolute top-0 size-full transition-colors motion-reduce:transition-none',
        transformManager.isInteracting ? 'bg-black/30' : 'bg-black/56',
      ]}
      bind:this={transformManager.overlayEl}
    ></div>
    <div class="crop-frame absolute border-2 border-white" bind:this={transformManager.cropFrame}>
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class={[
          'grid size-full cursor-move transition-opacity motion-reduce:transition-none',
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
