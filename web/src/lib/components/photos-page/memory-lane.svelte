<script lang="ts">
	import { onMount } from 'svelte';
	import { DateTime } from 'luxon';
	import { OnThisDay, api } from '@api';

	let onThisDay: OnThisDay[] = [];
	let thisYear = DateTime.local().year;

	$: shouldRender = onThisDay.find((day) => day.assets.length > 0) != undefined;

	onMount(async () => {
		const timezone = DateTime.local().zoneName;
		const { data } = await api.assetApi.getMemoryLane({ timezone });

		onThisDay = data.onThisDay;
	});

	let memoryLaneElement: HTMLElement;
	let offsetWidth = 0;
	let innerWidth = 0;
	$: isOverflow = offsetWidth < innerWidth;

	function scrollLeft() {
		console.log('scroll left');

		memoryLaneElement.scrollLeft -= 200;
	}

	function scrollRight() {
		console.log('scroll right');

		memoryLaneElement.scrollLeft += 200;
	}
</script>

{#if shouldRender}
	<button on:click={scrollLeft}>Scroll left</button>
	<button on:click={scrollRight}>Scroll right</button>

	<section
		id="memory-lane"
		bind:this={memoryLaneElement}
		class="overflow-x-auto whitespace-nowrap mt-5 transition-all"
		bind:offsetWidth
	>
		<div class="border border-red-500 inline-block" bind:offsetWidth={innerWidth}>
			{#each onThisDay as day (day.year)}
				{#if day.assets.length > 0}
					{@const title = `${thisYear - day.year} years since...`}
					<div id="memory-card" class="relative inline-block mr-8 rounded-xl h-[250px] w-[400px]">
						<img
							class="rounded-xl h-full w-full object-cover"
							src={api.getAssetThumbnailUrl(day.assets[0].id, 'JPEG')}
							alt={title}
							draggable="false"
						/>
						<p class="absolute bottom-2 left-4 font-medium text-xl text-white z-10">{title}</p>
						<div
							class="absolute top-0 left-0 w-full h-full rounded-xl bg-gradient-to-t from-gray-black/30 via-transparent to-transparent z-0"
						/>
					</div>

					<div id="memory-card" class="relative inline-block mr-8 rounded-xl h-[250px] w-[400px]">
						<img
							class="rounded-xl h-full w-full object-cover"
							src={api.getAssetThumbnailUrl(day.assets[0].id, 'JPEG')}
							alt={title}
							draggable="false"
						/>
						<p class="absolute bottom-2 left-4 font-medium text-xl text-white z-10">{title}</p>
						<div
							class="absolute top-0 left-0 w-full h-full rounded-xl bg-gradient-to-t from-gray-black/30 via-transparent to-transparent z-0"
						/>
					</div>

					<div id="memory-card" class="relative inline-block mr-8 rounded-xl h-[250px] w-[400px]">
						<img
							class="rounded-xl h-full w-full object-cover"
							src={api.getAssetThumbnailUrl(day.assets[0].id, 'JPEG')}
							alt={title}
							draggable="false"
						/>
						<p class="absolute bottom-2 left-4 font-medium text-xl text-white z-10">{title}</p>
						<div
							class="absolute top-0 left-0 w-full h-full rounded-xl bg-gradient-to-t from-gray-black/30 via-transparent to-transparent z-0"
						/>
					</div>

					<div id="memory-card" class="relative inline-block mr-8 rounded-xl h-[250px] w-[400px]">
						<img
							class="rounded-xl h-full w-full object-cover"
							src={api.getAssetThumbnailUrl(day.assets[0].id, 'JPEG')}
							alt={title}
							draggable="false"
						/>
						<p class="absolute bottom-2 left-4 font-medium text-xl text-white z-10">{title}</p>
						<div
							class="absolute top-0 left-0 w-full h-full rounded-xl bg-gradient-to-t from-gray-black/30 via-transparent to-transparent z-0"
						/>
					</div>
				{/if}
			{/each}
		</div>
	</section>
{/if}

<style>
	#memory-lane::-webkit-scrollbar {
		/* width: 0px; */
		display: none;
	}

	#memory-card {
		box-shadow: rgba(60, 64, 67, 0.3) 0px 1px 2px 0px, rgba(60, 64, 67, 0.15) 0px 1px 3px 1px;
	}
</style>
