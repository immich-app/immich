<script lang="ts">
	import { fade } from 'svelte/transition';

	import { createEventDispatcher, onMount } from 'svelte';
	import LoadingSpinner from '../shared-components/loading-spinner.svelte';
	import { api, AssetResponseDto, getFileUrl } from '@api';

	export let assetId: string;
	export let publicSharedKey = '';
	let asset: AssetResponseDto;

	let isVideoLoading = true;
	let videoUrl: string;
	const dispatch = createEventDispatcher();

	onMount(async () => {
		const { data: assetInfo } = await api.assetApi.getAssetById(assetId, {
			params: {
				key: publicSharedKey
			}
		});

		await loadVideoData(assetInfo);

		asset = assetInfo;
	});

	const loadVideoData = async (assetInfo: AssetResponseDto) => {
		isVideoLoading = true;

		videoUrl = getFileUrl(assetInfo.id, false, true, publicSharedKey);

		return assetInfo;
	};

	const handleCanPlay = (ev: Event) => {
		const playerNode = ev.target as HTMLVideoElement;

		playerNode.muted = true;
		playerNode.play();
		playerNode.muted = false;

		isVideoLoading = false;
	};
</script>

<div
	transition:fade={{ duration: 150 }}
	class="flex place-items-center place-content-center h-full select-none"
>
	{#if asset}
		<video
			controls
			class="h-full object-contain"
			on:canplay={handleCanPlay}
			on:ended={() => dispatch('onVideoEnded')}
		>
			<source src={videoUrl} type="video/mp4" />
			<track kind="captions" />
		</video>

		{#if isVideoLoading}
			<div class="absolute flex place-items-center place-content-center">
				<LoadingSpinner />
			</div>
		{/if}
	{/if}
</div>
