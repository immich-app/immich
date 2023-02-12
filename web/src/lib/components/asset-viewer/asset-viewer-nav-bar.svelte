<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	import ArrowLeft from 'svelte-material-icons/ArrowLeft.svelte';
	import CloudDownloadOutline from 'svelte-material-icons/CloudDownloadOutline.svelte';
	import InformationOutline from 'svelte-material-icons/InformationOutline.svelte';
	import DotsVertical from 'svelte-material-icons/DotsVertical.svelte';
	import DeleteOutline from 'svelte-material-icons/DeleteOutline.svelte';
	import CircleIconButton from '../shared-components/circle-icon-button.svelte';
	import ContextMenu from '../shared-components/context-menu/context-menu.svelte';
	import MenuOption from '../shared-components/context-menu/menu-option.svelte';
	import Star from 'svelte-material-icons/Star.svelte';
	import StarOutline from 'svelte-material-icons/StarOutline.svelte';
	import ContentCopy from 'svelte-material-icons/ContentCopy.svelte';
	import MotionPlayOutline from 'svelte-material-icons/MotionPlayOutline.svelte';
	import MotionPauseOutline from 'svelte-material-icons/MotionPauseOutline.svelte';

	import { page } from '$app/stores';
	import { AssetResponseDto } from '../../../api';

	export let asset: AssetResponseDto;
	export let showCopyButton: boolean;
	export let showMotionPlayButton: boolean;
	export let isMotionPhotoPlaying = false;
	export let showDownloadButton: boolean;

	const isOwner = asset.ownerId === $page.data.user?.id;

	const dispatch = createEventDispatcher();

	let contextMenuPosition = { x: 0, y: 0 };
	let isShowAssetOptions = false;

	const showOptionsMenu = (event: CustomEvent) => {
		contextMenuPosition = {
			x: event.detail.mouseEvent.x,
			y: event.detail.mouseEvent.y
		};

		isShowAssetOptions = !isShowAssetOptions;
	};

	const onMenuClick = (eventName: string) => {
		isShowAssetOptions = false;
		dispatch(eventName);
	};
</script>

<div
	class="h-16 flex justify-between place-items-center px-3 transition-transform duration-200 z-[9999]"
>
	<div>
		<CircleIconButton logo={ArrowLeft} on:click={() => dispatch('goBack')} />
	</div>
	<div class="text-white flex gap-2">
		{#if showMotionPlayButton}
			{#if isMotionPhotoPlaying}
				<CircleIconButton
					logo={MotionPauseOutline}
					title="Stop Motion Photo"
					on:click={() => dispatch('stopMotionPhoto')}
				/>
			{:else}
				<CircleIconButton
					logo={MotionPlayOutline}
					title="Play Motion Photo"
					on:click={() => dispatch('playMotionPhoto')}
				/>
			{/if}
		{/if}
		{#if showCopyButton}
			<CircleIconButton
				logo={ContentCopy}
				title="Copy Image"
				on:click={() => {
					const copyEvent = new CustomEvent('copyImage');
					window.dispatchEvent(copyEvent);
				}}
			/>
		{/if}

		{#if showDownloadButton}
			<CircleIconButton
				logo={CloudDownloadOutline}
				on:click={() => dispatch('download')}
				title="Download"
			/>
		{/if}
		<CircleIconButton
			logo={InformationOutline}
			on:click={() => dispatch('showDetail')}
			title="Info"
		/>
		{#if isOwner}
			<CircleIconButton
				logo={asset.isFavorite ? Star : StarOutline}
				on:click={() => dispatch('favorite')}
				title="Favorite"
			/>
		{/if}

		{#if isOwner}
			<CircleIconButton logo={DeleteOutline} on:click={() => dispatch('delete')} title="Delete" />
			<CircleIconButton
				logo={DotsVertical}
				on:click={(event) => showOptionsMenu(event)}
				title="More"
			/>
		{/if}
	</div>
</div>

{#if isShowAssetOptions}
	<ContextMenu {...contextMenuPosition} on:clickoutside={() => (isShowAssetOptions = false)}>
		<div class="flex flex-col rounded-lg ">
			<MenuOption on:click={() => onMenuClick('addToAlbum')} text="Add to Album" />
			<MenuOption on:click={() => onMenuClick('addToSharedAlbum')} text="Add to Shared Album" />
		</div>
	</ContextMenu>
{/if}
