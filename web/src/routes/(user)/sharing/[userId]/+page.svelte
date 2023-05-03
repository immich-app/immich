<script lang="ts">
	import type { PageData } from './$types';
	import { api, AssetResponseDto } from '@api';
	import GalleryViewer from '$lib/components/shared-components/gallery-viewer/gallery-viewer.svelte';
	import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
	import { handleError } from '$lib/utils/handle-error';
	import { onMount } from 'svelte';

	export let data: PageData;
	let partnerAssets: AssetResponseDto[] = [];

	onMount(async () => {
		try {
			const { data: assets } = await api.assetApi.getUserAssets(data.partner.id);
			partnerAssets = assets;
		} catch {
			handleError(Error, 'Unable to load assets');
		}
	});
</script>

<UserPageLayout user={data.user} title="{data.partner.firstName} {data.partner.lastName}">
	<GalleryViewer assets={partnerAssets} disableAssetSelect viewFrom="partner-sharing-page" />
</UserPageLayout>
