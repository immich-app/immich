<script lang="ts">
	import { session } from '$app/stores';
	import { serverEndpoint } from '$lib/constants';
	import { fade } from 'svelte/transition';

	import type { ImmichAsset, ImmichExif } from '$lib/models/immich-asset';
	import { createEventDispatcher, onMount } from 'svelte';
	import LoadingSpinner from '../shared/loading-spinner.svelte';

	export let assetId: string;

	let asset: ImmichAsset;

	const dispatch = createEventDispatcher();

	let videoPlayerNode: HTMLVideoElement;
	let isVideoLoading = true;

	onMount(async () => {
		if ($session.user) {
			const res = await fetch(serverEndpoint + '/asset/assetById/' + assetId, {
				headers: {
					Authorization: 'bearer ' + $session.user.accessToken,
				},
			});
			asset = await res.json();

			await loadVideoData();
		}
	});

	const loadVideoData = async () => {
		isVideoLoading = true;
		const videoUrl = `/asset/file?aid=${asset.deviceAssetId}&did=${asset.deviceId}&isWeb=true`;
		if ($session.user) {
			try {
				const res = await fetch(serverEndpoint + videoUrl, {
					method: 'GET',
					headers: {
						Authorization: 'bearer ' + $session.user.accessToken,
					},
				});

				const videoData = URL.createObjectURL(await res.blob());
				videoPlayerNode.src = videoData;

				videoPlayerNode.load();

				videoPlayerNode.oncanplay = () => {
					videoPlayerNode.muted = true;
					videoPlayerNode.play();
					videoPlayerNode.muted = false;

					isVideoLoading = false;
				};

				return videoData;
			} catch (e) {}
		}
	};
</script>

<div transition:fade={{ duration: 150 }} class="flex place-items-center place-content-center h-full select-none">
	{#if asset}
		<video controls class="h-full object-contain" bind:this={videoPlayerNode}>
			<track kind="captions" />
		</video>

		{#if isVideoLoading}
			<div class="absolute w-full h-full bg-black/50 flex place-items-center place-content-center">
				<LoadingSpinner />
			</div>
		{/if}
	{/if}
</div>
