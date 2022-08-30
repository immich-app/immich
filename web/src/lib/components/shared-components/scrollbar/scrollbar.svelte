<script lang="ts">
	import { browser } from '$app/env';
	import { AssetCountByTimeGroupResponseDto } from '@api';

	import { onMount } from 'svelte';
	import { SegmentScrollbarLayout } from './segment-scrollbar-layout';
	export let viewportHeight = 0;
	export let segmentData: AssetCountByTimeGroupResponseDto;

	let scrollbarHeight: number;
	let scrollbarHeightLeft: number;
	let segmentScrollbarLayout: SegmentScrollbarLayout[] = [];
	let isHover = false;
	let hoveredDate: Date;
	let currentMouseYLocation: number = 0;

	const getSegmentHeight = (groupCount: number) => {
		if (segmentData.groups.length > 0) {
			const percentage = (groupCount * 100) / segmentData.totalAssets;
			return Math.round((percentage * scrollbarHeightLeft) / 100);
		} else {
			return 0;
		}
	};

	const getLayoutDistance = () => {
		let result: SegmentScrollbarLayout[] = [];
		for (const segment of segmentData.groups) {
			let segmentLayout = new SegmentScrollbarLayout();

			segmentLayout.count = segment.count;
			segmentLayout.height = getSegmentHeight(segment.count);
			segmentLayout.timeGroup = segment.timeGroup;

			result.push(segmentLayout);
		}

		return result;
	};

	onMount(() => {
		scrollbarHeightLeft = scrollbarHeight;
		segmentScrollbarLayout = getLayoutDistance();
	});

	const handleMouseMove = (e: MouseEvent, currentDate: Date) => {
		currentMouseYLocation = e.clientY - 71 - 30;
		hoveredDate = currentDate;
	};
</script>

<div
	id="immich-scubbable-scrollbar"
	class="fixed right-0 w-[60px] h-full bg-immich-bg z-[9999] hover:cursor-row-resize"
	bind:clientHeight={scrollbarHeight}
	on:mouseenter={(e) => {
		isHover = true;
	}}
	on:mouseleave={(e) => {
		isHover = false;
	}}
>
	{#if isHover}
		<div
			class="border-b-2 border-immich-primary w-[100px] right-0 pr-6 py-1 text-sm pl-1 font-medium absolute bg-white z-50 pointer-events-none rounded-tl-md shadow-lg"
			style:top={currentMouseYLocation + 'px'}
		>
			{hoveredDate?.toLocaleString('default', { month: 'short' })}
			{hoveredDate?.getFullYear()}
		</div>
	{/if}

	{#each segmentScrollbarLayout as segment, index (segment.timeGroup)}
		{@const groupDate = new Date(segment.timeGroup)}

		<div
			class="relative "
			style:height={segment.height + 'px'}
			aria-label={segment.timeGroup + ' ' + segment.count}
			on:mousemove={(e) => handleMouseMove(e, groupDate)}
		>
			<!-- {groupDate.toLocaleString('default', { month: 'short' })} -->
			{#if new Date(segmentScrollbarLayout[index - 1]?.timeGroup).getFullYear() !== groupDate.getFullYear()}
				<div
					aria-label={segment.timeGroup + ' ' + segment.count}
					class="absolute right-0 pr-3 z-10 text-xs font-medium"
				>
					{groupDate.getFullYear()}
				</div>
			{:else if segment.height > 3}
				<div
					aria-label={segment.timeGroup + ' ' + segment.count}
					class="absolute right-0 rounded-full h-[4px] w-[4px] mr-3 bg-gray-300 block"
				/>
			{/if}
		</div>
	{/each}

	<!-- on hovered show info box with day and month at mouse location -->
</div>

<style>
	#immich-scubbable-scrollbar {
		contain: layout;
	}
</style>
