<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import 'leaflet.tilelayer.colorfilter';
	import { TileLayer, type TileLayerOptions } from 'leaflet';
	import { getMapContext } from './map.svelte';

	export let urlTemplate: string;
	export let options: any | undefined = undefined;
	let tileLayer: TileLayer;

	const map = getMapContext();

	onMount(() => {
		tileLayer = new L.tileLayer.colorFilter(urlTemplate, options).addTo(map);
	});

	onDestroy(() => {
		if (tileLayer) tileLayer.remove();
	});
</script>
