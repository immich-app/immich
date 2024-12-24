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

  interface Props {
    panorama: string | { source: string };
    originalImageUrl?: string;
    adapter?: AdapterConstructor | [AdapterConstructor, unknown];
    plugins?: (PluginConstructor | [PluginConstructor, unknown])[];
    navbar?: boolean;
  }

  let { panorama, originalImageUrl, adapter = EquirectangularAdapter, plugins = [], navbar = false }: Props = $props();

  let container: HTMLDivElement | undefined = $state();
  let viewer: Viewer;

  onMount(() => {
    if (!container) {
      return;
    }

    viewer = new Viewer({
      adapter,
      plugins,
      container,
      panorama,
      touchmoveTwoFingers: false,
      mousewheelCtrlKey: false,
      navbar,
      minFov: 10,
      maxFov: 120,
      fisheye: false,
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

<div class="h-full w-full mb-0" bind:this={container}></div>
