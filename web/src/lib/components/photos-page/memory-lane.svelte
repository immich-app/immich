<script lang="ts">
	import { onMount } from 'svelte';
	import { DateTime } from 'luxon';
	import { api } from '@api';
	import ChevronLeft from 'svelte-material-icons/ChevronLeft.svelte';
	import ChevronRight from 'svelte-material-icons/ChevronRight.svelte';
	import { memoryStore } from '$lib/stores/memory.store';
	import { goto } from '$app/navigation';
	import { fade } from 'svelte/transition';

	$: shouldRender = $memoryStore?.length > 0;

	onMount(async () => {
		const { data } = await api.assetApi.getMemoryLane({
			timestamp: DateTime.local().startOf('day').toISO() || ''
		});
		$memoryStore = data;
	});

	let memoryLaneElement: HTMLElement;
	let offsetWidth = 0;
	let innerWidth = 0;

	let scrollLeftPosition = 0;

	const onScroll = () => (scrollLeftPosition = memoryLaneElement?.scrollLeft);

	$: canScrollLeft = scrollLeftPosition > 0;
	$: canScrollRight = Math.ceil(scrollLeftPosition) < innerWidth - offsetWidth;

	const scrollBy = 400;
	const scrollLeft = () => memoryLaneElement.scrollBy({ left: -scrollBy, behavior: 'smooth' });
	const scrollRight = () => memoryLaneElement.scrollBy({ left: scrollBy, behavior: 'smooth' });
</script>

{#if shouldRender}
	<section
		id="memory-lane"
		bind:this={memoryLaneElement}
		class="relative overflow-x-hidden whitespace-nowrap mt-5 transition-all"
		bind:offsetWidth
		on:scroll={onScroll}
	>
		{#if canScrollLeft || canScrollRight}
			<div class="sticky left-0 z-20">
				{#if canScrollLeft}
					<div class="absolute left-4 top-[6rem] z-20" transition:fade={{ duration: 200 }}>
						<button
							class="rounded-full opacity-50 hover:opacity-100 p-2 border border-gray-500 bg-gray-100 text-gray-500"
							on:click={scrollLeft}
						>
							<ChevronLeft size="36" /></button
						>
					</div>
				{/if}
				{#if canScrollRight}
					<div class="absolute right-4 top-[6rem] z-20" transition:fade={{ duration: 200 }}>
						<button
							class="rounded-full opacity-50 hover:opacity-100 p-2 border border-gray-500 bg-gray-100 text-gray-500"
							on:click={scrollRight}
						>
							<ChevronRight size="36" /></button
						>
					</div>
				{/if}
			</div>
		{/if}

		<div class="inline-block" bind:offsetWidth={innerWidth}>
			{#each $memoryStore as memory, i (memory.title)}
				<button
					class="memory-card relative inline-block mr-8 rounded-xl aspect-video h-[215px]"
					on:click={() => goto(`/memory?memory=${i}`)}
				>
					<img
						class="rounded-xl h-full w-full object-cover"
						src={api.getAssetThumbnailUrl(memory.assets[0].id, 'JPEG')}
						alt={memory.title}
						draggable="false"
					/>
					<p class="absolute bottom-2 left-4 text-lg text-white z-10">{memory.title}</p>
					<div
						class="absolute top-0 left-0 w-full h-full rounded-xl bg-gradient-to-t from-black/40 via-transparent to-transparent z-0 hover:bg-black/20 transition-all"
					/>
				</button>
			{/each}
		</div>
	</section>
{/if}

<style>
	.memory-card {
		box-shadow: rgba(60, 64, 67, 0.3) 0px 1px 2px 0px, rgba(60, 64, 67, 0.15) 0px 1px 3px 1px;
	}
</style>
