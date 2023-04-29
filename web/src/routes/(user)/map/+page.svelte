<script lang="ts">
	import type { PageData } from '../map/$types';
	import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
	import { Map, TileLayer, AssetMarkerCluster } from '$lib/components/shared-components/leaflet';

	export let data: PageData;
</script>

<UserPageLayout user={data.user} title={data.meta.title}>
	<div slot="buttons">

	</div>

	<div class="h-full w-full">
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

