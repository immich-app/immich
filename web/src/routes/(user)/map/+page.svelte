<script lang="ts">
	import type { PageData } from '../map/$types';
	import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
	import Portal from '$lib/components/shared-components/portal/portal.svelte';
	import AssetViewer from '$lib/components/asset-viewer/asset-viewer.svelte';
	import {
		assetInteractionStore,
		isViewingAssetStoreState,
		viewingAssetStoreState
	} from '$lib/stores/asset-interaction.store';

	export let data: PageData;

	let initialMapCenter: [number, number] = [48, 11];

	$: {
		if (data.mapMarkers.length) {
			let firstMarker = data.mapMarkers[0];
			initialMapCenter = [firstMarker.lat, firstMarker.lon];
		}
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
	<div slot="buttons" />

	<div class="h-[90%] w-full">
		{#await import('$lib/components/shared-components/leaflet') then { Map, TileLayer, AssetMarkerCluster }}
			<Map latlng={initialMapCenter} zoom={7}>
				<TileLayer
					allowDarkMode={true}
					urlTemplate={'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}
					options={{
						attribution:
							'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
					}}
				/>
				<AssetMarkerCluster
					markers={data.mapMarkers}
					on:view={(event) => onViewAssets(event.detail.assets)}
				/>
			</Map>
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
