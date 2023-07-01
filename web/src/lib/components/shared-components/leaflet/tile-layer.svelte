<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { TileLayer, type TileLayerOptions } from 'leaflet';
  import { getMapContext } from './map.svelte';

  export let urlTemplate: string;
  export let options: TileLayerOptions | undefined = undefined;

  let tileLayer: TileLayer;

  const map = getMapContext();

  onMount(() => {
    tileLayer = new TileLayer(urlTemplate, options).addTo(map);
  });

  onDestroy(() => {
    if (tileLayer) tileLayer.remove();
  });
</script>
