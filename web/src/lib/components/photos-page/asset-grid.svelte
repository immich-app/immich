<script lang="ts">
	import { onMount } from 'svelte';

	import IntersectionObserver from '../asset-viewer/intersection-observer.svelte';
	import { assetGridState, assetStore, loadingBucketState } from '$lib/stores/assets.store';
	import { api, TimeGroupEnum } from '@api';
	import AssetDateGroup from './asset-date-group.svelte';
	import Portal from '../shared-components/portal/portal.svelte';
	import AssetViewer from '../asset-viewer/asset-viewer.svelte';
	import {
		assetInteractionStore,
		isViewingAssetStoreState,
		viewingAssetStoreState
	} from '$lib/stores/asset-interaction.store';

	let viewportHeight = 0;
	let viewportWidth = 0;
	let assetGridElement: HTMLElement;
	export let isAlbumSelectionMode = false;

	onMount(async () => {
		const { data: assetCountByTimebucket } = await api.assetApi.getAssetCountByTimeBucket({
			timeGroup: TimeGroupEnum.Month
		});

		assetStore.setInitialState(viewportHeight, viewportWidth, assetCountByTimebucket);

		// Get asset bucket if bucket height is smaller than viewport height
		let bucketsToFetchInitially: string[] = [];
		let initialBucketsHeight = 0;
		$assetGridState.buckets.every((bucket) => {
			if (initialBucketsHeight < viewportHeight) {
				initialBucketsHeight += bucket.bucketHeight;
				bucketsToFetchInitially.push(bucket.bucketDate);
				return true;
			} else {
				return false;
			}
		});

		bucketsToFetchInitially.forEach((bucketDate) => {
			assetStore.getAssetsByBucket(bucketDate);
		});
	});

	function intersectedHandler(event: CustomEvent) {
		const el = event.detail as HTMLElement;
		const target = el.firstChild as HTMLElement;

		if (target) {
			const bucketDate = target.id.split('_')[1];
			assetStore.getAssetsByBucket(bucketDate);
		}
	}

	const navigateToPreviousAsset = () => {
		assetInteractionStore.navigateAsset('previous');
	};

	const navigateToNextAsset = () => {
		assetInteractionStore.navigateAsset('next');
	};
</script>

<section
	id="asset-grid"
	class="overflow-y-auto pl-4"
	bind:clientHeight={viewportHeight}
	bind:clientWidth={viewportWidth}
	bind:this={assetGridElement}
>
	{#if assetGridElement}
		<section id="virtual-timeline" style:height={$assetGridState.timelineHeight + 'px'}>
			{#each $assetGridState.buckets as bucket, bucketIndex (bucketIndex)}
				<IntersectionObserver
					on:intersected={intersectedHandler}
					on:hidden={async () => {
						// If bucket is hidden and in loading state, cancel the request
						if ($loadingBucketState[bucket.bucketDate]) {
							await assetStore.cancelBucketRequest(bucket.cancelToken, bucket.bucketDate);
						}
					}}
					let:intersecting
					top={750}
					bottom={750}
					root={assetGridElement}
				>
					<div id={'bucket_' + bucket.bucketDate} style:height={bucket.bucketHeight + 'px'}>
						{#if intersecting}
							<AssetDateGroup
								{isAlbumSelectionMode}
								assets={bucket.assets}
								bucketDate={bucket.bucketDate}
								bucketHeight={bucket.bucketHeight}
							/>
						{/if}
					</div>
				</IntersectionObserver>
			{/each}
		</section>
	{/if}
</section>

<Portal target="body">
	{#if $isViewingAssetStoreState}
		<AssetViewer
			asset={$viewingAssetStoreState}
			on:navigate-previous={navigateToPreviousAsset}
			on:navigate-next={navigateToNextAsset}
			on:close={() => {
				assetInteractionStore.setIsViewingAsset(false);
			}}
		/>
	{/if}
</Portal>

<style>
	#asset-grid {
		contain: layout;
	}
</style>
