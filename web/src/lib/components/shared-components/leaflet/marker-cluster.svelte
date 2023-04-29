<script lang="ts" context="module">
	import { createContext } from '$lib/utils/context';

	const { get: getContext, set: setClusterContext } = createContext<() => L.MarkerClusterGroup>();

	export const getClusterContext = () => {
		return getContext()();
	};
</script>

<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import 'leaflet.markercluster';
	import { getMapContext } from './map.svelte';

	const map = getMapContext();
	let cluster: L.MarkerClusterGroup;

	setClusterContext(() => cluster);

	onMount(() => {
		cluster = new L.MarkerClusterGroup({
			showCoverageOnHover: false,
			zoomToBoundsOnClick: true,
			spiderfyOnMaxZoom: true,
			maxClusterRadius: 30,
			spiderLegPolylineOptions: { opacity: 0 }
		});
		map.addLayer(cluster);
	});

	onDestroy(() => {
		if (cluster) cluster.remove();
	});
</script>

{#if cluster}
	<slot />
{/if}

