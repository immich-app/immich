<script lang="ts">
	import 'leaflet.markercluster';
	import { MarkerClusterGroup, Marker, Icon, LeafletEvent } from 'leaflet';
	import { onDestroy, onMount } from 'svelte';
	import { getMapContext } from './map.svelte';
	import { MapMarkerResponseDto, api } from '@api';
	import { createEventDispatcher } from 'svelte';

	class AssetMarker extends Marker {
		marker: MapMarkerResponseDto;

		constructor(marker: MapMarkerResponseDto) {
			const markerAssetId = api.getMarkerAssetId(marker);

			super(api.getMarkerLatLon(marker), {
				alt: 'Loading...',
				icon: new Icon({
					className: 'marker-cluster-asset-marker',
					iconUrl: api.getAssetThumbnailUrl(markerAssetId),
					iconRetinaUrl: api.getAssetThumbnailUrl(markerAssetId),
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
			return api.getMarkerAssetId(this.marker);
		}
	}

	const dispatch = createEventDispatcher<{ view: { assets: string[] } }>();

	let cluster: MarkerClusterGroup;

	const map = getMapContext();

	function setUpCluster(markers: MapMarkerResponseDto[]) {
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
				.map((marker: AssetMarker) => marker.getAssetId())
				.filter((id: string) => id.length > 0);

			if (ids.length > 0) {
				dispatch('view', { assets: ids });
			}
		});

		for (let marker of markers) {
			const leafletMarker = new AssetMarker(marker);

			leafletMarker.on('click', () => {
				const id = leafletMarker.getAssetId();

				if (id.length > 0) {
					dispatch('view', { assets: [id] });
				}
			});

			cluster.addLayer(leafletMarker);
		}

		map.addLayer(cluster);
	}

	onMount(() => setUpCluster(markers));

	export let markers: MapMarkerResponseDto[];
	$: {
		if (cluster) {
			cluster.remove();
			setUpCluster(markers);
		}
	}

	onDestroy(() => {
		if (cluster) cluster.remove();
	});
</script>

<style>
	:global(.marker-cluster-asset-marker) {
		border-radius: 25%;
		background-color: rgba(236, 237, 246, 0.8);
		line-height: 60px;
		text-align: center;
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
