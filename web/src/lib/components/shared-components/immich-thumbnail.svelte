<script lang="ts">
	import IntersectionObserver from '$lib/components/asset-viewer/intersection-observer.svelte';
	import { AssetResponseDto, AssetTypeEnum, getFileUrl, ThumbnailFormat } from '@api';
	import { createEventDispatcher } from 'svelte';
	import CheckCircle from 'svelte-material-icons/CheckCircle.svelte';
	import MotionPauseOutline from 'svelte-material-icons/MotionPauseOutline.svelte';
	import MotionPlayOutline from 'svelte-material-icons/MotionPlayOutline.svelte';
	import PauseCircleOutline from 'svelte-material-icons/PauseCircleOutline.svelte';
	import PlayCircleOutline from 'svelte-material-icons/PlayCircleOutline.svelte';
	import Star from 'svelte-material-icons/Star.svelte';
	import { fade, fly } from 'svelte/transition';
	import LoadingSpinner from './loading-spinner.svelte';

	const dispatch = createEventDispatcher();

	export let asset: AssetResponseDto;
	export let groupIndex = 0;
	export let thumbnailSize: number | undefined = undefined;
	export let format: ThumbnailFormat = ThumbnailFormat.Webp;
	export let selected = false;
	export let disabled = false;
	export let publicSharedKey = '';
	export let isRoundedCorner = false;

	let mouseOver = false;
	let playMotionVideo = false;
	$: dispatch('mouse-event', { isMouseOver: mouseOver, selectedGroupIndex: groupIndex });

	let mouseOverIcon = false;
	let videoPlayerNode: HTMLVideoElement;
	let isImageLoading = true;
	let isThumbnailVideoPlaying = false;
	let calculateVideoDurationIntervalHandler: NodeJS.Timer;
	let videoProgress = '00:00';
	let videoUrl: string;
	$: isPublicShared = publicSharedKey !== '';

	const loadVideoData = async (isLivePhoto: boolean) => {
		isThumbnailVideoPlaying = false;

		if (isLivePhoto && asset.livePhotoVideoId) {
			videoUrl = getFileUrl(asset.livePhotoVideoId, false, true, publicSharedKey);
		} else {
			videoUrl = getFileUrl(asset.id, false, true, publicSharedKey);
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

		if (videoPlayerNode) {
			videoPlayerNode.pause();
		}
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
		} else if (disabled) {
			return 'border-[20px] border-gray-300';
		} else if (isRoundedCorner) {
			return 'rounded-[20px]';
		} else {
			return '';
		}
	};

	$: getOverlaySelectorIconStyle = () => {
		if (selected || disabled) {
			return '';
		} else {
			return 'bg-gradient-to-b from-gray-800/50';
		}
	};
	const thumbnailClickedHandler = () => {
		if (!disabled) {
			dispatch('click', { asset });
		}
	};

	const onIconClickedHandler = (e: MouseEvent) => {
		e.stopPropagation();
		if (!disabled) {
			dispatch('select', { asset });
		}
	};
</script>

<IntersectionObserver once={false} let:intersecting>
	<div
		style:width={`${thumbnailSize}px`}
		style:height={`${thumbnailSize}px`}
		class={`bg-gray-100 dark:bg-immich-dark-gray relative select-none ${getSize()} ${
			disabled ? 'cursor-not-allowed' : 'hover:cursor-pointer'
		}`}
		on:mouseenter={handleMouseOverThumbnail}
		on:mouseleave={handleMouseLeaveThumbnail}
		on:click={thumbnailClickedHandler}
		on:keydown={thumbnailClickedHandler}
	>
		{#if mouseOver || selected || disabled}
			<div
				in:fade={{ duration: 200 }}
				class={`w-full ${getOverlaySelectorIconStyle()} via-white/0 to-white/0 absolute p-2 z-10`}
			>
				<button
					on:click={onIconClickedHandler}
					on:mouseenter={() => (mouseOverIcon = true)}
					on:mouseleave={() => (mouseOverIcon = false)}
					class="inline-block"
				>
					{#if selected}
						<CheckCircle size="24" color="#4250af" />
					{:else if disabled}
						<CheckCircle size="24" color="#252525" />
					{:else}
						<CheckCircle size="24" color={mouseOverIcon ? 'white' : '#d8dadb'} />
					{/if}
				</button>
			</div>
		{/if}

		{#if asset.isFavorite && !isPublicShared}
			<div class="w-full absolute bottom-2 left-2 z-10">
				<Star size="24" color={'white'} />
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

		{#if asset.type === AssetTypeEnum.Image && asset.livePhotoVideoId}
			<div
				class="absolute right-2 top-2 text-white text-xs font-medium flex gap-1 place-items-center z-10"
			>
				<span
					in:fade={{ duration: 500 }}
					on:mouseenter={() => {
						playMotionVideo = true;
						loadVideoData(true);
					}}
					on:mouseleave={() => (playMotionVideo = false)}
				>
					{#if playMotionVideo}
						<span in:fade={{ duration: 500 }}>
							<MotionPauseOutline size="24" />
						</span>
					{:else}
						<span in:fade={{ duration: 500 }}>
							<MotionPlayOutline size="24" />
						</span>
					{/if}
				</span>
				<!-- {/if} -->
			</div>
		{/if}

		<!-- Thumbnail -->
		{#if intersecting}
			<img
				id={asset.id}
				style:width={`${thumbnailSize}px`}
				style:height={`${thumbnailSize}px`}
				src={`/api/asset/thumbnail/${asset.id}?format=${format}&key=${publicSharedKey}`}
				alt={asset.id}
				class={`object-cover ${getSize()} transition-all z-0 ${getThumbnailBorderStyle()}`}
				class:opacity-0={isImageLoading}
				loading="lazy"
				draggable="false"
				on:load|once={() => (isImageLoading = false)}
			/>
		{/if}

		{#if mouseOver && asset.type === AssetTypeEnum.Video}
			<div class="absolute w-full h-full top-0" on:mouseenter={() => loadVideoData(false)}>
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

		{#if playMotionVideo && asset.type === AssetTypeEnum.Image && asset.livePhotoVideoId}
			<div class="absolute w-full h-full top-0">
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

<style>
	img {
		transition: 0.2s ease all;
	}
</style>
