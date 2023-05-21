<script lang="ts">
	import AssetViewer from '$lib/components/asset-viewer/asset-viewer.svelte';
	import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
	import MapSettingsModal from '$lib/components/map-page/map-settings-modal.svelte';
	import Portal from '$lib/components/shared-components/portal/portal.svelte';
	import {
		assetInteractionStore,
		isViewingAssetStoreState,
		viewingAssetStoreState
	} from '$lib/stores/asset-interaction.store';
	import { mapSettings } from '$lib/stores/preferences.store';
	import { MapMarkerResponseDto, api } from '@api';
	import { onDestroy, onMount } from 'svelte';
	import Cog from 'svelte-material-icons/Cog.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	let mapMarkersPromise: Promise<MapMarkerResponseDto[]>;
	let abortController = new AbortController();
	let viewingAssets: string[] = [];
	let viewingAssetCursor = 0;
	let showSettingsModal = false;

	onMount(() => {
		mapMarkersPromise = loadMapMarkers();
	});

	onDestroy(() => {
		abortController.abort();
		assetInteractionStore.clearMultiselect();
		assetInteractionStore.setIsViewingAsset(false);
	});

	async function loadMapMarkers() {
		const { data } = await api.assetApi.getMapMarkers($mapSettings.onlyFavorites || undefined, {
			signal: abortController.signal
		});
		return data;
	}

	function onViewAssets(assets: string[]) {
		assetInteractionStore.setViewingAssetId(assets[0]);
		viewingAssets = assets;
		viewingAssetCursor = 0;
	}

	function navigateNext() {
		if (viewingAssetCursor < viewingAssets.length - 1) {
			assetInteractionStore.setViewingAssetId(viewingAssets[++viewingAssetCursor]);
		}
	}

	function navigatePrevious() {
		if (viewingAssetCursor > 0) {
			assetInteractionStore.setViewingAssetId(viewingAssets[--viewingAssetCursor]);
		}
	}

	function getMapCenter(mapMarkers: MapMarkerResponseDto[]): [number, number] {
		const marker = mapMarkers[0];
		if (marker) {
			return [marker.lat, marker.lon];
		}

		return [48, 11];
	}
</script>

<UserPageLayout user={data.user} title={data.meta.title}>
	<div class="h-full w-full isolate">
		{#await import('$lib/components/shared-components/leaflet') then { Map, TileLayer, AssetMarkerCluster, Control }}
			{#await mapMarkersPromise then mapMarkers}
				<Map
					center={getMapCenter(mapMarkers)}
					zoom={7}
					allowDarkMode={$mapSettings.allowDarkMode}
					options={{
						maxBounds: [
							[-90, -180],
							[90, 180]
						],
						minZoom: 3
					}}
				>
					<TileLayer
						urlTemplate={'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}
						options={{
							attribution:
								'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
						}}
					/>
					<AssetMarkerCluster
						markers={mapMarkers}
						on:view={(event) => onViewAssets(event.detail.assets)}
					/>
					<Control>
						<button
							class="flex justify-center items-center bg-white text-black/70 w-8 h-8 font-bold rounded-sm border-2 border-black/20 hover:bg-gray-50 focus:bg-gray-50"
							title="Open map settings"
							on:click={() => (showSettingsModal = true)}
						>
							<Cog size="100%" class="p-1" />
						</button>
					</Control>
				</Map>
			{/await}
		{/await}
	</div>
</UserPageLayout>

<Portal target="body">
	{#if $isViewingAssetStoreState}
		<AssetViewer
			asset={$viewingAssetStoreState}
			showNavigation={viewingAssets.length > 1}
			on:navigate-next={navigateNext}
			on:navigate-previous={navigatePrevious}
			on:close={() => {
				assetInteractionStore.setIsViewingAsset(false);
			}}
		/>
	{/if}
</Portal>

{#if showSettingsModal}
	<MapSettingsModal
		settings={{ ...$mapSettings }}
		on:close={() => (showSettingsModal = false)}
		on:save={async ({ detail }) => {
			const shouldUpdate = detail.onlyFavorites !== $mapSettings.onlyFavorites;
			showSettingsModal = false;
			$mapSettings = detail;

			if (shouldUpdate) {
				const markers = await loadMapMarkers();
				mapMarkersPromise = Promise.resolve(markers);
			}
		}}
	/>
{/if}
