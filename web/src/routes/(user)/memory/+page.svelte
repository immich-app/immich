<script lang="ts">
	import { memoryStore } from '$lib/stores/memory.store';
	import { DateTime } from 'luxon';
	import { onMount } from 'svelte';
	import { OnThisDay, api } from '@api';
	import { goto } from '$app/navigation';
	import ControlAppBar from '$lib/components/shared-components/control-app-bar.svelte';
	import Close from 'svelte-material-icons/Close.svelte';
	import ChevronDown from 'svelte-material-icons/ChevronDown.svelte';
	import ChevronUp from 'svelte-material-icons/ChevronUp.svelte';
	import { AppRoute } from '$lib/constants';
	import { page } from '$app/stores';
	import noThumbnailUrl from '$lib/assets/no-thumbnail.png';
	import GalleryViewer from '$lib/components/shared-components/gallery-viewer/gallery-viewer.svelte';
	import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
	import IntersectionObserver from '$lib/components/asset-viewer/intersection-observer.svelte';

	const thisYear = DateTime.local().year;

	let currentIndex = 0;
	let currentMemory: OnThisDay;
	let nextMemory: OnThisDay;
	let lastMemory: OnThisDay;

	let lastIndex = 0;
	let nextIndex = 0;
	$: showNextMemory = nextIndex <= $memoryStore?.onThisDay.length - 1;
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
			if (isNaN(currentIndex) || currentIndex > $memoryStore.onThisDay.length - 1) {
				currentIndex = 0;
			}
		}

		currentMemory = $memoryStore.onThisDay[currentIndex];

		nextIndex = currentIndex + 1;
		nextMemory = $memoryStore.onThisDay[nextIndex];

		if (currentIndex > 0) {
			lastMemory = $memoryStore.onThisDay[lastIndex];
		}
	});

	const toNextMemory = () => {
		if (showNextMemory) {
			currentIndex += 1;
			nextIndex = currentIndex + 1;
			lastIndex = currentIndex - 1;

			currentMemory = $memoryStore.onThisDay[currentIndex];
			nextMemory = $memoryStore.onThisDay[nextIndex];
			lastMemory = $memoryStore.onThisDay[lastIndex];
		}
	};

	const toPreviousMemory = () => {
		if (showPreviousMemory) {
			currentIndex -= 1;
			nextIndex = currentIndex + 1;
			lastIndex = currentIndex - 1;

			currentMemory = $memoryStore.onThisDay[currentIndex];
			nextMemory = $memoryStore.onThisDay[nextIndex];
			lastMemory = $memoryStore.onThisDay[lastIndex];
		}
	};
</script>

<section id="memory-viewer" class="w-full" bind:this={memoryWrapper}>
	{#if currentMemory}
		<ControlAppBar on:close-button-click={() => goto(AppRoute.PHOTOS)} backIcon={Close}>
			<svelte:fragment slot="leading">
				{@const title = `${thisYear - currentMemory.year} years since...`}
				<p class="text-lg">
					{title}
				</p>
			</svelte:fragment>
		</ControlAppBar>

		<div
			class="sticky top-20 flex place-content-center place-items-center z-30 transition-opacity"
			class:opacity-0={!galleryInView}
			class:opacity-100={galleryInView}
		>
			<button
				on:click={() => memoryWrapper.scrollIntoView({ behavior: 'smooth' })}
				disabled={!galleryInView}
			>
				<CircleIconButton logo={ChevronUp} backgroundColor="white" iconColor="black" />
			</button>
		</div>
		<!-- Viewer -->
		<section class="mt-20 overflow-hidden">
			<div
				class="flex w-[300%] h-[calc(100vh_-_160px)] items-center justify-center box-border ml-[-100%] gap-10 overflow-hidden"
			>
				<!-- PREVIOUS MEMORY -->
				<div
					class="rounded-2xl w-[30vw] transition-all"
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
							class="rounded-2xl h-full w-full object-contain"
							src={showPreviousMemory && lastMemory
								? api.getAssetThumbnailUrl(lastMemory.assets[0].id, 'JPEG')
								: noThumbnailUrl}
							alt=""
							draggable="false"
						/>

						{#if showPreviousMemory}
							{@const title = `${thisYear - lastMemory.year} years since...`}

							<div class="absolute right-4 bottom-4 text-white text-left">
								<p class="font-semibold text-xs text-gray-200">PREVIOUS</p>
								<p class="text-xl">{title}</p>
							</div>
						{/if}
					</button>
				</div>

				<!-- CURRENT MEMORY -->
				<div
					class="main-view rounded-2xl h-full relative w-[70vw] bg-black flex place-items-center place-content-center"
				>
					<div class="bg-black w-full h-full rounded-2xl">
						<img
							class="rounded-2xl w-full h-full object-contain"
							src={api.getAssetThumbnailUrl(currentMemory.assets[0].id, 'JPEG')}
							alt=""
							draggable="false"
						/>
					</div>
				</div>

				<!-- NEXT MEMORY -->
				<div
					class="rounded-xl w-[30vw] transition-all"
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
							class="rounded-2xl h-full w-full object-contain"
							src={showNextMemory
								? api.getAssetThumbnailUrl(nextMemory.assets[0].id, 'JPEG')
								: noThumbnailUrl}
							alt=""
							draggable="false"
						/>

						{#if showNextMemory}
							{@const title = `${thisYear - nextMemory.year} years since...`}

							<div class="absolute left-4 bottom-4 text-white text-left">
								<p class="font-semibold text-xs text-gray-200">UP NEXT</p>
								<p class="text-xl">{title}</p>
							</div>
						{/if}
					</button>
				</div>
			</div>
		</section>
		<section>
			<div
				class="sticky flex place-content-center place-items-center mb-10 mt-4 transition-all"
				class:opacity-0={galleryInView}
				class:opacity-100={!galleryInView}
			>
				<button on:click={() => memoryGallery.scrollIntoView({ behavior: 'smooth' })}>
					<CircleIconButton logo={ChevronDown} backgroundColor="white" iconColor="black" />
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
	:global(html),
	#memory-viewer {
		background-color: #212121;
	}

	.main-view {
		box-shadow: 0 4px 4px 0 rgba(0, 0, 0, 0.3), 0 8px 12px 6px rgba(0, 0, 0, 0.15);
	}
</style>
