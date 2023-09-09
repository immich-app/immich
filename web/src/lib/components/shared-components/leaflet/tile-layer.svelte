<script lang="ts">
  import { TileLayer, type TileLayerOptions } from 'leaflet';
  import { onDestroy, onMount } from 'svelte';
  import { getMapContext } from './map.svelte';

  export let urlTemplate: string;
  export let options: TileLayerOptions | undefined = undefined;

  let tileLayer: TileLayer;

  const map = getMapContext();

  onMount(() => {
    tileLayer = new TileLayer(urlTemplate, options).addTo(map);
  });

  onDestroy(() => {
    tileLayer?.remove();
  });
</script>
