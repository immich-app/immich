<script lang="ts">
	import { memoryStore } from '$lib/stores/memory.store';
	import { DateTime } from 'luxon';
	import { onMount } from 'svelte';
	import { MemoryLaneResponseDto, api } from '@api';
	import { goto } from '$app/navigation';
	import ControlAppBar from '$lib/components/shared-components/control-app-bar.svelte';
	import Play from 'svelte-material-icons/Play.svelte';
	import Pause from 'svelte-material-icons/Pause.svelte';
	import ChevronDown from 'svelte-material-icons/ChevronDown.svelte';
	import ChevronUp from 'svelte-material-icons/ChevronUp.svelte';
	import ChevronLeft from 'svelte-material-icons/ChevronLeft.svelte';
	import ChevronRight from 'svelte-material-icons/ChevronRight.svelte';
	import { AppRoute } from '$lib/constants';
	import { page } from '$app/stores';
	import noThumbnailUrl from '$lib/assets/no-thumbnail.png';
	import GalleryViewer from '$lib/components/shared-components/gallery-viewer/gallery-viewer.svelte';
	import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
	import IntersectionObserver from '$lib/components/asset-viewer/intersection-observer.svelte';
	import { fade } from 'svelte/transition';

	let currentIndex = 0;
	let currentMemory: MemoryLaneResponseDto;
	let nextMemory: MemoryLaneResponseDto;
	let lastMemory: MemoryLaneResponseDto;

	let lastIndex = 0;
	let nextIndex = 0;
	$: showNextMemory = nextIndex <= $memoryStore?.length - 1;
	$: showPreviousMemory = currentIndex != 0;

	let memoryGallery: HTMLElement;
	let memoryWrapper: HTMLElement;
	let galleryInView = false;

	onMount(async () => {
		if (!$memoryStore) {
			const timezone = DateTime.local().zoneName;
			const { data } = await api.assetApi.getMemoryLane({ timezone });
			$memoryStore = data;
		}

		const queryIndex = $page.url.searchParams.get('index');
		if (queryIndex != null) {
			currentIndex = parseInt(queryIndex);
			if (isNaN(currentIndex) || currentIndex > $memoryStore.length - 1) {
				currentIndex = 0;
			}
		}

		currentMemory = $memoryStore[currentIndex];

		nextIndex = currentIndex + 1;
		nextMemory = $memoryStore[nextIndex];

		if (currentIndex > 0) {
			lastMemory = $memoryStore[lastIndex];
		}
	});

	const toNextMemory = (): boolean => {
		if (showNextMemory) {
			resetAutoPlay();

			currentIndex++;
			nextIndex = currentIndex + 1;
			lastIndex = currentIndex - 1;

			currentMemory = $memoryStore[currentIndex];
			nextMemory = $memoryStore[nextIndex];
			lastMemory = $memoryStore[lastIndex];

			return true;
		}

		return false;
	};

	const toPreviousMemory = () => {
		if (showPreviousMemory) {
			resetAutoPlay();

			currentIndex--;
			nextIndex = currentIndex + 1;
			lastIndex = currentIndex - 1;

			currentMemory = $memoryStore[currentIndex];
			nextMemory = $memoryStore[nextIndex];
			lastMemory = $memoryStore[lastIndex];
		}
	};

	let autoPlayInterval: NodeJS.Timeout;
	let autoPlay = false;
	let autoPlaySpeed = 5000;
	let autoPlayProgress = 0;
	let autoPlayIndex = 0;
	let canPlayNext = true;

	const toggleAutoPlay = () => {
		autoPlay = !autoPlay;
		if (autoPlay) {
			autoPlayInterval = setInterval(() => {
				if (!canPlayNext) return;

				window.requestAnimationFrame(() => {
					autoPlayProgress++;
				});

				if (autoPlayProgress > 100) {
					autoPlayProgress = 0;
					canPlayNext = false;
					autoPlayTransition();
				}
			}, autoPlaySpeed / 100);
		} else {
			clearInterval(autoPlayInterval);
		}
	};

	const autoPlayTransition = () => {
		if (autoPlayIndex < currentMemory.assets.length - 1) {
			autoPlayIndex++;
		} else {
			const canAdvance = toNextMemory();
			if (!canAdvance) {
				autoPlay = false;
				clearInterval(autoPlayInterval);
				return;
			}
		}

		// Delay for nicer animation of the progress bar
		setTimeout(() => {
			canPlayNext = true;
		}, 250);
	};

	const resetAutoPlay = () => {
		autoPlayIndex = 0;
		autoPlayProgress = 0;
	};

	const toNextCurrentAsset = () => {
		autoPlayIndex++;

		if (autoPlayIndex > currentMemory.assets.length - 1) {
			toNextMemory();
		}
	};

	const toPreviousCurrentAsset = () => {
		autoPlayIndex--;

		if (autoPlayIndex < 0) {
			toPreviousMemory();
		}
	};
</script>

<section id="memory-viewer" class="w-full bg-immich-dark-gray" bind:this={memoryWrapper}>
	{#if currentMemory}
		<ControlAppBar on:close-button-click={() => goto(AppRoute.PHOTOS)} forceDark>
			<svelte:fragment slot="leading">
				<p class="text-lg">
					{currentMemory.title}
				</p>
			</svelte:fragment>

			{#if !galleryInView}
				<div class="flex place-items-center place-content-center overflow-hidden gap-2">
					<CircleIconButton logo={autoPlay ? Pause : Play} forceDark on:click={toggleAutoPlay} />

					<div class="relative w-full">
						<span class="absolute left-0 w-full h-[2px] bg-gray-500" />
						<span
							class="absolute left-0 h-[2px] bg-white transition-all"
							style:width={`${autoPlayProgress}%`}
						/>
					</div>

					<div>
						<p class="text-small">
							{autoPlayIndex + 1}/{currentMemory.assets.length}
						</p>
					</div>
				</div>
			{/if}
		</ControlAppBar>

		{#if galleryInView}
			<div
				class="sticky top-20 flex place-content-center place-items-center z-30 transition-opacity"
				class:opacity-0={!galleryInView}
				class:opacity-100={galleryInView}
			>
				<button
					on:click={() => memoryWrapper.scrollIntoView({ behavior: 'smooth' })}
					disabled={!galleryInView}
				>
					<CircleIconButton logo={ChevronUp} backgroundColor="white" forceDark />
				</button>
			</div>
		{/if}
		<!-- Viewer -->
		<section class="pt-20 overflow-hidden">
			<div
				class="flex w-[300%] h-[calc(100vh_-_180px)] items-center justify-center box-border ml-[-100%] gap-10 overflow-hidden"
			>
				<!-- PREVIOUS MEMORY -->
				<div
					class="rounded-2xl w-[20vw] h-1/2"
					class:opacity-25={showPreviousMemory}
					class:opacity-0={!showPreviousMemory}
					class:hover:opacity-70={showPreviousMemory}
				>
					<button
						class="rounded-2xl h-full w-full relative"
						disabled={!showPreviousMemory}
						on:click={toPreviousMemory}
					>
						<img
							class="rounded-2xl h-full w-full object-cover"
							src={showPreviousMemory && lastMemory
								? api.getAssetThumbnailUrl(lastMemory.assets[0].id, 'JPEG')
								: noThumbnailUrl}
							alt=""
							draggable="false"
						/>

						{#if showPreviousMemory}
							<div class="absolute right-4 bottom-4 text-white text-left">
								<p class="font-semibold text-xs text-gray-200">PREVIOUS</p>
								<p class="text-xl">{lastMemory.title}</p>
							</div>
						{/if}
					</button>
				</div>

				<!-- CURRENT MEMORY -->
				<div
					class="main-view rounded-2xl h-full relative w-[70vw] bg-black flex place-items-center place-content-center"
				>
					<div class="bg-black w-full h-full rounded-2xl">
						<!-- CONTROL BUTTONS -->
						<div class="absolute h-full flex justify-between w-full">
							<div class="flex h-full flex-col place-content-center place-items-center ml-4">
								<div class="inline-block">
									<CircleIconButton
										logo={ChevronLeft}
										backgroundColor="#202123"
										on:click={toPreviousCurrentAsset}
									/>
								</div>
							</div>
							<div class="flex h-full flex-col place-content-center place-items-center mr-4">
								<div class="inline-block">
									<CircleIconButton
										logo={ChevronRight}
										backgroundColor="#202123"
										on:click={toNextCurrentAsset}
									/>
								</div>
							</div>
						</div>

						{#key currentMemory.assets[autoPlayIndex].id}
							<img
								transition:fade|local
								class="rounded-2xl w-full h-full object-contain transition-all"
								src={api.getAssetThumbnailUrl(currentMemory.assets[autoPlayIndex].id, 'JPEG')}
								alt=""
								draggable="false"
							/>
						{/key}

						<div class="absolute top-4 left-8 text-white text-sm font-medium">
							<p>
								{DateTime.fromISO(currentMemory.assets[0].fileCreatedAt).toLocaleString(
									DateTime.DATE_FULL
								)}
							</p>
							<p>
								{currentMemory.assets[autoPlayIndex].exifInfo?.city || ''}
								{currentMemory.assets[autoPlayIndex].exifInfo?.country || ''}
							</p>
						</div>
					</div>
				</div>

				<!-- NEXT MEMORY -->
				<div
					class="rounded-xl w-[20vw] h-1/2"
					class:opacity-25={showNextMemory}
					class:opacity-0={!showNextMemory}
					class:hover:opacity-70={showNextMemory}
				>
					<button
						class="rounded-2xl h-full w-full relative"
						on:click={toNextMemory}
						disabled={!showNextMemory}
					>
						<img
							class="rounded-2xl h-full w-full object-cover"
							src={showNextMemory
								? api.getAssetThumbnailUrl(nextMemory.assets[0].id, 'JPEG')
								: noThumbnailUrl}
							alt=""
							draggable="false"
						/>

						{#if showNextMemory}
							<div class="absolute left-4 bottom-4 text-white text-left">
								<p class="font-semibold text-xs text-gray-200">UP NEXT</p>
								<p class="text-xl">{nextMemory.title}</p>
							</div>
						{/if}
					</button>
				</div>
			</div>
		</section>

		<!-- GALERY VIEWER -->

		<section class="bg-immich-dark-gray pl-4">
			<div
				class="sticky flex place-content-center place-items-center mb-10 mt-4 transition-all"
				class:opacity-0={galleryInView}
				class:opacity-100={!galleryInView}
			>
				<button on:click={() => memoryGallery.scrollIntoView({ behavior: 'smooth' })}>
					<CircleIconButton logo={ChevronDown} backgroundColor="white" forceDark />
				</button>
			</div>

			<IntersectionObserver
				once={false}
				on:intersected={() => (galleryInView = true)}
				on:hidden={() => (galleryInView = false)}
				bottom={-200}
			>
				<div id="gallery-memory" bind:this={memoryGallery}>
					<GalleryViewer assets={currentMemory.assets} viewFrom="album-page" />
				</div>
			</IntersectionObserver>
		</section>
	{/if}
</section>

<style>
	.main-view {
		box-shadow: 0 4px 4px 0 rgba(0, 0, 0, 0.3), 0 8px 12px 6px rgba(0, 0, 0, 0.15);
	}
</style>
