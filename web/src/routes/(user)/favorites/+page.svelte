<script lang="ts">
	import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
	import CreateSharedLink from '$lib/components/photos-page/actions/create-shared-link.svelte';
	import RemoveFavorite from '$lib/components/photos-page/actions/remove-favorite.svelte';
	import AssetSelectControlBar from '$lib/components/photos-page/asset-select-control-bar.svelte';
	import EmptyPlaceholder from '$lib/components/shared-components/empty-placeholder.svelte';
	import GalleryViewer from '$lib/components/shared-components/gallery-viewer/gallery-viewer.svelte';
	import { handleError } from '$lib/utils/handle-error';
	import { api, AssetResponseDto } from '@api';
	import { onMount } from 'svelte';
	import Error from '../../+error.svelte';
	import type { PageData } from './$types';

	let favorites: AssetResponseDto[] = [];
	let selectedAssets: Set<AssetResponseDto> = new Set();

	export let data: PageData;

	$: isMultiSelectionMode = selectedAssets.size > 0;

	onMount(async () => {
		try {
			const { data: assets } = await api.assetApi.getAllAssets(true, undefined);
			favorites = assets;
		} catch {
			handleError(Error, 'Unable to load favorites');
		}
	});

	const onAssetDelete = (assetId: string) => {
		favorites = favorites.filter((a) => a.id !== assetId);
	};
</script>

<!-- Multiselection mode app bar -->
{#if isMultiSelectionMode}
	<AssetSelectControlBar assets={selectedAssets} clearSelect={() => (selectedAssets = new Set())}>
		<CreateSharedLink />
		<RemoveFavorite onAssetFavorite={(asset) => onAssetDelete(asset.id)} />
	</AssetSelectControlBar>
{/if}

<UserPageLayout user={data.user} hideNavbar={isMultiSelectionMode}>
	<section>
		<!-- Empty Message -->
		{#if favorites.length === 0}
			<EmptyPlaceholder
				text="Add favorites to quickly find your best pictures and videos"
				alt="Empty favorites"
			/>
		{/if}

		<GalleryViewer assets={favorites} bind:selectedAssets viewFrom="favorites-page" />
	</section>
</UserPageLayout>
