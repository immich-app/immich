<script lang="ts" context="module">
	type TileLayerFilterOptions = TileLayerOptions & { filter: string[] };
</script>

<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import 'leaflet.tilelayer.colorfilter';
	import { TileLayer, type TileLayerOptions } from 'leaflet';
	import { getMapContext } from './map.svelte';
	import L from 'leaflet';

	export let urlTemplate: string;
	export let options: TileLayerFilterOptions | undefined = undefined;
	let tileLayer: TileLayer;

	const map = getMapContext();

	onMount(() => {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		tileLayer = new L.tileLayer.colorFilter(urlTemplate, options).addTo(map);
	});

	onDestroy(() => {
		if (tileLayer) tileLayer.remove();
	});
</script>
