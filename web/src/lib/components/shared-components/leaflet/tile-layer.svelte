<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { TileLayer, type TileLayerOptions } from 'leaflet';
	import { getMapContext } from './map.svelte';

	export let urlTemplate: string;
	export let options: TileLayerOptions | undefined = undefined;
	export let allowDarkMode = false;

	let tileLayer: TileLayer;

	const map = getMapContext();

	onMount(() => {
		tileLayer = new TileLayer(urlTemplate, {
			className: allowDarkMode ? 'leaflet-layer-dynamic' : 'leaflet-layer',
			...options
		}).addTo(map);
	});

	onDestroy(() => {
		if (tileLayer) tileLayer.remove();
	});
</script>

<style>
	:global(.leaflet-layer-dynamic) {
		filter: brightness(100%) contrast(100%) saturate(80%);
	}

	:global(.dark .leaflet-layer-dynamic) {
		filter: invert(100%) brightness(130%) saturate(0%);
	}
</style>
