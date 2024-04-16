<script lang="ts">
  import {
    Viewer,
    EquirectangularAdapter,
    type PluginConstructor,
    type AdapterConstructor,
  } from '@photo-sphere-viewer/core';
  import '@photo-sphere-viewer/core/index.css';
  import { onDestroy, onMount } from 'svelte';

  export let panorama: string | { source: string };
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
  });

  onDestroy(() => {
    if (viewer) {
      viewer.destroy();
    }
  });
</script>

<div class="h-full w-full mb-0" bind:this={container} />
