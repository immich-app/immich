<script lang="ts">
	import { fade } from 'svelte/transition';

	import { createEventDispatcher, onMount } from 'svelte';
	import LoadingSpinner from '../shared-components/loading-spinner.svelte';
	import { api, AssetResponseDto, getFileUrl } from '@api';

	export let assetId: string;

	let asset: AssetResponseDto;

	const dispatch = createEventDispatcher();

	let videoPlayerNode: HTMLVideoElement;
	let isVideoLoading = true;
	let videoUrl: string;

	onMount(async () => {
		const { data: assetInfo } = await api.assetApi.getAssetById(assetId);

		await loadVideoData(assetInfo);
		
		asset = assetInfo;
	});

	const loadVideoData = async (assetInfo: AssetResponseDto) => {
		isVideoLoading = true;

		// try {
		// 	const { data } = await api.assetApi.serveFile(
		// 		asset.deviceAssetId,
		// 		asset.deviceId,
		// 		false,
		// 		true,
		// 		{
		// 			responseType: 'blob'
		// 		}
		// 	);

		// 	if (!(data instanceof Blob)) {
		// 		return;
		// 	}

		// 	const videoData = URL.createObjectURL(data);
		// 	videoPlayerNode.src = videoData;

		// 	videoPlayerNode.load();

		// 	videoPlayerNode.oncanplay = () => {
		// 		videoPlayerNode.muted = true;
		// 		videoPlayerNode.play();
		// 		videoPlayerNode.muted = false;

		// 		isVideoLoading = false;
		// 	};

		// 	return videoData;
		// } catch (e) {}
		let url = getFileUrl(assetInfo.deviceAssetId, assetInfo.deviceId, false, true);
		videoUrl = window.location.origin + url;

		return assetInfo;
	};

	const handleCanPlay = () => {
		videoPlayerNode.muted = true;
		videoPlayerNode.play();
		videoPlayerNode.muted = false;

		isVideoLoading = false;
	}
</script>

<div
	transition:fade={{ duration: 150 }}
	class="flex place-items-center place-content-center h-full select-none"
>
	{#if asset}
		<video controls class="h-full object-contain" on:canplay={handleCanPlay} bind:this={videoPlayerNode}>
			<source src="{videoUrl}" type="{asset.mimeType}" />
			<track kind="captions" />
		</video>

		{#if isVideoLoading}
			<div class="absolute flex place-items-center place-content-center">
				<LoadingSpinner />
			</div>
		{/if}
	{/if}
</div>
