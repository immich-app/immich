<script lang="ts">
	import { AlbumResponseDto, api, ThumbnailFormat, UserResponseDto } from '@api';
	import { fade } from 'svelte/transition';
	import noThumbnailUrl from '$lib/assets/no-thumbnail.png';

	export let album: AlbumResponseDto;
	export let user: UserResponseDto;

	const loadImageData = async (thubmnailId: string | null) => {
		if (thubmnailId == null) {
			return noThumbnailUrl;
		}

		const { data } = await api.assetApi.getAssetThumbnail(
			thubmnailId,
			ThumbnailFormat.Webp,
			undefined,
			{
				responseType: 'blob'
			}
		);
		if (data instanceof Blob) {
			return URL.createObjectURL(data);
		}
	};

	const getAlbumOwnerInfo = async (): Promise<UserResponseDto> => {
		const { data } = await api.userApi.getUserById(album.ownerId);

		return data;
	};
</script>

<div
	class="grid grid-cols-[75px_1fr] w-full md:w-[500px] border-b border-gray-300 dark:border-immich-dark-gray place-items-center py-4  gap-6 transition-all hover:border-immich-primary dark:hover:border-immich-dark-primary"
>
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
				draggable="false"
			/>
		{/await}
	</div>

	<div class="justify-self-start">
		<p class="font-medium text-gray-800 dark:text-immich-dark-primary">
			{album.albumName}
		</p>
		<span class="text-xs flex gap-2 dark:text-immich-dark-fg" data-testid="album-details"
			><p>{album.assetCount} items</p>
			<p>·</p>
			{#await getAlbumOwnerInfo() then albumOwner}
				{#if user.email == albumOwner.email}
					<p class="text-xs text-gray-600 dark:text-immich-dark-fg">Owned</p>
				{:else}
					<p class="text-xs text-gray-600 dark:text-immich-dark-fg">
						Shared by {albumOwner.firstName}
						{albumOwner.lastName}
					</p>
				{/if}
			{/await}
		</span>
	</div>
</div>
