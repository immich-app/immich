<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { Marker, Icon, type LatLngExpression, type Content } from 'leaflet';
	import { getClusterContext } from './marker-cluster.svelte';
	import { AssetResponseDto } from '@api';

	export let asset: AssetResponseDto;
	let marker: Marker;

	const defaultIcon = new Icon({
		iconUrl: `/api/asset/thumbnail/${asset.id}?format=WEBP`,
		iconRetinaUrl: `/api/asset/thumbnail/${asset.id}?format=WEBP`,

		// Default values from Leaflet
		iconSize: [40, 40],
		iconAnchor: [12, 41],
		popupAnchor: [1, -34],
		tooltipAnchor: [16, -28],
		shadowSize: [41, 41]
	});
	const cluster = getClusterContext();

	onMount(() => {
		if (asset.exifInfo) {
			const lat = asset.exifInfo.latitude;
			const lon = asset.exifInfo.longitude;

			if (lat && lon) {
				marker = new Marker([lat, lon], {
					icon: defaultIcon,
					alt: ''
				});

				cluster.addLayer(marker);
			}
		}
	});

	onDestroy(() => {
		if (marker) marker.remove();
	});

	$: if (marker) {
		if (asset.exifInfo) {
			const lat = asset.exifInfo.latitude;
			const lon = asset.exifInfo.longitude;

			if (lat && lon) {
				marker.setLatLng([lat, lon]);
			}
		}
	}
</script>
