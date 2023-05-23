<script lang="ts">
	import { AlbumResponseDto, ThumbnailFormat, api } from '@api';
	import { createEventDispatcher } from 'svelte';

	const dispatcher = createEventDispatcher();

	export let album: AlbumResponseDto;
	export let variant: 'simple' | 'full' = 'full';
	export let searchQuery = '';
	let albumNameArray: string[] = ['', '', ''];

	// This part of the code is responsible for splitting album name into 3 parts where part 2 is the search query
	// It is used to highlight the search query in the album name
	$: {
		let { albumName } = album;
		let findIndex = albumName.toLowerCase().indexOf(searchQuery.toLowerCase());
		let findLength = searchQuery.length;
		albumNameArray = [
			albumName.slice(0, findIndex),
			albumName.slice(findIndex, findIndex + findLength),
			albumName.slice(findIndex + findLength)
		];
	}
</script>

<button
	on:click={() => dispatcher('album')}
	class="w-full flex gap-4 px-6 py-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
>
	<div class="h-12 w-12 rounded-xl bg-slate-300">
		{#if album.albumThumbnailAssetId}
			<img
				src={api.getAssetThumbnailUrl(album.albumThumbnailAssetId, ThumbnailFormat.Webp)}
				alt={album.albumName}
				class={`object-cover h-full w-full transition-all z-0 rounded-xl duration-300 hover:shadow-lg`}
				data-testid="album-image"
				draggable="false"
			/>
		{/if}
	</div>
	<div class="h-12 flex flex-col items-start justify-center">
		<span>{albumNameArray[0]}<b>{albumNameArray[1]}</b>{albumNameArray[2]}</span>
		<span class="flex gap-1 text-sm">
			{#if variant === 'simple'}
				<span
					>{#if album.shared}Shared{/if}
				</span>
			{:else}
				<span>{album.assetCount} items</span>
				<span
					>{#if album.shared} · Shared{/if}
				</span>
			{/if}
		</span>
	</div>
</button>
