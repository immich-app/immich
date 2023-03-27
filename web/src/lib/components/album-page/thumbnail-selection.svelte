<script lang="ts">
	import { AlbumResponseDto, AssetResponseDto } from '@api';
	import { createEventDispatcher } from 'svelte';
	import { quintOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';
	import Thumbnail from '../assets/thumbnail/thumbnail.svelte';
	import ControlAppBar from '../shared-components/control-app-bar.svelte';

	export let album: AlbumResponseDto;

	let selectedThumbnail: AssetResponseDto | undefined;
	const dispatch = createEventDispatcher();

	$: isSelected = (id: string): boolean | undefined => {
		if (!selectedThumbnail && album.albumThumbnailAssetId == id) {
			return true;
		} else {
			return selectedThumbnail?.id == id;
		}
	};
</script>

<section
	transition:fly={{ y: 500, duration: 100, easing: quintOut }}
	class="absolute top-0 left-0 w-full h-full py-[160px] bg-immich-bg dark:bg-immich-dark-bg z-[9999]"
>
	<ControlAppBar on:close-button-click={() => dispatch('close')}>
		<svelte:fragment slot="leading">
			<p class="text-lg">Select album cover</p>
		</svelte:fragment>

		<svelte:fragment slot="trailing">
			<button
				disabled={selectedThumbnail == undefined}
				on:click={() => dispatch('thumbnail-selected', { asset: selectedThumbnail })}
				class="immich-text-button border bg-immich-primary text-gray-50 hover:bg-immich-primary/75 px-6 text-sm disabled:opacity-25 disabled:bg-gray-500 disabled:cursor-not-allowed"
				><span class="px-2">Done</span></button
			>
		</svelte:fragment>
	</ControlAppBar>

	<section class="flex flex-wrap gap-14  px-20 overflow-y-auto">
		<!-- Image grid -->
		<div class="flex flex-wrap gap-[2px]">
			{#each album.assets as asset}
				<Thumbnail
					{asset}
					on:click={() => (selectedThumbnail = asset)}
					selected={isSelected(asset.id)}
				/>
			{/each}
		</div>
	</section>
</section>
