<script lang="ts">
	import { createEventDispatcher, onDestroy } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import IntersectionObserver from '$lib/components/asset-viewer/intersection-observer.svelte';
	import CheckCircle from 'svelte-material-icons/CheckCircle.svelte';
	import PlayCircleOutline from 'svelte-material-icons/PlayCircleOutline.svelte';
	import PauseCircleOutline from 'svelte-material-icons/PauseCircleOutline.svelte';
	import LoadingSpinner from './loading-spinner.svelte';
	import { api, AssetResponseDto, AssetTypeEnum, getFileUrl, ThumbnailFormat } from '@api';

	const dispatch = createEventDispatcher();

	export let asset: AssetResponseDto;
	export let groupIndex = 0;
	export let thumbnailSize: number | undefined = undefined;
	export let format: ThumbnailFormat = ThumbnailFormat.Webp;
	export let selected: boolean = false;
	export let isExisted: boolean = false;

	let imageData: string;
	// let videoData: string;

	let mouseOver: boolean = false;
	$: dispatch('mouseEvent', { isMouseOver: mouseOver, selectedGroupIndex: groupIndex });

	let mouseOverIcon: boolean = false;
	let videoPlayerNode: HTMLVideoElement;
	let isThumbnailVideoPlaying = false;
	let calculateVideoDurationIntervalHandler: NodeJS.Timer;
	let videoProgress = '00:00';
	// let videoAbortController: AbortController;
	let videoUrl: string;

	const loadImageData = async () => {
		const { data } = await api.assetApi.getAssetThumbnail(asset.id, format, {
			responseType: 'blob'
		});
		if (data instanceof Blob) {
			imageData = URL.createObjectURL(data);
			return imageData;
		}
	};

	const loadVideoData = async () => {
		isThumbnailVideoPlaying = false;

		videoUrl = getFileUrl(asset.deviceAssetId, asset.deviceId, false, true);
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
		if (thumbnailSize) {
			return `w-[${thumbnailSize}px] h-[${thumbnailSize}px]`;
		}

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
		videoUrl = '';

		clearInterval(calculateVideoDurationIntervalHandler);

		isThumbnailVideoPlaying = false;
		videoProgress = '00:00';
	};

	const handleCanPlay = (ev: Event) => {
		const playerNode = ev.target as HTMLVideoElement;

		playerNode.muted = true;
		playerNode.play();

		isThumbnailVideoPlaying = true;
		calculateVideoDurationIntervalHandler = setInterval(() => {
			videoProgress = getVideoDurationInString(Math.round(playerNode.currentTime));
		}, 1000);
	};

	$: getThumbnailBorderStyle = () => {
		if (selected) {
			return 'border-[20px] border-immich-primary/20';
		} else if (isExisted) {
			return 'border-[20px] border-gray-300';
		} else {
			return '';
		}
	};

	$: getOverlaySelectorIconStyle = () => {
		if (selected || isExisted) {
			return '';
		} else {
			return 'bg-gradient-to-b from-gray-800/50';
		}
	};
	const thumbnailClickedHandler = () => {
		if (!isExisted) {
			dispatch('click', { asset });
		}
	};

	const onIconClickedHandler = (e: MouseEvent) => {
		e.stopPropagation();
		dispatch('select', { asset });
	};
</script>

<IntersectionObserver once={true} let:intersecting>
	<div
		style:width={`${thumbnailSize}px`}
		style:height={`${thumbnailSize}px`}
		class={`bg-gray-100 relative  ${getSize()} ${
			isExisted ? 'cursor-not-allowed' : 'hover:cursor-pointer'
		}`}
		on:mouseenter={handleMouseOverThumbnail}
		on:mouseleave={handleMouseLeaveThumbnail}
		on:click={thumbnailClickedHandler}
	>
		{#if mouseOver || selected || isExisted}
			<div
				in:fade={{ duration: 200 }}
				class={`w-full ${getOverlaySelectorIconStyle()} via-white/0 to-white/0 absolute p-2  z-10`}
			>
				<button
					on:click={onIconClickedHandler}
					on:mouseenter={() => (mouseOverIcon = true)}
					on:mouseleave={() => (mouseOverIcon = false)}
					class="inline-block"
				>
					{#if selected}
						<CheckCircle size="24" color="#4250af" />
					{:else if isExisted}
						<CheckCircle size="24" color="#252525" />
					{:else}
						<CheckCircle size="24" color={mouseOverIcon ? 'white' : '#d8dadb'} />
					{/if}
				</button>
			</div>
		{/if}

		<!-- Playback and info -->
		{#if asset.type === AssetTypeEnum.Video}
			<div
				class="absolute right-2 top-2 text-white text-xs font-medium flex gap-1 place-items-center z-10"
			>
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
			<img
				style:width={`${thumbnailSize}px`}
				style:height={`${thumbnailSize}px`}
				in:fade={{ duration: 250 }}
				src={`/api/asset/thumbnail/${asset.id}?format=${format}`}
				alt={asset.id}
				class={`object-cover ${getSize()} transition-all duration-100 z-0 ${getThumbnailBorderStyle()}`}
				loading="lazy"
			/>
		{/if}

		{#if mouseOver && asset.type === AssetTypeEnum.Video}
			<div class="absolute w-full h-full top-0" on:mouseenter={loadVideoData}>
				{#if videoUrl}
					<video
						muted
						autoplay
						preload="none"
						class="h-full object-cover"
						width="250px"
						style:width={`${thumbnailSize}px`}
						on:canplay={handleCanPlay}
						bind:this={videoPlayerNode}
					>
						<source src={videoUrl} type="video/mp4" />
						<track kind="captions" />
					</video>
				{/if}
			</div>
		{/if}
	</div>
</IntersectionObserver>
