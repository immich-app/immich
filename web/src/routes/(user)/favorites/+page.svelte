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
	import { handleError } from '$lib/utils/handle-error';
	import { api, AssetResponseDto } from '@api';
	import { onMount } from 'svelte';
	import DotsVertical from 'svelte-material-icons/DotsVertical.svelte';
	import Plus from 'svelte-material-icons/Plus.svelte';
	import Error from '../../+error.svelte';
	import type { PageData } from './$types';
	import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
	import SelectAll from 'svelte-material-icons/SelectAll.svelte';

	let favorites: AssetResponseDto[] = [];
	let selectedAssets: Set<AssetResponseDto> = new Set();

	export let data: PageData;

	$: isMultiSelectionMode = selectedAssets.size > 0;
	$: isAllArchive = Array.from(selectedAssets).every((asset) => asset.isArchived);

	onMount(async () => {
		try {
			const { data: assets } = await api.assetApi.getAllAssets({
				isFavorite: true,
				withoutThumbs: true
			});
			favorites = assets;
		} catch {
			handleError(Error, 'Unable to load favorites');
		}
	});

	const handleSelectAll = () => {
		selectedAssets = new Set(favorites);
	};

	const onAssetDelete = (assetId: string) => {
		favorites = favorites.filter((a) => a.id !== assetId);
	};
</script>

<!-- Multiselection mode app bar -->
{#if isMultiSelectionMode}
	<AssetSelectControlBar assets={selectedAssets} clearSelect={() => (selectedAssets = new Set())}>
		<FavoriteAction removeFavorite onAssetFavorite={(asset) => onAssetDelete(asset.id)} />
		<CreateSharedLink />
		<CircleIconButton title="Select all" logo={SelectAll} on:click={handleSelectAll} />
		<AssetSelectContextMenu icon={Plus} title="Add">
			<AddToAlbum />
			<AddToAlbum shared />
		</AssetSelectContextMenu>
		<DeleteAssets {onAssetDelete} />
		<AssetSelectContextMenu icon={DotsVertical} title="Menu">
			<DownloadAction menuItem />
			<ArchiveAction menuItem unarchive={isAllArchive} />
		</AssetSelectContextMenu>
	</AssetSelectControlBar>
{/if}

<UserPageLayout user={data.user} hideNavbar={isMultiSelectionMode} title={data.meta.title}>
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
