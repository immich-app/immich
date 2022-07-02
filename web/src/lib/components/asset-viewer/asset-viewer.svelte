<script lang="ts">
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';
	import { fly, slide } from 'svelte/transition';
	import AsserViewerNavBar from './asser-viewer-nav-bar.svelte';
	import { flattenAssetGroupByDate } from '$lib/stores/assets';
	import ChevronRight from 'svelte-material-icons/ChevronRight.svelte';
	import ChevronLeft from 'svelte-material-icons/ChevronLeft.svelte';
	import { AssetType, type ImmichAsset, type ImmichExif } from '../../models/immich-asset';
	import PhotoViewer from './photo-viewer.svelte';
	import DetailPanel from './detail-panel.svelte';
	import { session } from '$app/stores';
	import { serverEndpoint } from '../../constants';
	import axios from 'axios';
	import { downloadAssets } from '$lib/stores/download';
	import VideoViewer from './video-viewer.svelte';

	const dispatch = createEventDispatcher();

	export let selectedAsset: ImmichAsset;

	export let selectedIndex: number;

	let viewDeviceId: string;
	let viewAssetId: string;

	let halfLeftHover = false;
	let halfRightHover = false;
	let isShowDetail = false;

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
			case 'i':
				isShowDetail = !isShowDetail;
				return;
			case 'ArrowLeft':
				navigateAssetBackward();
				return;
			case 'ArrowRight':
				navigateAssetForward();
				return;
		}
	};

	const closeViewer = () => {
		history.pushState(null, '', `/photos`);
		dispatch('close');
	};

	const navigateAssetForward = (e?: Event) => {
		e?.stopPropagation();

		const nextAsset = $flattenAssetGroupByDate[selectedIndex + 1];
		viewDeviceId = nextAsset.deviceId;
		viewAssetId = nextAsset.id;

		selectedIndex = selectedIndex + 1;
		selectedAsset = $flattenAssetGroupByDate[selectedIndex];
		pushState(viewAssetId);
	};

	const navigateAssetBackward = (e?: Event) => {
		e?.stopPropagation();

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
	};

	const downloadFile = async () => {
		if ($session.user) {
			const url = `${serverEndpoint}/asset/download?aid=${selectedAsset.deviceAssetId}&did=${selectedAsset.deviceId}&isThumb=false`;

			try {
				const imageName = selectedAsset.exifInfo?.imageName ? selectedAsset.exifInfo?.imageName : selectedAsset.id;
				const imageExtension = selectedAsset.originalPath.split('.')[1];
				const imageFileName = imageName + '.' + imageExtension;

				// If assets is already download -> return;
				if ($downloadAssets[imageFileName]) {
					return;
				}
				$downloadAssets[imageFileName] = 0;

				const res = await axios.get(url, {
					responseType: 'blob',
					headers: {
						Authorization: 'Bearer ' + $session.user.accessToken,
					},
					onDownloadProgress: (progressEvent) => {
						if (progressEvent.lengthComputable) {
							const total = progressEvent.total;
							const current = progressEvent.loaded;
							let percentCompleted = Math.floor((current / total) * 100);

							$downloadAssets[imageFileName] = percentCompleted;
						}
					},
				});

				if (res.status === 200) {
					const fileUrl = URL.createObjectURL(new Blob([res.data]));
					const anchor = document.createElement('a');
					anchor.href = fileUrl;
					anchor.download = imageFileName;

					document.body.appendChild(anchor);
					anchor.click();
					document.body.removeChild(anchor);

					URL.revokeObjectURL(fileUrl);

					// Remove item from download list
					setTimeout(() => {
						const copy = $downloadAssets;
						delete copy[imageFileName];
						$downloadAssets = copy;
					}, 2000);
				}
			} catch (e) {
				console.log('Error downloading file ', e);
			}
		}
	};
</script>

<section
	id="immich-asset-viewer"
	class="absolute h-screen w-screen top-0 overflow-y-hidden bg-black z-[999] grid grid-rows-[64px_1fr] grid-cols-4  "
>
	<div class="col-start-1 col-span-4 row-start-1 row-span-1 z-[1000] transition-transform">
		<AsserViewerNavBar on:goBack={closeViewer} on:showDetail={showDetailInfoHandler} on:download={downloadFile} />
	</div>

	<div
		class={`row-start-2 row-span-end col-start-1 col-span-2 flex place-items-center hover:cursor-pointer w-3/4 ${
			selectedAsset.type == 'VIDEO' ? '' : 'z-[999]'
		}`}
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
			class="rounded-full p-3 hover:bg-gray-500 hover:text-gray-700 z-[1000]  text-gray-500 mx-4"
			class:navigation-button-hover={halfLeftHover}
			on:click={navigateAssetBackward}
		>
			<ChevronLeft size="36" />
		</button>
	</div>

	<div class="row-start-1 row-span-full col-start-1 col-span-4">
		{#key selectedIndex}
			{#if viewAssetId && viewDeviceId}
				{#if selectedAsset.type == AssetType.IMAGE}
					<PhotoViewer assetId={viewAssetId} deviceId={viewDeviceId} on:close={closeViewer} />
				{:else}
					<VideoViewer assetId={viewAssetId} on:close={closeViewer} />
				{/if}
			{/if}
		{/key}
	</div>

	<div
		class={`row-start-2 row-span-full col-start-3 col-span-2 flex justify-end place-items-center hover:cursor-pointer w-3/4 justify-self-end ${
			selectedAsset.type == 'VIDEO' ? '' : 'z-[500]'
		}`}
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
			class="rounded-full p-3 hover:bg-gray-500 hover:text-gray-700 text-gray-500 mx-4 z-[1000]"
			class:navigation-button-hover={halfRightHover}
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
			<DetailPanel asset={selectedAsset} on:close={() => (isShowDetail = false)} />
		</div>
	{/if}
</section>

<style>
	.navigation-button-hover {
		background-color: rgb(107 114 128 / var(--tw-bg-opacity));
		color: rgb(55 65 81 / var(--tw-text-opacity));
		transition: all 150ms;
	}
</style>
