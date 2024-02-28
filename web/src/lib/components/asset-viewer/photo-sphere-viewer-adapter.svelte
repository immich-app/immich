<script lang="ts">
  import { Viewer } from '@photo-sphere-viewer/core';
  import '@photo-sphere-viewer/core/index.css';
  import { onDestroy, onMount } from 'svelte';

  export let panorama: string;
  let container: HTMLDivElement;
  let viewer: Viewer;

  onMount(() => {
    viewer = new Viewer({
      container,
      panorama,
      touchmoveTwoFingers: true,
      mousewheelCtrlKey: false,
      navbar: false,
    });
  });

  onDestroy(() => {
    if (viewer) {
      viewer.destroy();
    }
  });
</script>

<div class="h-full w-full mb-0" bind:this={container} />
