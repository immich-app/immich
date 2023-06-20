<script lang="ts">
	import { memoryStore } from '$lib/stores/memory.store';
	import { DateTime } from 'luxon';
	import { onMount } from 'svelte';
	import { api } from '@api';
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
	import { tweened } from 'svelte/motion';

	const parseIndex = (s: string | null, max: number | null) =>
		Math.max(Math.min(parseInt(s ?? '') || 0, max ?? 0), 0);

	$: memoryIndex = parseIndex($page.url.searchParams.get('memory'), $memoryStore?.length - 1);
	$: assetIndex = parseIndex($page.url.searchParams.get('asset'), currentMemory?.assets.length - 1);

	$: previousMemory = $memoryStore?.[memoryIndex - 1];
	$: currentMemory = $memoryStore?.[memoryIndex];
	$: nextMemory = $memoryStore?.[memoryIndex + 1];

	$: previousAsset = currentMemory?.assets[assetIndex - 1];
	$: currentAsset = currentMemory?.assets[assetIndex];
	$: nextAsset = currentMemory?.assets[assetIndex + 1];

	$: canAdvance = !!(nextMemory || nextAsset);

	const toNextMemory = () => goto(`?memory=${memoryIndex + 1}`);
	const toPreviousMemory = () => goto(`?memory=${memoryIndex - 1}`);

	const toNextAsset = () => goto(`?memory=${memoryIndex}&asset=${assetIndex + 1}`);
	const toPreviousAsset = () => goto(`?memory=${memoryIndex}&asset=${assetIndex - 1}`);

	const toNext = () => (nextAsset ? toNextAsset() : toNextMemory());
	const toPrevious = () => (previousAsset ? toPreviousAsset() : toPreviousMemory());

	const progress = tweened<number>(0, {
		duration: (from: number, to: number) => (to ? 5000 * (to - from) : 0)
	});

	const play = () => progress.set(1);
	const pause = () => progress.set($progress);

	let resetPromise = Promise.resolve();
	const reset = () => (resetPromise = progress.set(0));

	let paused = false;

	// Play or pause progress when the paused state changes.
	$: paused ? pause() : play();

	// Progress should be paused when it's no longer possible to advance.
	$: paused ||= !canAdvance;

	// Advance to the next asset or memory when progress is complete.
	$: $progress === 1 && toNext();

	// Progress should be resumed when reset and not paused.
	$: !$progress && !paused && play();

	// Progress should be reset when the current memory or asset changes.
	$: memoryIndex, assetIndex, reset();

	onMount(async () => {
		if (!$memoryStore) {
			const { data } = await api.assetApi.getMemoryLane({
				timestamp: DateTime.local().startOf('day').toISO() || ''
			});
			$memoryStore = data;
		}
	});

	let memoryGallery: HTMLElement;
	let memoryWrapper: HTMLElement;
	let galleryInView = false;
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
					<CircleIconButton
						logo={paused ? Play : Pause}
						forceDark
						on:click={() => (paused = !paused)}
					/>

					{#each currentMemory.assets as _, i}
						<button
							class="relative w-full py-2"
							on:click={() => goto(`?memory=${memoryIndex}&asset=${i}`)}
						>
							<span class="absolute left-0 w-full h-[2px] bg-gray-500" />
							{#await resetPromise}
								<span
									class="absolute left-0 h-[2px] bg-white"
									style:width={`${i < assetIndex ? 100 : 0}%`}
								/>
							{:then}
								<span
									class="absolute left-0 h-[2px] bg-white"
									style:width={`${i < assetIndex ? 100 : i > assetIndex ? 0 : $progress * 100}%`}
								/>
							{/await}
						</button>
					{/each}

					<div>
						<p class="text-small">
							{assetIndex + 1}/{currentMemory.assets.length}
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
					class:opacity-25={previousMemory}
					class:opacity-0={!previousMemory}
					class:hover:opacity-70={previousMemory}
				>
					<button
						class="rounded-2xl h-full w-full relative"
						disabled={!previousMemory}
						on:click={toPreviousMemory}
					>
						<img
							class="rounded-2xl h-full w-full object-cover"
							src={previousMemory
								? api.getAssetThumbnailUrl(previousMemory.assets[0].id, 'JPEG')
								: noThumbnailUrl}
							alt=""
							draggable="false"
						/>

						{#if previousMemory}
							<div class="absolute right-4 bottom-4 text-white text-left">
								<p class="font-semibold text-xs text-gray-200">PREVIOUS</p>
								<p class="text-xl">{previousMemory.title}</p>
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
									{#if previousMemory || previousAsset}
										<CircleIconButton
											logo={ChevronLeft}
											backgroundColor="#202123"
											on:click={toPrevious}
										/>
									{/if}
								</div>
							</div>
							<div class="flex h-full flex-col place-content-center place-items-center mr-4">
								<div class="inline-block">
									{#if canAdvance}
										<CircleIconButton
											logo={ChevronRight}
											backgroundColor="#202123"
											on:click={toNext}
										/>
									{/if}
								</div>
							</div>
						</div>

						{#key currentAsset.id}
							<img
								transition:fade|local
								class="rounded-2xl w-full h-full object-contain transition-all"
								src={api.getAssetThumbnailUrl(currentAsset.id, 'JPEG')}
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
								{currentAsset.exifInfo?.city || ''}
								{currentAsset.exifInfo?.country || ''}
							</p>
						</div>
					</div>
				</div>

				<!-- NEXT MEMORY -->
				<div
					class="rounded-xl w-[20vw] h-1/2"
					class:opacity-25={nextMemory}
					class:opacity-0={!nextMemory}
					class:hover:opacity-70={nextMemory}
				>
					<button
						class="rounded-2xl h-full w-full relative"
						on:click={toNextMemory}
						disabled={!nextMemory}
					>
						<img
							class="rounded-2xl h-full w-full object-cover"
							src={nextMemory
								? api.getAssetThumbnailUrl(nextMemory.assets[0].id, 'JPEG')
								: noThumbnailUrl}
							alt=""
							draggable="false"
						/>

						{#if nextMemory}
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
