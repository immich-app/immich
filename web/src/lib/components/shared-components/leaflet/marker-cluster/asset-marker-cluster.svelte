<script lang="ts" context="module">
	import { createContext } from '$lib/utils/context';
	import { MarkerClusterGroup } from 'leaflet';

	const { get: getContext, set: setClusterContext } = createContext<() => MarkerClusterGroup>();

	export const getClusterContext = () => {
		return getContext()();
	};
</script>

<script lang="ts">
	import type { MapMarkerResponseDto } from '@api';
	import { DivIcon, LeafletEvent, LeafletMouseEvent, MarkerCluster, Point } from 'leaflet';
	import 'leaflet.markercluster';
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';
	import { getMapContext } from '../map.svelte';
	import AssetMarker from './asset-marker';
	import './asset-marker-cluster.css';

	export let markers: MapMarkerResponseDto[];
	export let spiderfyLimit = 10;
	let cluster: MarkerClusterGroup;

	const map = getMapContext();
	const dispatch = createEventDispatcher<{
		view: { assetIds: string[]; activeAssetIndex: number };
	}>();

	setClusterContext(() => cluster);

	onMount(() => {
		cluster = new MarkerClusterGroup({
			showCoverageOnHover: false,
			zoomToBoundsOnClick: false,
			spiderfyOnMaxZoom: false,
			maxClusterRadius: (zoom) => 80 - zoom * 2,
			spiderLegPolylineOptions: { opacity: 0 },
			spiderfyDistanceMultiplier: 3,
			iconCreateFunction: (options) => {
				const childCount = options.getChildCount();
				const iconSize = childCount > spiderfyLimit ? 45 : 40;

				return new DivIcon({
					html: `<div class="marker-cluster-icon">${childCount}</div>`,
					className: '',
					iconSize: new Point(iconSize, iconSize)
				});
			}
		});

		cluster.on('clusterclick', (event: LeafletEvent) => {
			const markerCluster: MarkerCluster = event.sourceTarget;
			const childCount = markerCluster.getChildCount();

			if (childCount > spiderfyLimit) {
				const markers = markerCluster.getAllChildMarkers() as AssetMarker[];
				onView(markers, markers[0].id);
			} else {
				markerCluster.spiderfy();
			}
		});

		cluster.on('click', (event: LeafletMouseEvent) => {
			const marker: AssetMarker = event.sourceTarget;
			const markerCluster = getClusterByMarker(marker);
			const markers = markerCluster
				? (markerCluster.getAllChildMarkers() as AssetMarker[])
				: [marker];

			onView(markers, marker.id);
		});

		map.addLayer(cluster);
	});

	/* eslint-disable-next-line  @typescript-eslint/no-explicit-any */
	const getClusterByMarker = (marker: any): MarkerCluster | undefined => {
		const mapZoom = map.getZoom();

		while (marker && marker._zoom !== mapZoom) {
			marker = marker.__parent;
		}

		return marker;
	};

	const onView = (markers: AssetMarker[], activeAssetId: string) => {
		const assetIds = markers.map((marker) => marker.id);
		const activeAssetIndex = assetIds.indexOf(activeAssetId) || 0;
		dispatch('view', { assetIds, activeAssetIndex });
	};

	$: if (cluster) {
		const leafletMarkers = markers.map((marker) => new AssetMarker(marker));

		cluster.clearLayers();
		cluster.addLayers(leafletMarkers);
	}

	onDestroy(() => {
		if (cluster) cluster.remove();
	});
</script>
