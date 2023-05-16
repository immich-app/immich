<script lang="ts">
	import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
	import CreateSharedLink from '$lib/components/photos-page/actions/create-shared-link.svelte';
	import DeleteAssets from '$lib/components/photos-page/actions/delete-assets.svelte';
	import DownloadFiles from '$lib/components/photos-page/actions/download-files.svelte';
	import RemoveFromArchive from '$lib/components/photos-page/actions/remove-from-archive.svelte';
	import ShowContextMenu from '$lib/components/photos-page/actions/show-context-menu.svelte';
	import AssetSelectControlBar from '$lib/components/photos-page/asset-select-control-bar.svelte';
	import OptionAddToAlbum from '$lib/components/photos-page/menu-options/option-add-to-album.svelte';
	import OptionAddToFavorites from '$lib/components/photos-page/menu-options/option-add-to-favorites.svelte';
	import EmptyPlaceholder from '$lib/components/shared-components/empty-placeholder.svelte';
	import GalleryViewer from '$lib/components/shared-components/gallery-viewer/gallery-viewer.svelte';
	import { archivedAsset } from '$lib/stores/archived-asset.store';
	import { handleError } from '$lib/utils/handle-error';
	import { api, AssetResponseDto } from '@api';
	import { onMount } from 'svelte';
	import Plus from 'svelte-material-icons/Plus.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	let selectedAssets: Set<AssetResponseDto> = new Set();
	$: isMultiSelectionMode = selectedAssets.size > 0;

	onMount(async () => {
		try {
			const { data: assets } = await api.assetApi.getAllAssets(undefined, true);
			$archivedAsset = assets;
		} catch {
			handleError(Error, 'Unable to load archived assets');
		}
	});

	const clearMultiSelectAssetAssetHandler = () => {
		selectedAssets = new Set();
	};
</script>

<UserPageLayout user={data.user} hideNavbar={isMultiSelectionMode}>
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
				options={{
					assets: selectedAssets,
					clearSelect: clearMultiSelectAssetAssetHandler,
					removeAsset: (assetId) =>
						($archivedAsset = $archivedAsset.filter((a) => a.id !== assetId))
				}}
			>
				<CreateSharedLink />
				<RemoveFromArchive />
				<DownloadFiles />
				<ShowContextMenu icon={Plus} title="Add" let:closeMenu>
					<OptionAddToFavorites {closeMenu} />
					<OptionAddToAlbum {closeMenu} />
					<OptionAddToAlbum {closeMenu} shared />
				</ShowContextMenu>
				<DeleteAssets />
			</AssetSelectControlBar>
		{/if}
	</svelte:fragment>

	<GalleryViewer assets={$archivedAsset} bind:selectedAssets viewFrom="archive-page" />
</UserPageLayout>
