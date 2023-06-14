<script lang="ts">
	import { memoryStore } from '$lib/stores/memory.store';
	import { DateTime } from 'luxon';
	import { onMount } from 'svelte';
	import { OnThisDay, api } from '@api';
	import { goto } from '$app/navigation';
	import ControlAppBar from '$lib/components/shared-components/control-app-bar.svelte';
	import ArrowLeft from 'svelte-material-icons/ArrowLeft.svelte';
	import { AppRoute } from '$lib/constants';
	import { page } from '$app/stores';
	import noThumbnailUrl from '$lib/assets/no-thumbnail.png';

	const thisYear = DateTime.local().year;

	let currentIndex = 0;
	let currentMemory: OnThisDay;
	let nextMemory: OnThisDay;
	let lastMemory: OnThisDay;

	let lastIndex = 0;
	let nextIndex = 0;
	$: showNextMemory = nextIndex <= $memoryStore?.onThisDay.length - 1;
	$: showPreviousMemory = currentIndex != 0;

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
			console.log(lastMemory, lastIndex, $memoryStore.onThisDay[lastIndex]);
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

<section id="memory-viewer" class="w-full">
	{#if currentMemory}
		<ControlAppBar on:close-button-click={() => goto(AppRoute.PHOTOS)} backIcon={ArrowLeft}>
			<svelte:fragment slot="leading">
				{@const title = `${thisYear - currentMemory.year} years since...`}
				<p class="text-lg">
					{title}
				</p>
			</svelte:fragment>
		</ControlAppBar>

		<!-- Viewer -->

		<section class="mt-20 overflow-hidden">
			<div
				class="flex w-[300%] h-[calc(100vh_-_160px)] items-center justify-center box-border ml-[-100%] gap-10 overflow-hidden"
			>
				<button
					class="rounded-xl w-[30vw] transition-all"
					disabled={!showPreviousMemory}
					class:opacity-25={showPreviousMemory}
					class:opacity-0={!showPreviousMemory}
					class:hover:opacity-100={showPreviousMemory}
					on:click={toPreviousMemory}
				>
					<div class="rounded-xl h-full w-full">
						<img
							class="rounded-xl h-full w-full object-contain"
							src={showPreviousMemory && lastMemory
								? api.getAssetThumbnailUrl(lastMemory.assets[0].id, 'JPEG')
								: noThumbnailUrl}
							alt=""
							draggable="false"
						/>
					</div>
				</button>

				<div
					class="main-view rounded-2xl h-full relative w-[70vw] bg-black flex place-items-center place-content-center"
				>
					<div class="bg-black h-full rounded-2xl">
						<img
							class="h-full w-full object-contain"
							src={api.getAssetThumbnailUrl(currentMemory.assets[0].id, 'JPEG')}
							alt=""
							draggable="false"
						/>
					</div>
				</div>

				<button
					class="rounded-xl w-[30vw] transition-all"
					disabled={!showNextMemory}
					class:opacity-25={showNextMemory}
					class:opacity-0={!showNextMemory}
					class:hover:opacity-100={showNextMemory}
					on:click={toNextMemory}
				>
					<div class="rounded-xl h-full w-full">
						<img
							class="rounded-xl h-full w-full object-contain"
							src={showNextMemory
								? api.getAssetThumbnailUrl(nextMemory.assets[0].id, 'JPEG')
								: noThumbnailUrl}
							alt=""
							draggable="false"
						/>
					</div>
				</button>
			</div>
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
