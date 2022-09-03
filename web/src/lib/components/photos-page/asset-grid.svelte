<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	import IntersectionObserver from '../asset-viewer/intersection-observer.svelte';
	import { assetGridState, assetStore } from '$lib/stores/assets.store';
	import { AssetCountByTimeBucketResponseDto } from '@api';
	import { assets } from '$app/paths';
	import AssetDateGroup from './asset-date-group.svelte';

	let viewportHeight = 0;
	let viewportWidth = 0;
	let assetGridElement: HTMLElement;
	let assetCountByTimebucket: AssetCountByTimeBucketResponseDto = $page.data.assetCountByTimebucket;

	onMount(() => {
		assetStore.setInitialState(viewportHeight, viewportWidth, assetCountByTimebucket);
		assetStore.getAssetsByBucket('2022-08-01T00:00:00.000Z');
	});

	function intersectedHandler(event: CustomEvent) {
		const el = event.detail as HTMLElement;
		const target = el.firstChild as HTMLElement;

		if (target) {
			const bucketDate = target.id.split('_')[1];
			assetStore.getAssetsByBucket(bucketDate);
		}
	}

	const fetchData = () => {
		assetStore.getAssetsByBucket('2022-08-01T00:00:00.000Z');
	};
</script>

<section
	id="asset-grid"
	class="overflow-y-auto"
	bind:clientHeight={viewportHeight}
	bind:clientWidth={viewportWidth}
	bind:this={assetGridElement}
>
	{#if assetGridElement}
		<section id="virtual-timeline" style:height={$assetGridState.timelineHeight + 'px'}>
			{#each $assetGridState.buckets as bucket, bucketIndex (bucketIndex)}
				<IntersectionObserver
					on:intersected={intersectedHandler}
					let:intersecting
					top={500}
					bottom={500}
					root={assetGridElement}
				>
					<div
						id={'bucket_' + bucket.bucketDate}
						class="border border-red-500"
						style:height={bucket.bucketHeight + 'px'}
					>
						{#if intersecting}
							<!-- Assets Group By Monthly Time Bucket Date Grid Goes Here -->
							<AssetDateGroup assets={bucket.assets} bucketDate={bucket.bucketDate} />
						{/if}
					</div>
				</IntersectionObserver>
			{/each}
		</section>
	{/if}
</section>

<style>
	#asset-grid {
		contain: layout;
	}
</style>
