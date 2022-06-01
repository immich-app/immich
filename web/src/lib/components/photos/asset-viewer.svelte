<script lang="ts">
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';
	import { fly, slide } from 'svelte/transition';
	import { elasticInOut } from 'svelte/easing';
	import AsserViewerNavBar from './asser-viewer-nav-bar.svelte';
	import { flattenAssetGroupByDate } from '$lib/stores/assets';
	import ChevronRight from 'svelte-material-icons/ChevronRight.svelte';
	import ChevronLeft from 'svelte-material-icons/ChevronLeft.svelte';
	import { AssetType, type ImmichAsset, type ImmichExif } from '../../models/immich-asset';
	import PhotoViewer from './photo-viewer.svelte';
	import DetailPanel from './detail-panel.svelte';

	const dispatch = createEventDispatcher();

	export let selectedAsset: ImmichAsset;
	export let selectedIndex: number;

	let viewDeviceId: string;
	let viewAssetId: string;

	let halfLeftHover = false;
	let halfRightHover = false;
	let isShowDetail = false;
	let exifInfo: ImmichExif;

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

	const showDetailInfoHandler = () => {
		isShowDetail = !isShowDetail;
		console.log(isShowDetail);
	};
</script>

<!-- ${isShowDetail && 'grid-cols-4'} -->
<section
	id="immich-asset-viewer"
	class="absolute h-screen w-screen top-0 overflow-y-hidden bg-black z-[999] grid grid-rows-[64px_1fr] grid-cols-4  "
>
	<div class="av-navbar-area z-[1000] transition-transform">
		<AsserViewerNavBar asset={selectedAsset} on:goBack={closeViewer} on:showDetail={showDetailInfoHandler} />
	</div>

	<div
		class="av-left-navigation-area z-[1000] flex place-items-center hover:cursor-pointer w-3/4"
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

	<div class="av-viewer-area">
		{#key selectedIndex}
			{#if viewAssetId && viewDeviceId}
				{#if selectedAsset.type == AssetType.IMAGE}
					<PhotoViewer assetId={viewAssetId} deviceId={viewDeviceId} on:close={closeViewer} bind:exifInfo />
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
	</div>

	<div
		class="av-right-navigation-area  z-[1000] flex justify-end place-items-center hover:cursor-pointer w-3/4 justify-self-end"
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

	{#if isShowDetail}
		<div
			transition:fly={{ duration: 150 }}
			id="detail-panel"
			class="bg-immich-bg w-[360px] row-span-full transition-all "
			translate="yes"
		>
			<DetailPanel {exifInfo} assetInfo={selectedAsset} />
		</div>
	{/if}
</section>

<style>
	.button-hover {
		background-color: rgb(107 114 128 / var(--tw-bg-opacity));
		color: rgb(55 65 81 / var(--tw-text-opacity));
	}

	.av-navbar-area {
		grid-row: 1 / span 1;
		grid-column: 1 / span 4;
	}

	.av-viewer-area {
		grid-row: 1 / span end;
		grid-column: 1 / span 4;
	}

	.av-left-navigation-area {
		grid-row: 2 / span end;
		grid-column: 1 / span 2;
	}

	.av-right-navigation-area {
		grid-row: 2 / span end;
		grid-column: 3 / span 2;
	}
</style>
