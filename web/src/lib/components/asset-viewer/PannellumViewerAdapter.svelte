<script lang="ts">
  import AssetViewerEvents from '$lib/components/AssetViewerEvents.svelte';
  import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';
  import { alwaysLoadOriginalFile } from '$lib/stores/preferences.store';
  import { computeRollCoverScale, type PannellumPoseConfig } from '$lib/utils/gpano';
  import { loadPannellum } from '$lib/utils/pannellum-loader';
  import { onDestroy, onMount } from 'svelte';

  type Props = {
    panorama: string;
    originalPanorama?: string;
    pose?: PannellumPoseConfig;
  };

  let { panorama, originalPanorama, pose }: Props = $props();

  // Below this hfov (i.e. zoomed in enough), swap the preview image for the original resolution.
  const ORIGINAL_SWAP_HFOV_THRESHOLD = 40;

  type PannellumViewerInstance = ReturnType<typeof pannellum.viewer>;
  type PannellumConfig = Parameters<typeof pannellum.viewer>[1];

  let container: HTMLDivElement | undefined = $state();
  let viewer: PannellumViewerInstance | undefined;
  let resizeObserver: ResizeObserver | undefined;
  let hasSwappedToOriginal = false;

  const buildConfig = (source: string): PannellumConfig => ({
    type: 'equirectangular',
    panorama: source,
    autoLoad: true,
    compass: true,
    northOffset: pose?.northOffset,
    horizonPitch: pose?.horizonPitch,
    horizonRoll: pose?.horizonRoll,
    yaw: pose?.yaw,
    pitch: pose?.pitch,
    hfov: pose?.hfov,
  });

  const applyInitialRollCorrection = () => {
    const rollDegrees = pose?.initialViewRollDegrees;
    if (!container || !rollDegrees) {
      return;
    }
    const renderContainer = container.querySelector<HTMLElement>('.pnlm-render-container');
    const width = renderContainer?.offsetWidth;
    const height = renderContainer?.offsetHeight;
    if (!renderContainer || !width || !height) {
      return;
    }
    // CSS rotate() is clockwise-positive, GPano roll is counterclockwise-positive.
    const cssAngle = -rollDegrees;
    const scale = computeRollCoverScale(width, height, cssAngle);
    renderContainer.style.transform = `rotate(${cssAngle}deg) scale(${scale})`;
  };

  const onZoom = () => {
    if (!viewer) {
      return;
    }
    const target = assetViewerManager.zoom > 1 ? (pose?.hfov ?? 100) : ORIGINAL_SWAP_HFOV_THRESHOLD - 10;
    viewer.setHfov(target, 250);
  };

  const swapToOriginal = () => {
    if (!container || !viewer || !originalPanorama || hasSwappedToOriginal) {
      return;
    }
    hasSwappedToOriginal = true;
    const pitch = viewer.getPitch();
    const yaw = viewer.getYaw();
    const hfov = viewer.getHfov();
    viewer.destroy();
    viewer = pannellum.viewer(container, { ...buildConfig(originalPanorama), pitch, yaw, hfov });
    viewer.on('load', applyInitialRollCorrection);
  };

  onMount(() => {
    if (!container) {
      return;
    }

    let cancelled = false;
    void loadPannellum().then(() => {
      if (cancelled || !container) {
        return;
      }

      const initialSource = $alwaysLoadOriginalFile && originalPanorama ? originalPanorama : panorama;
      if (initialSource === originalPanorama) {
        hasSwappedToOriginal = true;
      }

      viewer = pannellum.viewer(container, buildConfig(initialSource));
      viewer.on('load', applyInitialRollCorrection);

      if (originalPanorama && !hasSwappedToOriginal) {
        viewer.on('zoomchange', (hfov: number) => {
          if (hfov <= ORIGINAL_SWAP_HFOV_THRESHOLD) {
            swapToOriginal();
          }
        });
      }

      resizeObserver = new ResizeObserver(() => applyInitialRollCorrection());
      resizeObserver.observe(container);
    });

    return () => {
      cancelled = true;
    };
  });

  onDestroy(() => {
    resizeObserver?.disconnect();
    viewer?.destroy();
  });
</script>

<AssetViewerEvents {onZoom} />

<div class="mb-0 size-full" bind:this={container}></div>
