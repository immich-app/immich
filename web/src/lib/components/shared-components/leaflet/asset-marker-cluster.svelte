<script lang="ts" context="module">
	import { createContext } from '$lib/utils/context';
	import { Icon, LeafletEvent, Marker, MarkerClusterGroup } from 'leaflet';

	const { get: getContext, set: setClusterContext } = createContext<() => MarkerClusterGroup>();

	export const getClusterContext = () => {
		return getContext()();
	};
</script>

<script lang="ts">
	import { MapMarkerResponseDto, api } from '@api';
	import 'leaflet.markercluster';
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';
	import './asset-marker-cluster.css';
	import { getMapContext } from './map.svelte';

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
					shadowSize: [41, 41],
					className: 'asset-marker-icon'
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

		cluster.on('clustermouseover', (event: LeafletEvent) => {
			if (event.sourceTarget.getChildCount() <= 10) {
				event.sourceTarget.spiderfy();
			}
		});

		cluster.on('clustermouseout', (event: LeafletEvent) => {
			event.sourceTarget.unspiderfy();
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
