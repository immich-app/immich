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
	import { Map, type LatLngExpression } from 'leaflet';
	import 'leaflet/dist/leaflet.css';

	export let latlng: LatLngExpression;
	export let zoom: number;
	let container: HTMLDivElement;
	let map: Map;

	setMapContext(() => map);

	onMount(() => {
		if (browser) {
			map = new Map(container);
		}
	});

	onDestroy(() => {
		if (map) map.remove();
	});

	$: if (map) map.setView(latlng, zoom);
</script>

<div bind:this={container} class="w-full h-full">
	{#if map}
		<slot />
	{/if}
</div>
