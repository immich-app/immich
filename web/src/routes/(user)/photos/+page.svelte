<script lang="ts">
	import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
	import CreateSharedLink from '$lib/components/photos-page/actions/create-shared-link.svelte';
	import DeleteAssets from '$lib/components/photos-page/actions/delete-assets.svelte';
	import DownloadFiles from '$lib/components/photos-page/actions/download-files.svelte';
	import MoveToArchive from '$lib/components/photos-page/actions/move-to-archive.svelte';
	import ShowContextMenu from '$lib/components/photos-page/actions/show-context-menu.svelte';
	import AssetGrid from '$lib/components/photos-page/asset-grid.svelte';
	import OptionAddToAlbum from '$lib/components/photos-page/menu-options/option-add-to-album.svelte';
	import OptionAddToFavorites from '$lib/components/photos-page/menu-options/option-add-to-favorites.svelte';
	import {
		assetInteractionStore,
		isMultiSelectStoreState,
		selectedAssets
	} from '$lib/stores/asset-interaction.store';
	import { onDestroy } from 'svelte';
	import Plus from 'svelte-material-icons/Plus.svelte';
	import type { PageData } from './$types';
	import AssetSelectControlBar from '$lib/components/photos-page/asset-select-control-bar.svelte';
	import { assetStore } from '$lib/stores/assets.store';

	export let data: PageData;

	onDestroy(() => {
		assetInteractionStore.clearMultiselect();
	});
</script>

<UserPageLayout user={data.user} hideNavbar={$isMultiSelectStoreState} showUploadButton>
	<svelte:fragment slot="header">
		{#if $isMultiSelectStoreState}
			<AssetSelectControlBar
				options={{
					assets: $selectedAssets,
					clearSelect: assetInteractionStore.clearMultiselect,
					removeAsset: assetStore.removeAsset
				}}
			>
				<CreateSharedLink />
				<MoveToArchive />
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

	<AssetGrid slot="content" />
</UserPageLayout>
