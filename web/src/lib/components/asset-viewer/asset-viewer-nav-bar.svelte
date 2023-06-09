<script lang="ts">
	import { page } from '$app/stores';
	import { clickOutside } from '$lib/utils/click-outside';
	import type { AssetResponseDto } from '@api';
	import { createEventDispatcher } from 'svelte';
	import ArrowLeft from 'svelte-material-icons/ArrowLeft.svelte';
	import CloudDownloadOutline from 'svelte-material-icons/CloudDownloadOutline.svelte';
	import ContentCopy from 'svelte-material-icons/ContentCopy.svelte';
	import DeleteOutline from 'svelte-material-icons/DeleteOutline.svelte';
	import DotsVertical from 'svelte-material-icons/DotsVertical.svelte';
	import Heart from 'svelte-material-icons/Heart.svelte';
	import HeartOutline from 'svelte-material-icons/HeartOutline.svelte';
	import InformationOutline from 'svelte-material-icons/InformationOutline.svelte';
	import MotionPauseOutline from 'svelte-material-icons/MotionPauseOutline.svelte';
	import MotionPlayOutline from 'svelte-material-icons/MotionPlayOutline.svelte';
	import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';
	import ContextMenu from '../shared-components/context-menu/context-menu.svelte';
	import MenuOption from '../shared-components/context-menu/menu-option.svelte';

	export let asset: AssetResponseDto;
	export let showCopyButton: boolean;
	export let showMotionPlayButton: boolean;
	export let isMotionPhotoPlaying = false;
	export let showDownloadButton: boolean;

	const isOwner = asset.ownerId === $page.data.user?.id;

	const dispatch = createEventDispatcher();

	let contextMenuPosition = { x: 0, y: 0 };
	let isShowAssetOptions = false;

	const showOptionsMenu = ({ x, y }: MouseEvent) => {
		contextMenuPosition = { x, y };
		isShowAssetOptions = !isShowAssetOptions;
	};

	const onMenuClick = (eventName: string) => {
		isShowAssetOptions = false;
		dispatch(eventName);
	};
</script>

<div
	class="h-16 flex justify-between place-items-center px-3 transition-transform duration-200 z-[1001] bg-gradient-to-b from-black/40"
>
	<div class="text-white">
		<CircleIconButton isOpacity={true} logo={ArrowLeft} on:click={() => dispatch('goBack')} />
	</div>
	<div class="text-white flex gap-2 justify-end w-[calc(100%-3rem)] overflow-hidden">
		{#if showMotionPlayButton}
			{#if isMotionPhotoPlaying}
				<CircleIconButton
					isOpacity={true}
					logo={MotionPauseOutline}
					title="Stop Motion Photo"
					on:click={() => dispatch('stopMotionPhoto')}
				/>
			{:else}
				<CircleIconButton
					isOpacity={true}
					logo={MotionPlayOutline}
					title="Play Motion Photo"
					on:click={() => dispatch('playMotionPhoto')}
				/>
			{/if}
		{/if}
		{#if showCopyButton}
			<CircleIconButton
				isOpacity={true}
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
				isOpacity={true}
				logo={CloudDownloadOutline}
				on:click={() => dispatch('download')}
				title="Download"
			/>
		{/if}
		<CircleIconButton
			isOpacity={true}
			logo={InformationOutline}
			on:click={() => dispatch('showDetail')}
			title="Info"
		/>
		{#if isOwner}
			<CircleIconButton
				isOpacity={true}
				logo={asset.isFavorite ? Heart : HeartOutline}
				on:click={() => dispatch('favorite')}
				title="Favorite"
			/>
		{/if}

		{#if isOwner}
			<CircleIconButton
				isOpacity={true}
				logo={DeleteOutline}
				on:click={() => dispatch('delete')}
				title="Delete"
			/>
			<div use:clickOutside on:outclick={() => (isShowAssetOptions = false)}>
				<CircleIconButton
					isOpacity={true}
					logo={DotsVertical}
					on:click={showOptionsMenu}
					title="More"
				>
					{#if isShowAssetOptions}
						<ContextMenu {...contextMenuPosition} direction="left">
							<MenuOption on:click={() => onMenuClick('addToAlbum')} text="Add to Album" />
							<MenuOption
								on:click={() => onMenuClick('addToSharedAlbum')}
								text="Add to Shared Album"
							/>

							{#if isOwner}
								<MenuOption
									on:click={() => dispatch('toggleArchive')}
									text={asset.isArchived ? 'Unarchive' : 'Archive'}
								/>
							{/if}
						</ContextMenu>
					{/if}
				</CircleIconButton>
			</div>
		{/if}
	</div>
</div>
