<script lang="ts">
	import type { PageData } from '../map/$types';
	import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
	import { Map, TileLayer, AssetMarkerCluster } from '$lib/components/shared-components/leaflet';
	import Portal from '$lib/components/shared-components/portal/portal.svelte';
	import AssetViewer from '$lib/components/asset-viewer/asset-viewer.svelte';
	import {
		assetInteractionStore,
		isViewingAssetStoreState,
		viewingAssetStoreState
	} from '$lib/stores/asset-interaction.store';

	export let data: PageData;
</script>

<UserPageLayout user={data.user} title={data.meta.title}>
	<div slot="buttons">

	</div>

	<div class="h-[90%] w-full">
		<Map latlng={[48, 11]} zoom={6}>
			<TileLayer
				urlTemplate={'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}
				options={{
					attribution:
						'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
				}}
			/>
			<AssetMarkerCluster assets={data.assets} />
		</Map>
	</div>

</UserPageLayout>

<Portal target="body">
	{#if $isViewingAssetStoreState}
		<AssetViewer
			asset={$viewingAssetStoreState}
			showNavigation={false}
			on:close={() => {
				assetInteractionStore.setIsViewingAsset(false);
			}}
		/>
	{/if}
</Portal>

