<script lang="ts">
	import { browser } from '$app/env';
	import { AssetCountByTimeGroupResponseDto } from '@api';

	import { onMount, onDestroy } from 'svelte';
	export let viewportHeight = 0;
	export let segmentData: AssetCountByTimeGroupResponseDto;

	let scrollbarHeight: number;
	let scrollbarHeightLeft: number;

	const getSegmentHeight = (groupCount: number) => {
		const percentage = (groupCount * 100) / segmentData.totalAssets;
		return (percentage * scrollbarHeightLeft) / 100;
	};

	const getLayoutDistance = () => {
		let result = [];
		/**
		 * {
		 *  group_name: 'dec-2020',
		 *  margin_top: '40'
		 * }
		 */
		for (const [i, segment] of segmentData.groups.entries()) {
			if (i == 0) {
				result.push(segment);
				continue;
			}

			result.push('ok');
			console.log('ok');
		}
		// viewport height in pixel
		// scrollbar height in pixel

		// total asset in count is equivalent to total scrollbar height -> interpolation

		// each group asset count is used to calculate the margin from the top

		console.log(result);
	};

	onMount(() => {
		scrollbarHeightLeft = scrollbarHeight;
		getLayoutDistance();
	});
</script>

<div
	id="immich-scubbable-scrollbar"
	class="fixed right-0 w-[60px] h-full bg-white z-[99999999]"
	bind:clientHeight={scrollbarHeight}
>
	{#each segmentData.groups as segment (segment.timeGroup)}
		{@const groupDate = new Date(segment.timeGroup)}
		<div class="text-xs">
			{groupDate.toLocaleString('default', { month: 'short' })}
			{groupDate.getFullYear()}
		</div>
	{/each}
</div>

<style>
	#immich-scubbable-scrollbar {
		contain: layout;
	}
</style>
