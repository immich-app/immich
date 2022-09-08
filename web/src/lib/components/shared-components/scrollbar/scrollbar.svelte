<script lang="ts">
	import { onMount } from 'svelte';
	import { SegmentScrollbarLayout } from './segment-scrollbar-layout';

	export let scrollTop = 0;
	// export let viewportWidth = 0;
	export let scrollbarHeight = 0;

	let timelineHeight = 0;
	let segmentScrollbarLayout: SegmentScrollbarLayout[] = [];
	let isHover = false;
	let hoveredDate: Date;
	let currentMouseYLocation = 0;
	let scrollbarPosition = 0;

	$: {
		scrollbarPosition = (scrollTop / timelineHeight) * scrollbarHeight;
	}

	$: {
		// let result: SegmentScrollbarLayout[] = [];
		// for (const [i, segment] of assetStoreState.entries()) {
		// 	let segmentLayout = new SegmentScrollbarLayout();
		// 	segmentLayout.count = segmentData.groups[i].count;
		// 	segmentLayout.height =
		// 		segment.assets.length == 0
		// 			? getSegmentHeight(segmentData.groups[i].count)
		// 			: Math.round((segment.segmentHeight / timelineHeight) * scrollbarHeight);
		// 	segmentLayout.timeGroup = segment.segmentDate;
		// 	result.push(segmentLayout);
		// }
		// segmentScrollbarLayout = result;
	}

	onMount(() => {
		// segmentScrollbarLayout = getLayoutDistance();
	});

	// const getSegmentHeight = (groupCount: number) => {
	// if (segmentData.groups.length > 0) {
	// 	const percentage = (groupCount * 100) / segmentData.totalAssets;
	// 	return Math.round((percentage * scrollbarHeight) / 100);
	// } else {
	// 	return 0;
	// }
	// };

	// const getLayoutDistance = () => {
	// let result: SegmentScrollbarLayout[] = [];
	// for (const segment of segmentData.groups) {
	// 	let segmentLayout = new SegmentScrollbarLayout();
	// 	segmentLayout.count = segment.count;
	// 	segmentLayout.height = getSegmentHeight(segment.count);
	// 	segmentLayout.timeGroup = segment.timeGroup;
	// 	result.push(segmentLayout);
	// }
	// return result;
	// };

	const handleMouseMove = (e: MouseEvent, currentDate: Date) => {
		currentMouseYLocation = e.clientY - 71 - 30;

		hoveredDate = new Date(currentDate.toISOString().slice(0, -1));
	};
</script>

<div
	id="immich-scubbable-scrollbar"
	class="fixed right-0 w-[60px] h-full bg-immich-bg z-[9999] hover:cursor-row-resize"
	on:mouseenter={() => (isHover = true)}
	on:mouseleave={() => (isHover = false)}
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
	<div
		class="absolute right-0 w-10 h-[2px] bg-immich-primary"
		style:top={scrollbarPosition + 'px'}
	/>

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
				<div
					aria-label={segment.timeGroup + ' ' + segment.count}
					class="absolute right-0 pr-3 z-10 text-xs font-medium"
				>
					{groupDate.getFullYear()}
				</div>
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
	#immich-scubbable-scrollbar {
		contain: layout;
	}
</style>
