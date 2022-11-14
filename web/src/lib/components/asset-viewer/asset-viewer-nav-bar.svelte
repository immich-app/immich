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

	import { page } from '$app/stores';
	import { AssetResponseDto } from '../../../api';

	export let asset: AssetResponseDto;
	export let showCopyButton: boolean;

	const isOwner = asset.ownerId === $page.data.user.id;

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
	class="h-16 bg-black/5 flex justify-between place-items-center px-3 transition-transform duration-200 z-[9999]"
>
	<div>
		<CircleIconButton logo={ArrowLeft} on:click={() => dispatch('goBack')} />
	</div>
	<div class="text-white flex gap-2">
		{#if showCopyButton}
			<CircleIconButton
				logo={ContentCopy}
				on:click={() => {
					const copyEvent = new CustomEvent('copyImage');
					window.dispatchEvent(copyEvent);
				}}
			/>
		{/if}
		<CircleIconButton logo={CloudDownloadOutline} on:click={() => dispatch('download')} />
		<CircleIconButton logo={InformationOutline} on:click={() => dispatch('showDetail')} />
		{#if isOwner}
			<CircleIconButton
				logo={asset.isFavorite ? Star : StarOutline}
				on:click={() => dispatch('favorite')}
				title="Favorite"
			/>
		{/if}
		<CircleIconButton logo={DeleteOutline} on:click={() => dispatch('delete')} />
		<CircleIconButton logo={DotsVertical} on:click={(event) => showOptionsMenu(event)} />
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
