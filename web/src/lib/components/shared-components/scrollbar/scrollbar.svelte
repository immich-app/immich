<script lang="ts" context="module">
	type OnScrollbarClick = {
		onscrollbarclick: OnScrollbarClickDetail;
	};

	export type OnScrollbarClickDetail = {
		scrollTo: number;
	};

	type OnScrollbarDrag = {
		onscrollbardrag: OnScrollbarDragDetail;
	};

	export type OnScrollbarDragDetail = {
		scrollTo: number;
	};
</script>

<script lang="ts">
	import { assetGridState } from '$lib/stores/assets.store';
	import { AssetCountByTimeBucketResponseDto } from '@api';

	import { createEventDispatcher, onMount } from 'svelte';
	import { SegmentScrollbarLayout } from './segment-scrollbar-layout';

	export let scrollTop = 0;
	export let bucketInfo: AssetCountByTimeBucketResponseDto;
	export let scrollbarHeight = 0;
	export let timelineHeight = 0;

	$: timelineHeight = $assetGridState.timelineHeight;
	$: viewportWidth = $assetGridState.viewportWidth;

	let segmentScrollbarLayout: SegmentScrollbarLayout[] = [];
	let isHover = false;
	let isDragging = false;
	let hoveredDate: Date;
	let currentMouseYLocation = 0;
	let scrollbarPosition = 0;
	$: timelineScrolltop = (scrollbarPosition / scrollbarHeight) * timelineHeight;

	const offset = 71;
	const dispatchClick = createEventDispatcher<OnScrollbarClick>();
	const dispatchDrag = createEventDispatcher<OnScrollbarDrag>();
	$: {
		scrollbarPosition = (scrollTop / timelineHeight) * scrollbarHeight;
	}

	onMount(() => {
		segmentScrollbarLayout = getLayoutDistance();
	});

	const getSegmentHeight = (groupCount: number) => {
		if (bucketInfo.buckets.length > 0) {
			const percentage = (groupCount * 100) / bucketInfo.totalCount;
			return Math.round((percentage * scrollbarHeight) / 100);
		} else {
			return 0;
		}
	};

	const getLayoutDistance = () => {
		let result: SegmentScrollbarLayout[] = [];
		for (const bucket of bucketInfo.buckets) {
			let segmentLayout = new SegmentScrollbarLayout();
			segmentLayout.count = bucket.count;
			segmentLayout.height = getSegmentHeight(bucket.count);
			segmentLayout.timeGroup = bucket.timeBucket;
			result.push(segmentLayout);
		}
		return result;
	};

	const handleMouseMove = (e: MouseEvent, currentDate: Date) => {
		currentMouseYLocation = e.clientY - offset - 30;

		hoveredDate = new Date(currentDate.toISOString().slice(0, -1));
	};

	const handleMouseDown = (e: MouseEvent) => {
		isDragging = true;
		scrollbarPosition = e.clientY - offset;
	};

	const handleMouseUp = (e: MouseEvent) => {
		isDragging = false;
		scrollbarPosition = e.clientY - offset;
		dispatchClick('onscrollbarclick', { scrollTo: timelineScrolltop });
	};

	let animationTick = false;
	const handleMouseDrag = (e: MouseEvent) => {
		if (isDragging) {
			if (!animationTick) {
				window.requestAnimationFrame(() => {
					const dy = e.clientY - scrollbarPosition - offset;
					scrollbarPosition += dy;
					dispatchDrag('onscrollbardrag', { scrollTo: timelineScrolltop });
					animationTick = false;
				});

				animationTick = true;
			}
		}
	};
</script>

<div
	id="immich-scrubbable-scrollbar"
	class="fixed right-0 w-[60px] h-full bg-immich-bg z-10 hover:cursor-row-resize select-none"
	on:mouseenter={() => (isHover = true)}
	on:mouseleave={() => (isHover = false)}
	on:mouseup={handleMouseUp}
	on:mousemove={handleMouseDrag}
	on:mousedown={handleMouseDown}
	style:height={scrollbarHeight + 'px'}
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

	<!-- Scroll Position Indicator Line -->
	{#if !isDragging}
		<div
			class="absolute right-0 w-10 h-[2px] bg-immich-primary"
			style:top={scrollbarPosition + 'px'}
		/>
	{/if}
	<!-- Time Segment -->
	{#each segmentScrollbarLayout as segment, index (segment.timeGroup)}
		{@const groupDate = new Date(segment.timeGroup)}

		<div
			class="relative "
			style:height={segment.height + 'px'}
			aria-label={segment.timeGroup + ' ' + segment.count}
			on:mousemove={(e) => handleMouseMove(e, groupDate)}
		>
			{#if new Date(segmentScrollbarLayout[index - 1]?.timeGroup).getFullYear() !== groupDate.getFullYear()}
				{#if segment.count > 5}
					<div
						aria-label={segment.timeGroup + ' ' + segment.count}
						class="absolute right-0 pr-3 z-10 text-xs font-medium"
					>
						{groupDate.getFullYear()}
					</div>
				{/if}
			{:else if segment.count > 5}
				<div
					aria-label={segment.timeGroup + ' ' + segment.count}
					class="absolute right-0 rounded-full h-[4px] w-[4px] mr-3 bg-gray-300 block"
				/>
			{/if}
		</div>
	{/each}
</div>

<style>
	#immich-scrubbable-scrollbar {
		contain: layout;
	}
</style>
