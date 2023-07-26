<script lang="ts" context="module">
  import { createContext } from '$lib/utils/context';

  const { get: getContext, set: setMapContext } = createContext<() => Map>();

  export const getMapContext = () => {
    const getMap = getContext();
    return getMap();
  };
</script>

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { Map, type LatLngExpression, type MapOptions } from 'leaflet';
  import 'leaflet/dist/leaflet.css';

  export let center: LatLngExpression;
  export let zoom: number;
  export let options: MapOptions | undefined = undefined;
  export let allowDarkMode = false;
  let container: HTMLDivElement;
  let map: Map;

  setMapContext(() => map);

  onMount(() => {
    if (browser) {
      map = new Map(container, options);
    }
  });

  onDestroy(() => {
    if (map) map.remove();
  });

  $: if (map) map.setView(center, zoom);
</script>

<div bind:this={container} class="h-full w-full" class:map-dark={allowDarkMode}>
  {#if map}
    <slot />
  {/if}
</div>

<style>
  :global(.dark) .map-dark :global(.leaflet-layer) {
    filter: invert(100%) brightness(130%) saturate(0%);
  }
</style>
