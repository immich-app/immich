<script lang="ts" context="module">
	import { createContext } from '$lib/utils/context';
	import { MarkerClusterGroup, Marker, Icon, LeafletEvent } from 'leaflet';

	const { get: getContext, set: setClusterContext } = createContext<() => MarkerClusterGroup>();

	export const getClusterContext = () => {
		return getContext()();
	};
</script>

<script lang="ts">
	import 'leaflet.markercluster';
	import { onDestroy, onMount } from 'svelte';
	import { getMapContext } from './map.svelte';
	import { MapMarkerResponseDto, api } from '@api';
	import { createEventDispatcher } from 'svelte';

	class AssetMarker extends Marker {
		marker: MapMarkerResponseDto;

		constructor(marker: MapMarkerResponseDto) {
			super([marker.lat, marker.lon], {
				icon: new Icon({
					iconUrl: api.getAssetThumbnailUrl(marker.id),
					iconRetinaUrl: api.getAssetThumbnailUrl(marker.id),
					iconSize: [60, 60],
					iconAnchor: [12, 41],
					popupAnchor: [1, -34],
					tooltipAnchor: [16, -28],
					shadowSize: [41, 41]
				})
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

	let cluster: MarkerClusterGroup;

	setClusterContext(() => cluster);

	onMount(() => {
		cluster = new MarkerClusterGroup({
			showCoverageOnHover: false,
			zoomToBoundsOnClick: false,
			spiderfyOnMaxZoom: false,
			maxClusterRadius: 30,
			spiderLegPolylineOptions: { opacity: 0 },
			spiderfyDistanceMultiplier: 3
		});

		cluster.on('clusterclick', (event: LeafletEvent) => {
			const ids = event.sourceTarget
				.getAllChildMarkers()
				.map((marker: AssetMarker) => marker.getAssetId());
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

<style>
	:global(.leaflet-marker-icon) {
		border-radius: 25%;
	}

	:global(.marker-cluster) {
		background-clip: padding-box;
		border-radius: 20px;
	}

	:global(.marker-cluster div) {
		width: 40px;
		height: 40px;
		margin-left: 5px;
		margin-top: 5px;

		text-align: center;
		border-radius: 20px;
		font-weight: bold;

		background-color: rgb(236, 237, 246);
		color: rgb(69, 80, 169);
	}

	:global(.marker-cluster span) {
		line-height: 40px;
	}
</style>
