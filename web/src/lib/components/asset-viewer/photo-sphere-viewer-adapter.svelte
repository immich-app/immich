<script lang="ts">
  import { alwaysLoadOriginalFile } from '$lib/stores/preferences.store';
  import {
    EquirectangularAdapter,
    Viewer,
    events,
    type AdapterConstructor,
    type PluginConstructor,
  } from '@photo-sphere-viewer/core';
  import '@photo-sphere-viewer/core/index.css';
  import { onDestroy, onMount } from 'svelte';

  export let panorama: string | { source: string };
  export let originalImageUrl: string | null;
  export let adapter: AdapterConstructor | [AdapterConstructor, unknown] = EquirectangularAdapter;
  export let plugins: (PluginConstructor | [PluginConstructor, unknown])[] = [];
  export let navbar = false;

  let container: HTMLDivElement;
  let viewer: Viewer;

  onMount(() => {
    viewer = new Viewer({
      adapter,
      plugins,
      container,
      panorama,
      touchmoveTwoFingers: true,
      mousewheelCtrlKey: false,
      navbar,
      maxFov: 180,
      fisheye: true,
    });

    if (originalImageUrl && !$alwaysLoadOriginalFile) {
      const zoomHandler = ({ zoomLevel }: events.ZoomUpdatedEvent) => {
        // zoomLevel range: [0, 100]
        if (Math.round(zoomLevel) >= 75) {
          // Replace the preview with the original
          viewer.setPanorama(originalImageUrl, { showLoader: false, speed: 150 }).catch(() => {
            viewer.setPanorama(panorama, { showLoader: false, speed: 0 }).catch(() => {});
          });
          viewer.removeEventListener(events.ZoomUpdatedEvent.type, zoomHandler);
        }
      };
      viewer.addEventListener(events.ZoomUpdatedEvent.type, zoomHandler);
    }
  });

  onDestroy(() => {
    if (viewer) {
      viewer.destroy();
    }
  });
</script>

<div class="h-full w-full mb-0" bind:this={container} />
