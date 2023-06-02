<script lang="ts">
	import noThumbnailUrl from '$lib/assets/no-thumbnail.png';
	import { locale } from '$lib/stores/preferences.store';
	import { AlbumResponseDto, api, ThumbnailFormat, UserResponseDto } from '@api';
	import { createEventDispatcher, onMount } from 'svelte';
	import DotsVertical from 'svelte-material-icons/DotsVertical.svelte';
	import IconButton from '../elements/buttons/icon-button.svelte';
	import type { OnClick, OnShowContextMenu } from './album-card';

	export let album: AlbumResponseDto;
	export let isSharingView = false;
	export let user: UserResponseDto;

	$: imageData = album.albumThumbnailAssetId
		? api.getAssetThumbnailUrl(album.albumThumbnailAssetId, ThumbnailFormat.Webp)
		: noThumbnailUrl;

	const dispatchClick = createEventDispatcher<OnClick>();
	const dispatchShowContextMenu = createEventDispatcher<OnShowContextMenu>();

	const loadHighQualityThumbnail = async (thubmnailId: string | null) => {
		if (thubmnailId == null) {
			return;
		}

		const { data } = await api.assetApi.getAssetThumbnail(
			{
				id: thubmnailId,
				format: ThumbnailFormat.Jpeg
			},
			{
				responseType: 'blob'
			}
		);

		if (data instanceof Blob) {
			return URL.createObjectURL(data);
		}
	};

	const showAlbumContextMenu = (e: MouseEvent) => {
		dispatchShowContextMenu('showalbumcontextmenu', {
			x: e.clientX,
			y: e.clientY
		});
	};

	onMount(async () => {
		imageData = (await loadHighQualityThumbnail(album.albumThumbnailAssetId)) || noThumbnailUrl;
	});

	const getAlbumOwnerInfo = async (): Promise<UserResponseDto> => {
		const { data } = await api.userApi.getUserById({ userId: album.ownerId });

		return data;
	};
</script>

<div
	class="group hover:cursor-pointer mt-4 border-[3px] border-transparent dark:hover:border-immich-dark-primary/75 hover:border-immich-primary/75 rounded-3xl p-5 relative"
	on:click={() => dispatchClick('click', album)}
	on:keydown={() => dispatchClick('click', album)}
	data-testid="album-card"
>
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	{#if !isSharingView}
		<div
			id={`icon-${album.id}`}
			class="absolute top-6 right-6 z-10"
			on:click|stopPropagation|preventDefault={showAlbumContextMenu}
			data-testid="context-button-parent"
		>
			<IconButton color="overlay-primary">
				<DotsVertical size="20" />
			</IconButton>
		</div>
	{/if}

	<div class={`aspect-square relative`}>
		<img
			src={imageData}
			alt={album.id}
			class={`object-cover h-full w-full transition-all z-0 rounded-3xl duration-300 hover:shadow-lg`}
			data-testid="album-image"
			draggable="false"
		/>
		<div
			class="w-full h-full absolute top-0 rounded-3xl {isSharingView
				? 'group-hover:bg-yellow-800/25'
				: 'group-hover:bg-indigo-800/25'} "
		/>
	</div>

	<div class="mt-4">
		<p
			class="text-xl font-semibold dark:text-immich-dark-primary text-immich-primary w-full truncate"
			data-testid="album-name"
			title={album.albumName}
		>
			{album.albumName}
		</p>

		<span class="text-sm flex gap-2 dark:text-immich-dark-fg" data-testid="album-details">
			<p>
				{album.assetCount.toLocaleString($locale)}
				{album.assetCount == 1 ? `item` : `items`}
			</p>

			{#if isSharingView || album.shared}
				<p>·</p>
			{/if}

			{#if isSharingView}
				{#await getAlbumOwnerInfo() then albumOwner}
					{#if user.email == albumOwner.email}
						<p>Owned</p>
					{:else}
						<p>
							Shared by {albumOwner.firstName}
							{albumOwner.lastName}
						</p>
					{/if}
				{/await}
			{:else if album.shared}
				<p>Shared</p>
			{/if}
		</span>
	</div>
</div>
