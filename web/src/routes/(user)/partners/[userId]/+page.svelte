<script lang="ts">
	import { goto } from '$app/navigation';
	import DownloadFiles from '$lib/components/photos-page/actions/download-files.svelte';
	import AssetGrid from '$lib/components/photos-page/asset-grid.svelte';
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
	import type { PageData } from './$types';

	export let data: PageData;

	onDestroy(() => {
		assetInteractionStore.clearMultiselect();
	});
</script>

<main class="grid h-screen pt-[4.25rem] bg-immich-bg dark:bg-immich-dark-bg">
	{#if $isMultiSelectStoreState}
		<AssetSelectControlBar
			assets={$selectedAssets}
			clearSelect={assetInteractionStore.clearMultiselect}
		>
			<DownloadFiles />
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
