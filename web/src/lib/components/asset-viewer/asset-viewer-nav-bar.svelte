<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	import { clickOutside } from '$lib/utils/click-outside';
	import ArrowLeft from 'svelte-material-icons/ArrowLeft.svelte';
	import CloudDownloadOutline from 'svelte-material-icons/CloudDownloadOutline.svelte';
	import InformationOutline from 'svelte-material-icons/InformationOutline.svelte';
	import DotsVertical from 'svelte-material-icons/DotsVertical.svelte';
	import DeleteOutline from 'svelte-material-icons/DeleteOutline.svelte';
	import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';
	import ContextMenu from '../shared-components/context-menu/context-menu.svelte';
	import MenuOption from '../shared-components/context-menu/menu-option.svelte';
	import Star from 'svelte-material-icons/Star.svelte';
	import StarOutline from 'svelte-material-icons/StarOutline.svelte';
	import ContentCopy from 'svelte-material-icons/ContentCopy.svelte';
	import MotionPlayOutline from 'svelte-material-icons/MotionPlayOutline.svelte';
	import MotionPauseOutline from 'svelte-material-icons/MotionPauseOutline.svelte';
	import ArchiveArrowDownOutline from 'svelte-material-icons/ArchiveArrowDownOutline.svelte';
	import ArchiveArrowUpOutline from 'svelte-material-icons/ArchiveArrowUpOutline.svelte';

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
	class="h-16 flex justify-between place-items-center px-3 transition-transform duration-200 z-[1001]"
>
	<div>
		<CircleIconButton logo={ArrowLeft} on:click={() => dispatch('goBack')} />
	</div>
	<div class="text-white flex gap-2 justify-end w-[calc(100%-3rem)] overflow-hidden">
		{#if isOwner}
			<CircleIconButton
				logo={asset.isArchived ? ArchiveArrowUpOutline : ArchiveArrowDownOutline}
				title={asset.isArchived ? 'Unarchive' : 'Archive'}
				on:click={() => dispatch('toggleArchive')}
			/>
		{/if}

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
			<div use:clickOutside on:outclick={() => (isShowAssetOptions = false)}>
				<CircleIconButton logo={DotsVertical} on:click={showOptionsMenu} title="More">
					{#if isShowAssetOptions}
						<ContextMenu {...contextMenuPosition}>
							<div class="flex flex-col rounded-lg ">
								<MenuOption on:click={() => onMenuClick('addToAlbum')} text="Add to Album" />
								<MenuOption
									on:click={() => onMenuClick('addToSharedAlbum')}
									text="Add to Shared Album"
								/>
							</div>
						</ContextMenu>
					{/if}
				</CircleIconButton>
			</div>
		{/if}
	</div>
</div>
