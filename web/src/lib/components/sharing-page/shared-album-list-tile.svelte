<script lang="ts">
	import { AlbumResponseDto, api, ThumbnailFormat, UserResponseDto } from '@api';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	export let album: AlbumResponseDto;

	let albumOwner: UserResponseDto = '';

	onMount(async () => {
		const { data } = await api.userApi.getUserById(album.ownerId);
		albumOwner = data;
	});

	const loadImageData = async (thubmnailId: string | null) => {
		if (thubmnailId == null) {
			return '/no-thumbnail.png';
		}

		const { data } = await api.assetApi.getAssetThumbnail(thubmnailId!, ThumbnailFormat.Webp, {
			responseType: 'blob'
		});
		if (data instanceof Blob) {
			return URL.createObjectURL(data);
		}
	};
</script>

<div class="flex min-w-[500px] border-b border-gray-300 place-items-center my-4 pb-4 gap-6">
	<div>
		{#await loadImageData(album.albumThumbnailAssetId)}
			<div
				class={`bg-immich-primary/10 w-[75px] h-[75px] flex place-items-center place-content-center rounded-xl`}
			>
				...
			</div>
		{:then imageData}
			<img
				in:fade={{ duration: 250 }}
				src={imageData}
				alt={album.id}
				class={`object-cover w-[75px] h-[75px] transition-all z-0 rounded-xl duration-300 `}
			/>
		{/await}
	</div>

	<div>
		<p class="font-medium text-gray-800">{album.albumName}</p>
		<p class="text-xs">Owner: {albumOwner?.firstName}</p>
	</div>
</div>
