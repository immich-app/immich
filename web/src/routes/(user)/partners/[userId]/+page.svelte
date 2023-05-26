<script lang="ts">
	import { goto } from '$app/navigation';
	import AddToAlbum from '$lib/components/photos-page/actions/add-to-album.svelte';
	import CreateSharedLink from '$lib/components/photos-page/actions/create-shared-link.svelte';
	import DownloadAction from '$lib/components/photos-page/actions/download-action.svelte';
	import AssetGrid from '$lib/components/photos-page/asset-grid.svelte';
	import AssetSelectContextMenu from '$lib/components/photos-page/asset-select-context-menu.svelte';
	import AssetSelectControlBar from '$lib/components/photos-page/asset-select-control-bar.svelte';
	import ControlAppBar from '$lib/components/shared-components/control-app-bar.svelte';
	import { AppRoute } from '$lib/constants';
	import {
		assetInteractionStore,
		isMultiSelectStoreState,
		selectedAssets
	} from '$lib/stores/asset-interaction.store';
	import { onDestroy } from 'svelte';
	import ArrowLeft from 'svelte-material-icons/ArrowLeft.svelte';
	import Plus from 'svelte-material-icons/Plus.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	onDestroy(() => {
		assetInteractionStore.clearMultiselect();
	});
</script>

<main class="grid h-screen pt-18 bg-immich-bg dark:bg-immich-dark-bg">
	{#if $isMultiSelectStoreState}
		<AssetSelectControlBar
			assets={$selectedAssets}
			clearSelect={assetInteractionStore.clearMultiselect}
		>
			<DownloadAction />
		</AssetSelectControlBar>
		<AssetSelectControlBar
			assets={$selectedAssets}
			clearSelect={assetInteractionStore.clearMultiselect}
		>
			<CreateSharedLink />
			<AssetSelectContextMenu icon={Plus} title="Add">
				<AddToAlbum />
				<AddToAlbum shared />
			</AssetSelectContextMenu>
			<DownloadAction />
		</AssetSelectControlBar>
	{:else}
		<ControlAppBar
			showBackButton
			backIcon={ArrowLeft}
			on:close-button-click={() => goto(AppRoute.SHARING)}
		>
			<svelte:fragment slot="leading">
				<p class="text-immich-fg dark:text-immich-dark-fg">
					{data.partner.firstName}
					{data.partner.lastName}'s photos
				</p>
			</svelte:fragment>
		</ControlAppBar>
	{/if}
	<AssetGrid user={data.partner} />
</main>
