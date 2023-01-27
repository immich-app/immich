<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { quintOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';
	import { AssetResponseDto } from '@api';
	import { openFileUploadDialog } from '$lib/utils/file-uploader';
	import ControlAppBar from '../shared-components/control-app-bar.svelte';
	import AssetGrid from '../photos-page/asset-grid.svelte';
	import {
		assetInteractionStore,
		assetsInAlbumStoreState,
		selectedAssets
	} from '$lib/stores/asset-interaction.store';

	const dispatch = createEventDispatcher();

	export let albumId: string;
	export let assetsInAlbum: AssetResponseDto[];

	onMount(() => {
		$assetsInAlbumStoreState = assetsInAlbum;
	});

	const addSelectedAssets = async () => {
		dispatch('create-album', {
			assets: Array.from($selectedAssets)
		});

		assetInteractionStore.clearMultiselect();
	};

	const locale = navigator.language;
</script>

<section
	transition:fly={{ y: 500, duration: 100, easing: quintOut }}
	class="absolute top-0 left-0 w-full h-full bg-immich-bg dark:bg-immich-dark-bg z-[9999]"
>
	<ControlAppBar
		on:close-button-click={() => {
			assetInteractionStore.clearMultiselect();
			dispatch('go-back');
		}}
	>
		<svelte:fragment slot="leading">
			{#if $selectedAssets.size == 0}
				<p class="text-lg dark:text-immich-dark-fg">Add to album</p>
			{:else}
				<p class="text-lg dark:text-immich-dark-fg">
					{$selectedAssets.size.toLocaleString(locale)} selected
				</p>
			{/if}
		</svelte:fragment>

		<svelte:fragment slot="trailing">
			<button
				on:click={() =>
					openFileUploadDialog(albumId, '', () => {
						assetInteractionStore.clearMultiselect();
						dispatch('go-back');
					})}
				class="text-immich-primary dark:text-immich-dark-primary text-sm hover:bg-immich-primary/10 dark:hover:bg-immich-dark-primary/25 transition-all px-6 py-2 rounded-lg font-medium"
			>
				Select from computer
			</button>
			<button
				disabled={$selectedAssets.size === 0}
				on:click={addSelectedAssets}
				class="immich-text-button border bg-immich-primary dark:bg-immich-dark-primary text-gray-50 hover:bg-immich-primary/75 px-6 text-sm disabled:opacity-25 disabled:bg-gray-500 disabled:cursor-not-allowed dark:text-immich-dark-bg dark:border-immich-dark-gray"
				><span class="px-2">Done</span></button
			>
		</svelte:fragment>
	</ControlAppBar>
	<section class="pt-[100px] pl-[70px] grid h-screen bg-immich-bg dark:bg-immich-dark-bg">
		<AssetGrid isAlbumSelectionMode={true} />
	</section>
</section>
