<script lang="ts" context="module">
	type OnShowContextMenu = {
		showalbumcontextmenu: OnShowContextMenuDetail;
	};

	type OnClick = {
		click: OnClickDetail;
	};

	export type OnShowContextMenuDetail = { x: number; y: number };
	export type OnClickDetail = AlbumResponseDto;
</script>

<script lang="ts">
	import { AlbumResponseDto, api, ThumbnailFormat } from '@api';
	import { createEventDispatcher, onMount } from 'svelte';
	import DotsVertical from 'svelte-material-icons/DotsVertical.svelte';
	import CircleIconButton from '../shared-components/circle-icon-button.svelte';

	export let album: AlbumResponseDto;

	const NO_THUMBNAIL = 'no-thumbnail.png';

	let imageData = `/api/asset/thumbnail/${album.albumThumbnailAssetId}?format=${ThumbnailFormat.Webp}`;
	if (!album.albumThumbnailAssetId) {
		imageData = NO_THUMBNAIL;
	}

	const dispatchClick = createEventDispatcher<OnClick>();
	const dispatchShowContextMenu = createEventDispatcher<OnShowContextMenu>();

	const loadHighQualityThumbnail = async (thubmnailId: string | null) => {
		if (thubmnailId == null) {
			return;
		}

		const { data } = await api.assetApi.getAssetThumbnail(thubmnailId, ThumbnailFormat.Jpeg, {
			responseType: 'blob'
		});

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
		imageData = (await loadHighQualityThumbnail(album.albumThumbnailAssetId)) || NO_THUMBNAIL;
	});

	const locale = navigator.language;
</script>

<div
	class="h-[339px] w-[275px] hover:cursor-pointer mt-4 relative"
	on:click={() => dispatchClick('click', album)}
	data-testid="album-card"
>
	<div
		id={`icon-${album.id}`}
		class="absolute top-2 right-2"
		on:click|stopPropagation|preventDefault={showAlbumContextMenu}
		data-testid="context-button-parent"
	>
		<CircleIconButton logo={DotsVertical} size={'20'} hoverColor={'rgba(95,99,104, 0.5)'} />
	</div>

	<div class={`h-[275px] w-[275px] z-[-1]`}>
		<img
			src={imageData}
			alt={album.id}
			class={`object-cover h-full w-full transition-all z-0 rounded-xl duration-300 hover:shadow-lg`}
			data-testid="album-image"
		/>
	</div>

	<div class="mt-4">
		<p
			class="text-sm font-medium text-gray-800 dark:text-immich-dark-primary"
			data-testid="album-name"
		>
			{album.albumName}
		</p>

		<span class="text-xs flex gap-2 dark:text-immich-dark-fg" data-testid="album-details">
			<p>{album.assetCount.toLocaleString(locale)} {album.assetCount == 1 ? `item` : `items`}</p>

			{#if album.shared}
				<p>·</p>
				<p>Shared</p>
			{/if}
		</span>
	</div>
</div>
