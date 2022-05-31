<script lang="ts">
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';

	import AsserViewerNavBar from './asser_viewer_nav_bar.svelte';
	import { flattenAssetGroupByDate } from '$lib/stores/assets';
	import ChevronRight from 'svelte-material-icons/ChevronRight.svelte';
	import ChevronLeft from 'svelte-material-icons/ChevronLeft.svelte';
	import { AssetType, type ImmichAsset } from '../../models/immich-asset';
	import PhotoViewer from './photo_viewer.svelte';
	const dispatch = createEventDispatcher();

	export let selectedAsset: ImmichAsset;
	export let selectedIndex: number;

	let viewDeviceId: string;
	let viewAssetId: string;

	let halfLeftHover = false;
	let halfRightHover = false;

	onMount(() => {
		viewAssetId = selectedAsset.id;
		viewDeviceId = selectedAsset.deviceId;
		pushState(viewAssetId);

		document.addEventListener('keydown', (keyInfo) => handleKeyboardPress(keyInfo.key));
	});

	onDestroy(() => {
		document.removeEventListener('keydown', (b) => {
			console.log('destroyed', b);
		});
	});

	const handleKeyboardPress = (key: string) => {
		switch (key) {
			case 'Escape':
				closeViewer();
				return;
		}
	};

	const closeViewer = () => {
		history.pushState(null, '', `/photos`);
		dispatch('close');
	};

	const navigateAssetForward = () => {
		const nextAsset = $flattenAssetGroupByDate[selectedIndex + 1];
		viewDeviceId = nextAsset.deviceId;
		viewAssetId = nextAsset.id;

		selectedIndex = selectedIndex + 1;
		selectedAsset = $flattenAssetGroupByDate[selectedIndex];
		pushState(viewAssetId);
	};

	const navigateAssetBackward = () => {
		const lastAsset = $flattenAssetGroupByDate[selectedIndex - 1];
		viewDeviceId = lastAsset.deviceId;
		viewAssetId = lastAsset.id;

		selectedIndex = selectedIndex - 1;
		selectedAsset = $flattenAssetGroupByDate[selectedIndex];
		pushState(viewAssetId);
	};

	const pushState = (assetId: string) => {
		// add a URL to the browser's history
		// changes the current URL in the address bar but doesn't perform any SvelteKit navigation
		history.pushState(null, '', `/photos/${assetId}`);
	};
</script>

<section
	id="immich-asset-viewer"
	class="absolute w-screen h-screen top-0 overflow-y-hidden bg-black z-[999] flex justify-between place-items-center"
>
	<AsserViewerNavBar asset={selectedAsset} on:goBack={closeViewer} />

	<div
		id="left-navigation-area"
		class="absolute left-0 top-0 bg-transparent w-1/3 h-full z-[1000] flex place-items-center hover:cursor-pointer"
		on:mouseenter={() => {
			halfLeftHover = true;
			halfRightHover = false;
		}}
		on:mouseleave={() => {
			halfLeftHover = false;
		}}
		on:click={navigateAssetBackward}
	>
		<button
			class="rounded-full p-3 hover:bg-gray-500 hover:text-gray-700  text-gray-500 mx-4"
			class:button-hover={halfLeftHover}
			on:click={navigateAssetBackward}
		>
			<ChevronLeft size="36" />
		</button>
	</div>

	{#key selectedIndex}
		{#if viewAssetId && viewDeviceId}
			{#if selectedAsset.type == AssetType.IMAGE}
				<PhotoViewer assetId={viewAssetId} deviceId={viewDeviceId} on:close={closeViewer} />
			{:else}
				<div
					class="w-full h-full bg-immich-primary/10 flex flex-col place-items-center place-content-center "
					on:click={closeViewer}
				>
					<h1 class="animate-pulse font-bold text-4xl">Video viewer is under construction</h1>
				</div>
			{/if}
		{/if}
	{/key}

	<div
		id="right-navigation-area"
		class="absolute right-0 top-0 bg-transparent w-1/3 h-full z-[1000] flex justify-end place-items-center hover:cursor-pointer"
		on:click={navigateAssetForward}
		on:mouseenter={() => {
			halfLeftHover = false;
			halfRightHover = true;
		}}
		on:mouseleave={() => {
			halfRightHover = false;
		}}
	>
		<button
			class="rounded-full p-3 hover:bg-gray-500 hover:text-gray-700 text-gray-500 mx-4"
			class:button-hover={halfRightHover}
			on:click={navigateAssetForward}
		>
			<ChevronRight size="36" />
		</button>
	</div>
</section>

<style>
	.button-hover {
		background-color: rgb(107 114 128 / var(--tw-bg-opacity));
		color: rgb(55 65 81 / var(--tw-text-opacity));
	}
</style>
