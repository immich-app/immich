<script lang="ts">
	import { AssetType, type ImmichAsset } from '../../models/immich-asset';
	import { session } from '$app/stores';
	import { createEventDispatcher, onDestroy } from 'svelte';
	import { fade } from 'svelte/transition';
	import { serverEndpoint } from '../../constants';
	import IntersectionObserver from '$lib/components/asset-viewer/intersection-observer.svelte';
	import CheckCircle from 'svelte-material-icons/CheckCircle.svelte';
	import PlayCircleOutline from 'svelte-material-icons/PlayCircleOutline.svelte';

	const dispatch = createEventDispatcher();

	export let asset: ImmichAsset;
	export let groupIndex: number;

	let imageContent: string;
	let mouseOver: boolean = false;
	$: dispatch('mouseEvent', { isMouseOver: mouseOver, selectedGroupIndex: groupIndex });

	let mouseOverIcon: boolean = false;
	let videoPlayerNode: HTMLVideoElement;

	const loadImageData = async () => {
		if ($session.user) {
			const res = await fetch(serverEndpoint + '/asset/thumbnail/' + asset.id, {
				method: 'GET',
				headers: {
					Authorization: 'bearer ' + $session.user.accessToken,
				},
			});

			imageContent = URL.createObjectURL(await res.blob());

			return imageContent;
		}
	};

	const loadVideoData = async () => {
		const videoUrl = `/asset/file?aid=${asset.deviceAssetId}&did=${asset.deviceId}`;
		if ($session.user) {
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
				console.log('Can play video');
			};

			return videoData;
		}
	};

	const parseVideoDuration = (duration: string) => {
		const timePart = duration.split(':');
		const hours = timePart[0];
		const minutes = timePart[1];
		const seconds = timePart[2];

		if (hours != '0') {
			return `${hours}:${minutes}`;
		} else {
			return `${minutes}:${seconds.split('.')[0]}`;
		}
	};

	onDestroy(() => URL.revokeObjectURL(imageContent));

	const getSize = () => {
		if (asset.exifInfo?.orientation === 'Rotate 90 CW') {
			return 'w-[176px] h-[235px]';
		} else if (asset.exifInfo?.orientation === 'Horizontal (normal)') {
			return 'w-[313px] h-[235px]';
		} else {
			return 'w-[235px] h-[235px]';
		}
	};
</script>

<IntersectionObserver once={true} let:intersecting>
	<div
		class={`bg-gray-100 relative hover:cursor-pointer ${getSize()}`}
		on:mouseenter={() => (mouseOver = true)}
		on:mouseleave={() => (mouseOver = false)}
		on:click={() => dispatch('viewAsset', { assetId: asset.id, deviceId: asset.deviceId })}
	>
		{#if mouseOver}
			<div
				in:fade={{ duration: 200 }}
				class="w-full h-full bg-gradient-to-b from-gray-800/50 via-white/0 to-white/0 absolute p-2"
			>
				<div
					on:mouseenter={() => (mouseOverIcon = true)}
					on:mouseleave={() => (mouseOverIcon = false)}
					class="inline-block"
				>
					<CheckCircle size="24" color={mouseOverIcon ? 'white' : '#d8dadb'} />
				</div>
			</div>
		{/if}

		{#if asset.type === AssetType.VIDEO}
			<div class="absolute right-2 top-2 text-white text-xs font-medium flex gap-1 place-items-center">
				{parseVideoDuration(asset.duration)}
				<PlayCircleOutline size="24" />
			</div>
		{/if}

		{#if intersecting}
			{#await loadImageData()}
				<div class={`bg-immich-primary/10 ${getSize()} flex place-items-center place-content-center`}>...</div>
			{:then imageData}
				<img
					src={imageData}
					alt={asset.id}
					class={`object-cover ${getSize()} transition-all duration-100 z-0`}
					loading="lazy"
				/>
			{/await}
		{/if}

		<!-- {#if mouseOver && asset.type === AssetType.VIDEO}
			<div class="absolute w-full h-full top-0" on:mouseenter={loadVideoData}>
				<video autoplay class="border-2 h-[200px]" width="250px" bind:this={videoPlayerNode}>
					<track kind="captions" />
				</video>
			</div>
		{/if} -->
	</div>
</IntersectionObserver>
