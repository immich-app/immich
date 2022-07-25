<script lang="ts">
	import { AlbumResponseDto, api, ThumbnailFormat } from '@api';
	import { createEventDispatcher, onMount } from 'svelte';
	import DotsVertical from 'svelte-material-icons/DotsVertical.svelte';
	import { fade } from 'svelte/transition';
	import CircleIconButton from '../shared-components/circle-icon-button.svelte';

	export let album: AlbumResponseDto;

	let imageData: string = '/no-thumbnail.png';
	const dispatch = createEventDispatcher();

	const loadImageData = async (thubmnailId: string | null) => {
		if (thubmnailId == null) {
			return '/no-thumbnail.png';
		}

		const { data } = await api.assetApi.getAssetThumbnail(thubmnailId!, ThumbnailFormat.Webp, {
			responseType: 'blob'
		});
		if (data instanceof Blob) {
			imageData = URL.createObjectURL(data);
			return imageData;
		}
	};

	const showAlbumContextMenu = (e: MouseEvent) => {
		dispatch('showalbumcontextmenu', {
			x: e.clientX,
			y: e.clientY
		});
	};
</script>

<div
	class="h-[339px] w-[275px] hover:cursor-pointer mt-4 relative"
	on:click={() => dispatch('click', album)}
>
	<div
		id={`icon-${album.id}`}
		class="absolute top-2 right-2"
		on:click|stopPropagation|preventDefault={showAlbumContextMenu}
	>
		<CircleIconButton
			logo={DotsVertical}
			size={'20'}
			hoverColor={'rgba(95,99,104, 0.5)'}
			logoColor={'#fdf8ec'}
		/>
	</div>

	<div class={`h-[275px] w-[275px] z-[-1]`}>
		{#await loadImageData(album.albumThumbnailAssetId)}
			<div
				class={`bg-immich-primary/10 w-full h-full  flex place-items-center place-content-center rounded-xl`}
			>
				...
			</div>
		{:then imageData}
			<img
				in:fade={{ duration: 250 }}
				src={imageData}
				alt={album.id}
				class={`object-cover w-full h-full transition-all z-0 rounded-xl duration-300 hover:shadow-lg`}
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
