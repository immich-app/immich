<script lang="ts" context="module">
	import { createContext } from '$lib/utils/context';

	// @ts-ignore
	const { get: getContext, set: setClusterContext } = createContext<() => L.MarkerClusterGroup>();

	export const getClusterContext = () => {
		return getContext()();
	};
</script>

<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import 'leaflet.markercluster';
	import { getMapContext } from './map.svelte';
	import { MapMarkerResponseDto, getFileUrl } from '@api';
	import L from 'leaflet';
	import { createEventDispatcher } from 'svelte';

	class AssetMarker extends L.Marker {
		marker: MapMarkerResponseDto;

		constructor(marker: MapMarkerResponseDto) {
			super([marker.lat, marker.lon], {
				icon: new L.Icon({
					iconUrl: getFileUrl(marker.id, true),
					iconRetinaUrl: getFileUrl(marker.id, true),
					iconSize: [60, 60],
					iconAnchor: [12, 41],
					popupAnchor: [1, -34],
					tooltipAnchor: [16, -28],
					shadowSize: [41, 41]
				}),
			});

			this.marker = marker;
		}

		getAssetId(): string {
			return this.marker.id;
		}
	}

	const dispatch = createEventDispatcher<{ view: { assets: string[] } }>();

	export let markers: MapMarkerResponseDto[];

	const map = getMapContext();
	// @ts-ignore
	let cluster: L.MarkerClusterGroup;

	setClusterContext(() => cluster);

	onMount(() => {
		// @ts-ignore
		cluster = new L.MarkerClusterGroup({
			showCoverageOnHover: false,
			zoomToBoundsOnClick: false,
			spiderfyOnMaxZoom: false,
			maxClusterRadius: 30,
			spiderLegPolylineOptions: { opacity: 0 },
			spiderfyDistanceMultiplier: 3
		});

		// @ts-ignore
		cluster.on('clusterclick', (event) => {
			// @ts-ignore
			const ids = event.layer.getAllChildMarkers().map(marker => marker.getAssetId());
			dispatch('view', { assets: ids });
		});

		for (let marker of markers) {
			const leafletMarker = new AssetMarker(marker);

			leafletMarker.on('click', () => {
				dispatch('view', { assets: [marker.id] });
			});

			cluster.addLayer(leafletMarker);
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

