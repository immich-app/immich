<script lang="ts">
	import { AssetType, type ImmichAsset } from '../../models/immich-asset';
	import { session } from '$app/stores';
	import { createEventDispatcher, onDestroy } from 'svelte';
	import { fade, fly, slide } from 'svelte/transition';
	import { serverEndpoint } from '../../constants';
	import IntersectionObserver from '$lib/components/asset-viewer/intersection-observer.svelte';
	import CheckCircle from 'svelte-material-icons/CheckCircle.svelte';
	import PlayCircleOutline from 'svelte-material-icons/PlayCircleOutline.svelte';
	import PauseCircleOutline from 'svelte-material-icons/PauseCircleOutline.svelte';
	import LoadingSpinner from '../shared/loading-spinner.svelte';

	const dispatch = createEventDispatcher();

	export let asset: ImmichAsset;
	export let groupIndex: number;

	let imageData: string;
	let videoData: string;

	let mouseOver: boolean = false;
	$: dispatch('mouseEvent', { isMouseOver: mouseOver, selectedGroupIndex: groupIndex });

	let mouseOverIcon: boolean = false;
	let videoPlayerNode: HTMLVideoElement;
	let isThumbnailVideoPlaying = false;
	let calculateVideoDurationIntervalHandler: NodeJS.Timer;
	let videoProgress = '00:00';

	const loadImageData = async () => {
		if ($session.user) {
			const res = await fetch(serverEndpoint + '/asset/thumbnail/' + asset.id, {
				method: 'GET',
				headers: {
					Authorization: 'bearer ' + $session.user.accessToken,
				},
			});

			imageData = URL.createObjectURL(await res.blob());

			return imageData;
		}
	};

	const loadVideoData = async () => {
		isThumbnailVideoPlaying = false;
		const videoUrl = `/asset/file?aid=${asset.deviceAssetId}&did=${asset.deviceId}&isWeb=true`;

		if ($session.user) {
			try {
				const res = await fetch(serverEndpoint + videoUrl, {
					method: 'GET',
					headers: {
						Authorization: 'bearer ' + $session.user.accessToken,
						'Accept-Range': 'bytes',
					},
				});

				videoData = URL.createObjectURL(await res.blob());

				videoPlayerNode.src = videoData;
				// videoPlayerNode.src = videoData + '#t=0,5';

				videoPlayerNode.load();

				videoPlayerNode.onloadeddata = () => {
					console.log('first frame load');
				};

				videoPlayerNode.oncanplaythrough = () => {
					console.log('can play through');
				};

				videoPlayerNode.oncanplay = () => {
					console.log('can play');
					videoPlayerNode.muted = true;
					videoPlayerNode.play();

					isThumbnailVideoPlaying = true;
					calculateVideoDurationIntervalHandler = setInterval(() => {
						videoProgress = getVideoDurationInString(Math.round(videoPlayerNode.currentTime));
					}, 1000);
				};

				return videoData;
			} catch (e) {}
		}
	};

	const getVideoDurationInString = (currentTime: number) => {
		const minute = Math.floor(currentTime / 60);
		const second = currentTime % 60;

		const minuteText = minute >= 10 ? `${minute}` : `0${minute}`;
		const secondText = second >= 10 ? `${second}` : `0${second}`;

		return minuteText + ':' + secondText;
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

	onDestroy(() => {
		URL.revokeObjectURL(imageData);
	});

	const getSize = () => {
		if (asset.exifInfo?.orientation === 'Rotate 90 CW') {
			return 'w-[176px] h-[235px]';
		} else if (asset.exifInfo?.orientation === 'Horizontal (normal)') {
			return 'w-[313px] h-[235px]';
		} else {
			return 'w-[235px] h-[235px]';
		}
	};

	const handleMouseOverThumbnail = () => {
		mouseOver = true;
	};

	const handleMouseLeaveThumbnail = () => {
		mouseOver = false;
		URL.revokeObjectURL(videoData);

		clearInterval(calculateVideoDurationIntervalHandler);

		isThumbnailVideoPlaying = false;
		videoProgress = '00:00';
	};
</script>

<IntersectionObserver once={true} let:intersecting>
	<div
		class={`bg-gray-100 relative hover:cursor-pointer ${getSize()}`}
		on:mouseenter={handleMouseOverThumbnail}
		on:mouseleave={handleMouseLeaveThumbnail}
		on:click={() => dispatch('viewAsset', { assetId: asset.id, deviceId: asset.deviceId })}
	>
		{#if mouseOver}
			<div
				in:fade={{ duration: 200 }}
				class="w-full  bg-gradient-to-b from-gray-800/50 via-white/0 to-white/0 absolute p-2  z-10"
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

		<!-- Playback and info -->
		{#if asset.type === AssetType.VIDEO}
			<div class="absolute right-2 top-2 text-white text-xs font-medium flex gap-1 place-items-center z-10">
				{#if isThumbnailVideoPlaying}
					<span in:fly={{ x: -25, duration: 500 }}>
						{videoProgress}
					</span>
				{:else}
					<span in:fade={{ duration: 500 }}>
						{parseVideoDuration(asset.duration)}
					</span>
				{/if}

				{#if mouseOver}
					{#if isThumbnailVideoPlaying}
						<span in:fly={{ x: 25, duration: 500 }}>
							<PauseCircleOutline size="24" />
						</span>
					{:else}
						<span in:fade={{ duration: 250 }}>
							<LoadingSpinner />
						</span>
					{/if}
				{:else}
					<span in:fade={{ duration: 500 }}>
						<PlayCircleOutline size="24" />
					</span>
				{/if}
			</div>
		{/if}

		<!-- Thumbnail -->
		{#if intersecting}
			{#await loadImageData()}
				<div class={`bg-immich-primary/10 ${getSize()} flex place-items-center place-content-center`}>...</div>
			{:then imageData}
				<img
					in:fade={{ duration: 250 }}
					src={imageData}
					alt={asset.id}
					class={`object-cover ${getSize()} transition-all duration-100 z-0`}
					loading="lazy"
				/>
			{/await}
		{/if}

		{#if mouseOver && asset.type === AssetType.VIDEO}
			<div class="absolute w-full h-full top-0" on:mouseenter={loadVideoData}>
				<video muted autoplay preload="none" class="h-full object-cover" width="250px" bind:this={videoPlayerNode}>
					<track kind="captions" />
				</video>
			</div>
		{/if}
	</div>
</IntersectionObserver>
