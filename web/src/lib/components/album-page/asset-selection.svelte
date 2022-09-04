<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { quintOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';
	import { AssetResponseDto } from '@api';
	import { openFileUploadDialog, UploadType } from '$lib/utils/file-uploader';
	import { albumUploadAssetStore } from '$lib/stores/album-upload-asset';
	import ControlAppBar from '../shared-components/control-app-bar.svelte';
	import AssetGrid from '../photos-page/asset-grid.svelte';
	import {
		assetInteractionStore,
		assetsInAlbumStoreState,
		selectedAssets
	} from '$lib/stores/asset-interaction.store';

	const dispatch = createEventDispatcher();

	export let assetsInAlbum: AssetResponseDto[];

	let uploadAssets: string[] = [];
	let uploadAssetsCount = 9999;

	onMount(() => {
		$assetsInAlbumStoreState = assetsInAlbum;

		albumUploadAssetStore.asset.subscribe((uploadedAsset) => {
			uploadAssets = uploadedAsset;
		});

		albumUploadAssetStore.count.subscribe((count) => {
			uploadAssetsCount = count;
		});
	});

	/**
	 * Watch for the uploading event - when the uploaded assets are the same number of the chosen asset
	 * navigate back and add them to the album
	 */
	$: {
		if (uploadAssets.length == uploadAssetsCount) {
			// Filter assets that are already in the album
			const assetsToAdd = uploadAssets.filter(
				(asset) => !!asset && !assetsInAlbum.some((a) => a.id === asset)
			);

			// Add the just uploaded assets to the album
			if (assetsToAdd.length) {
				dispatch('create-album', {
					assets: assetsToAdd
				});
			}

			// Clean up states.
			albumUploadAssetStore.asset.set([]);
			albumUploadAssetStore.count.set(9999);
		}
	}

	const addSelectedAssets = async () => {
		dispatch('create-album', {
			assets: Array.from($selectedAssets)
		});

		assetInteractionStore.clearMultiselect();
	};
</script>

<section
	transition:fly={{ y: 500, duration: 100, easing: quintOut }}
	class="absolute top-0 left-0 w-full h-full  bg-immich-bg z-[9999]"
>
	<ControlAppBar
		on:close-button-click={() => {
			assetInteractionStore.clearMultiselect();
			dispatch('go-back');
		}}
	>
		<svelte:fragment slot="leading">
			{#if $selectedAssets.size == 0}
				<p class="text-lg">Add to album</p>
			{:else}
				<p class="text-lg">{$selectedAssets.size} selected</p>
			{/if}
		</svelte:fragment>

		<svelte:fragment slot="trailing">
			<button
				on:click={() => openFileUploadDialog(UploadType.ALBUM)}
				class="text-immich-primary text-sm hover:bg-immich-primary/10 transition-all px-6 py-2 rounded-lg font-medium"
			>
				Select from computer
			</button>
			<button
				disabled={$selectedAssets.size === 0}
				on:click={addSelectedAssets}
				class="immich-text-button border bg-immich-primary text-gray-50 hover:bg-immich-primary/75 px-6 text-sm disabled:opacity-25 disabled:bg-gray-500 disabled:cursor-not-allowed"
				><span class="px-2">Done</span></button
			>
		</svelte:fragment>
	</ControlAppBar>
	<section class="pt-[100px] pl-[70px] grid h-screen bg-immich-bg">
		<AssetGrid />
	</section>
</section>
