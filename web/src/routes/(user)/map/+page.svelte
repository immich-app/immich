<script lang="ts">
	import type { PageData } from '../map/$types';
	import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
	import { Map, TileLayer, AssetMarkerCluster } from '$lib/components/shared-components/leaflet';
	import Portal from '$lib/components/shared-components/portal/portal.svelte';
	import AssetViewer from '$lib/components/asset-viewer/asset-viewer.svelte';
	import {
		assetInteractionStore,
		isViewingAssetStoreState,
		viewingAssetStoreState,
		
	} from '$lib/stores/asset-interaction.store';
	import { colorTheme } from '$lib/stores/preferences.store';

	export let data: PageData;

	let initialMapCenter: [number, number] = [48, 11];

	if (data.mapMarkers.length) {
		let firstMarker = data.mapMarkers[0];
		initialMapCenter = [firstMarker.lat, firstMarker.lon];
	}

	let viewingAssets: string[] = [];
	let viewingAssetCursor = 0;

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
</script>

<UserPageLayout user={data.user} title={data.meta.title}>
	<div slot="buttons">

	</div>

	<div class="h-[90%] w-full">
		<Map latlng={initialMapCenter} zoom={7}>
			{#if $colorTheme === 'dark'}
				<TileLayer
					urlTemplate={'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}
					options={{
						filter: ['invert:100%','bright:127%','saturate:0%'],
						attribution:
							'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
					}}
				/>
			{:else}
				<TileLayer
					urlTemplate={'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}
					options={{
						filter: ['bright:101%','contrast:101%','saturate:79%'],
						attribution:
							'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
					}}
				/>
			{/if}

			<AssetMarkerCluster markers={data.mapMarkers} on:view={event => onViewAssets(event.detail.assets)} />
		</Map>
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

