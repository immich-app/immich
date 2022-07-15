<script lang="ts">
	import { AlbumResponseDto, api, ThumbnailFormat } from '@api';
	import { createEventDispatcher, onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	export let album: AlbumResponseDto;

	let imageData: string = '/no-thumbnail.png';
	const dispatch = createEventDispatcher();

	const loadImageData = async (thubmnailId: string | null) => {
		if (thubmnailId == null) {
			return '/no-thumbnail.png';
		}

		const { data } = await api.assetApi.getAssetThumbnail(thubmnailId!, ThumbnailFormat.Jpeg, { responseType: 'blob' });
		if (data instanceof Blob) {
			imageData = URL.createObjectURL(data);
			return imageData;
		}
	};
</script>

<div class="h-[339px] w-[275px] hover:cursor-pointer mt-4" on:click={() => dispatch('click', album)}>
	<div class={`h-[275px] w-[275px]`}>
		{#await loadImageData(album.albumThumbnailAssetId)}
			<div class={`bg-immich-primary/10 w-full h-full  flex place-items-center place-content-center rounded-xl`}>
				...
			</div>
		{:then imageData}
			<img
				in:fade={{ duration: 250 }}
				src={imageData}
				alt={album.id}
				class={`object-cover w-full h-full transition-all z-0 rounded-xl duration-300 hover:translate-x-2 hover:-translate-y-2 hover:shadow-[-8px_8px_0px_0_#FFB800]`}
			/>
		{/await}
	</div>

	<div class="mt-4">
		<p class="text-sm font-medium text-gray-800">
			{album.albumName}
		</p>

		<span class="text-xs flex gap-2">
			<p>{album.assets.length} items</p>

			{#if album.shared}
				<p>·</p>
				<p>Shared</p>
			{/if}
		</span>
	</div>
</div>

<style>
</style>
