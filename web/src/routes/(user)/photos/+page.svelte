<script lang="ts">
	import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
	import CreateSharedLink from '$lib/components/photos-page/actions/create-shared-link.svelte';
	import DeleteAssets from '$lib/components/photos-page/actions/delete-assets.svelte';
	import DownloadFiles from '$lib/components/photos-page/actions/download-files.svelte';
	import MoveToArchive from '$lib/components/photos-page/actions/move-to-archive.svelte';
	import AssetGrid from '$lib/components/photos-page/asset-grid.svelte';
	import AssetSelectContextMenu from '$lib/components/photos-page/asset-select-context-menu.svelte';
	import AssetSelectControlBar from '$lib/components/photos-page/asset-select-control-bar.svelte';
	import OptionAddToAlbum from '$lib/components/photos-page/menu-options/option-add-to-album.svelte';
	import OptionAddToFavorites from '$lib/components/photos-page/menu-options/option-add-to-favorites.svelte';
	import {
		assetInteractionStore,
		isMultiSelectStoreState,
		selectedAssets
	} from '$lib/stores/asset-interaction.store';
	import { assetStore } from '$lib/stores/assets.store';
	import { onDestroy } from 'svelte';
	import Plus from 'svelte-material-icons/Plus.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	onDestroy(() => {
		assetInteractionStore.clearMultiselect();
	});
</script>

<UserPageLayout user={data.user} hideNavbar={$isMultiSelectStoreState} showUploadButton>
	<svelte:fragment slot="header">
		{#if $isMultiSelectStoreState}
			<AssetSelectControlBar
				assets={$selectedAssets}
				clearSelect={assetInteractionStore.clearMultiselect}
			>
				<CreateSharedLink />
				<MoveToArchive onAssetArchive={(asset) => assetStore.removeAsset(asset.id)} />
				<DownloadFiles />
				<AssetSelectContextMenu icon={Plus} title="Add">
					<OptionAddToFavorites />
					<OptionAddToAlbum />
					<OptionAddToAlbum shared />
				</AssetSelectContextMenu>
				<DeleteAssets onAssetDelete={assetStore.removeAsset} />
			</AssetSelectControlBar>
		{/if}
	</svelte:fragment>

	<AssetGrid slot="content" />
</UserPageLayout>
