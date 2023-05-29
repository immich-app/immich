<script lang="ts">
	import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
	import AddToAlbum from '$lib/components/photos-page/actions/add-to-album.svelte';
	import ArchiveAction from '$lib/components/photos-page/actions/archive-action.svelte';
	import CreateSharedLink from '$lib/components/photos-page/actions/create-shared-link.svelte';
	import DeleteAssets from '$lib/components/photos-page/actions/delete-assets.svelte';
	import DownloadAction from '$lib/components/photos-page/actions/download-action.svelte';
	import FavoriteAction from '$lib/components/photos-page/actions/favorite-action.svelte';
	import AssetSelectContextMenu from '$lib/components/photos-page/asset-select-context-menu.svelte';
	import AssetSelectControlBar from '$lib/components/photos-page/asset-select-control-bar.svelte';
	import EmptyPlaceholder from '$lib/components/shared-components/empty-placeholder.svelte';
	import GalleryViewer from '$lib/components/shared-components/gallery-viewer/gallery-viewer.svelte';
	import { archivedAsset } from '$lib/stores/archived-asset.store';
	import { handleError } from '$lib/utils/handle-error';
	import { api, AssetResponseDto } from '@api';
	import { onMount } from 'svelte';
	import DotsVertical from 'svelte-material-icons/DotsVertical.svelte';
	import Plus from 'svelte-material-icons/Plus.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	let selectedAssets: Set<AssetResponseDto> = new Set();
	$: isMultiSelectionMode = selectedAssets.size > 0;
	$: isAllFavorite = Array.from(selectedAssets).every((asset) => asset.isFavorite);

	onMount(async () => {
		try {
			const { data: assets } = await api.assetApi.getAllAssets({ isArchived: true });
			$archivedAsset = assets;
		} catch {
			handleError(Error, 'Unable to load archived assets');
		}
	});

	const onAssetDelete = (assetId: string) => {
		$archivedAsset = $archivedAsset.filter((a) => a.id !== assetId);
	};
</script>

<UserPageLayout user={data.user} hideNavbar={isMultiSelectionMode} title={data.meta.title}>
	<!-- Empty Message -->
	{#if $archivedAsset.length === 0}
		<EmptyPlaceholder
			text="Archive photos and videos to hide them from your Photos view"
			alt="Empty archive"
		/>
	{/if}

	<svelte:fragment slot="header">
		{#if isMultiSelectionMode}
			<AssetSelectControlBar
				assets={selectedAssets}
				clearSelect={() => (selectedAssets = new Set())}
			>
				<ArchiveAction unarchive onAssetArchive={(asset) => onAssetDelete(asset.id)} />
				<CreateSharedLink />
				<AssetSelectContextMenu icon={Plus} title="Add">
					<AddToAlbum />
					<AddToAlbum shared />
				</AssetSelectContextMenu>
				<DeleteAssets {onAssetDelete} />
				<AssetSelectContextMenu icon={DotsVertical} title="Add">
					<DownloadAction menuItem />
					<FavoriteAction menuItem removeFavorite={isAllFavorite} />
				</AssetSelectContextMenu>
			</AssetSelectControlBar>
		{/if}
	</svelte:fragment>

	<GalleryViewer assets={$archivedAsset} bind:selectedAssets viewFrom="archive-page" />
</UserPageLayout>
