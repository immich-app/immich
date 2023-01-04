<script lang="ts">
	import { AlbumResponseDto, ThumbnailFormat } from '@api';
	import { createEventDispatcher } from 'svelte';

	const dispatcher = createEventDispatcher();

	export let album: AlbumResponseDto;
	export let variant: 'simple' | 'full' = 'full';
</script>

<button
	on:click={() => dispatcher('album')}
	class="flex gap-4 px-6 py-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
>
	<div class="h-12 w-12">
		<img
			src={`/api/asset/thumbnail/${album.albumThumbnailAssetId}?format=${ThumbnailFormat.Webp}`}
			alt={album.albumName}
			class={`object-cover h-full w-full transition-all z-0 rounded-xl duration-300 hover:shadow-lg`}
			data-testid="album-image"
		/>
	</div>
	<div class="h-12 flex flex-col items-start justify-center">
		<span>{album.albumName}</span>
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
