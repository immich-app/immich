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
	import { AssetResponseDto, getFileUrl } from '@api';
	import { Marker, Icon } from 'leaflet';
	import { assetInteractionStore } from '$lib/stores/asset-interaction.store';

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
			spiderLegPolylineOptions: { opacity: 0 },
			spiderfyDistanceMultiplier: 3
		});

		for (let asset of assets) {
			if (!asset.exifInfo) continue;

			const lat = asset.exifInfo.latitude;
			const lon = asset.exifInfo.longitude;

			if (!lat || !lon) continue;

			const icon = new Icon({
				iconUrl: getFileUrl(asset.id, true),
				iconRetinaUrl: getFileUrl(asset.id, true),
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

			marker.on('click', () => {
				assetInteractionStore.setViewingAsset(asset);
			});

			cluster.addLayer(marker);
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

