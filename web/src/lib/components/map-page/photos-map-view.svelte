<script lang="ts">
	import { onMount } from 'svelte';
	import { api, MapMarkerResponseDto, AssetTypeEnum } from '@api';
	import { handleError } from '$lib/utils/handle-error';

	import { DomUtil, marker } from 'leaflet';
	import Cluster from 'leaflet.markercluster';

	type Leaflet = typeof import('leaflet');
	type LeafletMap = import('leaflet').Map;

	let map: LeafletMap;
	let leaflet: Leaflet;

	let index = 0;
	let maxIndex = 0;

	let assetInfos: MapMarkerResponseDto[] = [];
	onMount(async () => {
		try {
			const { data: assets } = await api.assetApi.getAllMapMarkerAssets();
			assetInfos = assets;
			await drawMap();
			await drawMarkers();
		} catch {
			handleError(Error, 'Unable to load map');
		}
	});

	async function drawMap() {
		if (!leaflet) {
			leaflet = await import('leaflet');
		}

		if (!map) {
			map = leaflet.map('map');
			leaflet
				.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
					attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
				})
				.addTo(map);
		}

		map.setView([0, 0], 2);
	}

	async function drawMarkers() {
		var markers = leaflet.markerClusterGroup({
			animate: true,
			zoomToBoundsOnClick: false,
			spiderfyOnMaxZoom: false,
			iconCreateFunction: function (cluster) {
				var childCount = cluster.getChildCount();
				var c = ' marker-cluster-';
				if (50 < 2) {
					c += 'small';
				} else if (childCount < 1000) {
					c += 'medium';
				} else {
					c += 'large';
				}

				return leaflet.divIcon({
					html: '' + cluster.getChildCount(),
					className: 'marker-cluster' + c,
					iconSize: leaflet.point(40, 40)
				});
			}
		});

		assetInfos.forEach(async (asset) => {
			if (asset.latitude != null && asset.longitude != null && asset.type == AssetTypeEnum.Image) {
				markers.addLayer(
					leaflet
						.marker([asset.latitude, asset.longitude], { id: asset.id })
						.on('click', function (event) {
							var img = leaflet.DomUtil.create('img');
							img.src = '/api/asset/file/' + event.sourceTarget.options.id;
							event.sourceTarget
								.bindPopup(img, { className: 'customPopup', minWidth: 300, maxWidth: 300 })
								.openPopup();
						})
						.on('popupclose', function (event) {
							event.sourceTarget.unbindPopup().closePopup();
						})
				);
			}
		});

		markers
			.on('clusterclick', function (event) {
				index = 0;
				maxIndex = event.sourceTarget.getAllChildMarkers().length - 1;

				var img = leaflet.DomUtil.create('img');
				img.src = '/api/asset/file/' + event.sourceTarget.getAllChildMarkers()[index].options.id;

				var pageNumber = leaflet.DomUtil.create('p');
				pageNumber.innerHTML = index + 1 + '/' + (maxIndex + 1);
				pageNumber.className = 'pageNumberFooter';

				var btnLeft = leaflet.DomUtil.create('btn');
				btnLeft.innerHTML =
					'<button \
							class="rounded-full p-3 hover:bg-gray-500 hover:text-gray-700 text-gray-500 mx-4 btnLeft" \
					> <\
					</button>';
				btnLeft.onclick = function () {
					if (index) {
						index--;
					} else {
						index = maxIndex;
					}
					pageNumber.innerHTML = index + 1 + '/' + (maxIndex + 1);
					img.src = '/api/asset/file/' + event.sourceTarget.getAllChildMarkers()[index].options.id;
				};

				var btnRight = leaflet.DomUtil.create('btn');
				btnRight.innerHTML =
					'<button \
							class="rounded-full p-3 hover:bg-gray-500 hover:text-gray-700 text-gray-500 mx-4 btnRight" \
					> >\
					</button>';
				btnRight.onclick = function () {
					if (index != maxIndex) {
						index++;
					} else {
						index = 0;
					}
					pageNumber.innerHTML = index + 1 + '/' + (maxIndex + 1);
					img.src = '/api/asset/file/' + event.sourceTarget.getAllChildMarkers()[index].options.id;
				};

				var popupDiv = leaflet.DomUtil.create('Div');
				popupDiv.append(img);
				popupDiv.append(pageNumber);
				popupDiv.append(btnLeft);
				popupDiv.append(btnRight);

				event.sourceTarget
					.bindPopup(popupDiv, { className: 'customPopup', minWidth: 300, maxWidth: 300 })
					.openPopup();
			})
			.addTo(map);
	}
</script>

<div class="map">
	<div class="h-full w-full" id="map" />
</div>

<link
	rel="stylesheet"
	href="https://unpkg.com/leaflet@1.6.0/dist/leaflet.css"
	integrity="sha512-xwE/Az9zrjBIphAcBb3F6JVqxf46+CDLwfLMHloNu6KEQCAWi6HcDUbeOfBIptF7tcCzusKFjFw2yuvEpDL9wQ=="
	crossorigin=""
/>

<style global>
	.map :global(.marker-text) {
		width: 100%;
		text-align: center;
		font-weight: 600;
		background-color: #444;
		color: #eee;
		border-radius: 0.5rem;
	}

	.map :global(.map-marker) {
		width: 30px;
		transform: translateX(-50%) translateY(-25%);
	}

	.customPopup .leaflet-popup-content .btnLeft {
		color: black;
		position: absolute;
		bottom: 15px;
		left: 7px;
		font-size: 15px;
		font-weight: bold;
	}
	.customPopup .leaflet-popup-content .btnRight {
		color: black;
		position: absolute;
		bottom: 15px;
		right: 7px;
		font-size: 15px;
		font-weight: bold;
	}
	.customPopup .leaflet-popup-content .pageNumberFooter {
		color: black;
		bottom: 10px;
		left: 0%;
		text-align: center;
		font-size: 20px;
		width: 100%;
	}

	.mycluster {
		width: 40px;
		height: 40px;
		background-color: greenyellow;
		text-align: center;
		font-size: 24px;
		border-radius: 20px;
	}

	.marker-cluster-small {
		width: 40px;
		height: 40px;
		text-align: center;
		font-size: 24px;
		border-radius: 20px;
		background-color: rgba(218, 94, 94, 0.8);
	}

	.marker-cluster-medium {
		width: 40px;
		height: 40px;
		text-align: center;
		font-size: 24px;
		border-radius: 20px;
		background-color: rgba(241, 211, 87, 0.8);
	}

	.marker-cluster-large {
		width: 40px;
		height: 40px;
		text-align: center;
		font-size: 24px;
		border-radius: 20px;
		background-color: rgba(253, 156, 115, 0.8);
	}
</style>
