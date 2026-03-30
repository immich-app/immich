<script lang="ts">
  import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';
  import { getAssetUrls } from '$lib/utils';
  import { scaleToFit, type ContentMetrics } from '$lib/utils/container-utils';
  import { TUNABLES } from '$lib/utils/tunables';
  import type { AssetResponseDto, SharedLinkResponseDto } from '@immich/sdk';
  import { clamp } from 'lodash-es';
  import { fade } from 'svelte/transition';

  interface Props {
    containerWidth: number;
    containerHeight: number;
    asset: AssetResponseDto;
    sharedLink?: SharedLinkResponseDto;
  }

  let { containerWidth, containerHeight, asset, sharedLink }: Props = $props();

  const MAX_ZOOM = 10;
  const MINIMAP_MAX = 192;
  const MINIMAP_MIN = 100;
  const WHEEL_ZOOM_RATIO = 0.1;

  const minimapSize = $derived(clamp(Math.min(containerWidth, containerHeight) * 0.25, MINIMAP_MIN, MINIMAP_MAX));
  const thumbnailUrl = $derived(getAssetUrls(asset, sharedLink).thumbnail);

  const imageDimensions = $derived({
    width: Math.max(asset.width ?? 0, 1),
    height: Math.max(asset.height ?? 0, 1),
  });

  const minimapLayout = $derived.by(() => {
    const fitted = scaleToFit(
      { width: containerWidth, height: containerHeight },
      { width: minimapSize, height: minimapSize },
    );
    return {
      fitted,
      scale: fitted.width / containerWidth,
      offsetX: (minimapSize - fitted.width) / 2,
      offsetY: (minimapSize - fitted.height) / 2,
    };
  });

  const imageInMinimap: ContentMetrics = $derived.by(() => {
    const fitted = scaleToFit(imageDimensions, minimapLayout.fitted);
    return {
      contentWidth: fitted.width,
      contentHeight: fitted.height,
      offsetX: minimapLayout.offsetX + (minimapLayout.fitted.width - fitted.width) / 2,
      offsetY: minimapLayout.offsetY + (minimapLayout.fitted.height - fitted.height) / 2,
    };
  });

  const { FADE_DURATION, HIDE_DELAY } = TUNABLES.MINIMAP;

  let isRecentActivity = $state(false);
  let hideTimer: ReturnType<typeof setTimeout> | null = null;

  const resetHideTimer = () => {
    isRecentActivity = true;
    if (hideTimer !== null) {
      clearTimeout(hideTimer);
    }
    hideTimer = setTimeout(() => {
      isRecentActivity = false;
      hideTimer = null;
    }, HIDE_DELAY);
  };

  const isZoomed = $derived(assetViewerManager.zoom > 1);

  $effect(() => {
    void assetViewerManager.zoomState;
    if (isZoomed) {
      resetHideTimer();
    }
    return () => {
      if (hideTimer !== null) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
    };
  });

  const zoomPercent = $derived(((assetViewerManager.zoom - 1) / (MAX_ZOOM - 1)) * 100);
  const zoomLabel = $derived(assetViewerManager.zoom.toFixed(1) + 'x');

  const clampPanPosition = (positionX: number, positionY: number, zoom: number) => ({
    positionX: clamp(positionX, -(containerWidth * (zoom - 1)), 0),
    positionY: clamp(positionY, -(containerHeight * (zoom - 1)), 0),
  });

  const minimapToContainerPosition = (minimapX: number, minimapY: number) => {
    const containerX = (minimapX - minimapLayout.offsetX) / minimapLayout.scale;
    const containerY = (minimapY - minimapLayout.offsetY) / minimapLayout.scale;
    const { currentZoom } = assetViewerManager.zoomState;
    const rawPositionX = containerWidth / 2 - containerX * currentZoom;
    const rawPositionY = containerHeight / 2 - containerY * currentZoom;
    return clampPanPosition(rawPositionX, rawPositionY, currentZoom);
  };

  const panToMinimapPosition = (event: PointerEvent) => {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const minimapX = event.clientX - rect.left;
    const minimapY = event.clientY - rect.top;
    const { positionX, positionY } = minimapToContainerPosition(minimapX, minimapY);
    assetViewerManager.zoomStateOverride({ currentPositionX: positionX, currentPositionY: positionY });
  };

  const zoomAroundCenter = (newZoom: number) => {
    const { currentZoom, currentPositionX, currentPositionY } = assetViewerManager.zoomState;
    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;
    const zoomTargetX = (centerX - currentPositionX) / currentZoom;
    const zoomTargetY = (centerY - currentPositionY) / currentZoom;
    const { positionX, positionY } = clampPanPosition(
      -zoomTargetX * newZoom + centerX,
      -zoomTargetY * newZoom + centerY,
      newZoom,
    );
    assetViewerManager.zoomStateOverride({
      currentZoom: newZoom,
      currentPositionX: positionX,
      currentPositionY: positionY,
    });
  };

  const setZoomFromSlider = (event: PointerEvent) => {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const percent = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    zoomAroundCenter(1 + percent * (MAX_ZOOM - 1));
  };

  const onWheel = (event: WheelEvent) => {
    event.preventDefault();
    const { currentZoom } = assetViewerManager.zoomState;
    const delta = -clamp(event.deltaY, -0.5, 0.5);
    const newZoom = clamp(currentZoom + delta * WHEEL_ZOOM_RATIO * currentZoom, 1, MAX_ZOOM);
    zoomAroundCenter(newZoom);
  };

  const createDragHandlers = (onDrag: (event: PointerEvent) => void) => {
    let active = $state(false);
    return {
      get active() {
        return active;
      },
      onpointerdown(event: PointerEvent) {
        if (event.button !== 0) {
          return;
        }
        active = true;
        assetViewerManager.setZoomEnabled(false);
        (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
        onDrag(event);
        event.preventDefault();
        event.stopPropagation();
      },
      onpointermove(event: PointerEvent) {
        if (active) {
          onDrag(event);
        }
      },
      onpointerup() {
        active = false;
        assetViewerManager.setZoomEnabled(true);
      },
    };
  };

  const canvasDrag = createDragHandlers(panToMinimapPosition);
  const sliderDrag = createDragHandlers(setZoomFromSlider);

  const isVisible = $derived((isZoomed && isRecentActivity) || canvasDrag.active || sliderDrag.active);

  const viewportRect = $derived.by(() => {
    const { currentZoom, currentPositionX, currentPositionY } = assetViewerManager.zoomState;

    const visibleLeft = -currentPositionX / currentZoom;
    const visibleTop = -currentPositionY / currentZoom;
    const visibleWidth = containerWidth / currentZoom;
    const visibleHeight = containerHeight / currentZoom;

    return {
      left: visibleLeft * minimapLayout.scale + minimapLayout.offsetX,
      top: visibleTop * minimapLayout.scale + minimapLayout.offsetY,
      width: visibleWidth * minimapLayout.scale,
      height: visibleHeight * minimapLayout.scale,
    };
  });
</script>

{#if isVisible}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="absolute top-[68px] right-14 md:right-4 z-10 select-none rounded-lg border border-white/30 bg-black/60 p-1 backdrop-blur-sm"
    data-testid="zoom-minimap"
    transition:fade={{ duration: FADE_DURATION }}
    ondblclick={(event) => event.stopPropagation()}
  >
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="relative overflow-hidden rounded bg-black"
      class:cursor-grabbing={canvasDrag.active}
      class:cursor-pointer={!canvasDrag.active}
      data-testid="zoom-minimap-canvas"
      style="width: {minimapSize}px; height: {minimapSize}px;"
      onpointerdown={canvasDrag.onpointerdown}
      onpointermove={canvasDrag.onpointermove}
      onpointerup={canvasDrag.onpointerup}
      onpointercancel={canvasDrag.onpointerup}
      onwheel={onWheel}
    >
      <img
        src={thumbnailUrl}
        alt=""
        class="absolute pointer-events-none"
        draggable="false"
        style="left: {imageInMinimap.offsetX}px; top: {imageInMinimap.offsetY}px; width: {imageInMinimap.contentWidth}px; height: {imageInMinimap.contentHeight}px;"
      />
      <div
        class={[
          'absolute border-2 border-white bg-white/20 pointer-events-none rounded-sm',
          canvasDrag.active && 'border-white/80',
        ]}
        data-testid="zoom-minimap-viewport"
        style="left: {viewportRect.left}px; top: {viewportRect.top}px; width: {viewportRect.width}px; height: {viewportRect.height}px;"
      ></div>
    </div>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="relative mt-1 h-3 rounded-full bg-white/20 cursor-pointer"
      class:cursor-grabbing={sliderDrag.active}
      data-testid="zoom-minimap-slider"
      style="width: {minimapSize}px;"
      onpointerdown={sliderDrag.onpointerdown}
      onpointermove={sliderDrag.onpointermove}
      onpointerup={sliderDrag.onpointerup}
      onpointercancel={sliderDrag.onpointerup}
    >
      <div
        class="absolute top-0 left-0 h-full rounded-full bg-white/80 pointer-events-none"
        data-testid="zoom-minimap-slider-fill"
        style="width: {zoomPercent}%;"
      ></div>
      <span
        class="absolute inset-0 flex items-center justify-center text-[9px] font-semibold pointer-events-none select-none leading-none"
        style="color: #000; text-shadow: 0 0 3px rgba(255,255,255,0.8);"
      >
        {zoomLabel}
      </span>
    </div>
  </div>
{/if}
