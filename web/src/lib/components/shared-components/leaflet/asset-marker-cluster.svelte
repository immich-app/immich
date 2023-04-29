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
	import { AssetResponseDto } from '@api';
	import { Marker, Icon } from 'leaflet';

	export let assets: AssetResponseDto[];

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

		for (let asset of assets) {
			if (asset.exifInfo) {
				const lat = asset.exifInfo.latitude;
				const lon = asset.exifInfo.longitude;

				if (lat && lon) {
					const icon = new Icon({
						iconUrl: `/api/asset/thumbnail/${asset.id}?format=WEBP`,
						iconRetinaUrl: `/api/asset/thumbnail/${asset.id}?format=WEBP`,
						iconSize: [60, 60],
						iconAnchor: [12, 41],
						popupAnchor: [1, -34],
						tooltipAnchor: [16, -28],
						shadowSize: [41, 41]
					});

					const marker = new Marker([lat, lon], {
						icon,
						alt: ''
					});

					cluster.addLayer(marker);
				}
			}
		}

		map.addLayer(cluster);
	});

	onDestroy(() => {
		if (cluster) cluster.remove();
	});
</script>

{#if cluster}
	<slot />
{/if}

