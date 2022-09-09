import { writable } from 'svelte/store';
import lodash from 'lodash-es';
import { api, AssetCountByTimeBucketResponseDto } from '@api';
import { AssetGridState } from '$lib/models/asset-grid-state';
import { calculateViewportHeightByNumberOfAsset } from '$lib/utils/viewport-utils';

/**
 * The state that holds information about the asset grid
 */
export const assetGridState = writable<AssetGridState>(new AssetGridState());
export const loadingBucketState = writable<{ [key: string]: boolean }>({});

function createAssetStore() {
	let _assetGridState = new AssetGridState();
	assetGridState.subscribe((state) => {
		_assetGridState = state;
	});

	let _loadingBucketState: { [key: string]: boolean } = {};
	loadingBucketState.subscribe((state) => {
		_loadingBucketState = state;
	});
	/**
	 * Set initial state
	 * @param viewportHeight
	 * @param viewportWidth
	 * @param data
	 */
	const setInitialState = (
		viewportHeight: number,
		viewportWidth: number,
		data: AssetCountByTimeBucketResponseDto
	) => {
		assetGridState.set({
			viewportHeight,
			viewportWidth,
			timelineHeight: 0,
			buckets: data.buckets.map((d) => ({
				bucketDate: d.timeBucket,
				bucketHeight: calculateViewportHeightByNumberOfAsset(d.count, viewportWidth),
				assets: [],
				cancelToken: new AbortController()
			})),
			assets: []
		});

		// Update timeline height based on calculated bucket height
		assetGridState.update((state) => {
			state.timelineHeight = lodash.sumBy(state.buckets, (d) => d.bucketHeight);
			return state;
		});
	};

	const getAssetsByBucket = async (bucket: string) => {
		try {
			const currentBucketData = _assetGridState.buckets.find((b) => b.bucketDate === bucket);
			if (currentBucketData?.assets && currentBucketData.assets.length > 0) {
				return;
			}

			loadingBucketState.set({
				..._loadingBucketState,
				[bucket]: true
			});
			const { data: assets } = await api.assetApi.getAssetByTimeBucket(
				{
					timeBucket: [bucket]
				},
				{ signal: currentBucketData?.cancelToken.signal }
			);
			loadingBucketState.set({
				..._loadingBucketState,
				[bucket]: false
			});

			// Update assetGridState with assets by time bucket
			assetGridState.update((state) => {
				const bucketIndex = state.buckets.findIndex((b) => b.bucketDate === bucket);
				state.buckets[bucketIndex].assets = assets;
				state.assets = lodash.flatMap(state.buckets, (b) => b.assets);

				return state;
			});
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (e: any) {
			if (e.name === 'CanceledError') {
				return;
			}
			console.error('Failed to get asset for bucket ', bucket);
			console.error(e);
		}
	};

	const removeAsset = (assetId: string) => {
		assetGridState.update((state) => {
			const bucketIndex = state.buckets.findIndex((b) => b.assets.some((a) => a.id === assetId));
			const assetIndex = state.buckets[bucketIndex].assets.findIndex((a) => a.id === assetId);
			state.buckets[bucketIndex].assets.splice(assetIndex, 1);

			if (state.buckets[bucketIndex].assets.length === 0) {
				_removeBucket(state.buckets[bucketIndex].bucketDate);
			}
			state.assets = lodash.flatMap(state.buckets, (b) => b.assets);
			return state;
		});
	};

	const _removeBucket = (bucketDate: string) => {
		assetGridState.update((state) => {
			const bucketIndex = state.buckets.findIndex((b) => b.bucketDate === bucketDate);
			state.buckets.splice(bucketIndex, 1);
			state.assets = lodash.flatMap(state.buckets, (b) => b.assets);
			return state;
		});
	};

	const updateBucketHeight = (bucket: string, actualBucketHeight: number) => {
		assetGridState.update((state) => {
			const bucketIndex = state.buckets.findIndex((b) => b.bucketDate === bucket);
			// Update timeline height based on the new bucket height
			const estimateBucketHeight = state.buckets[bucketIndex].bucketHeight;

			if (actualBucketHeight >= estimateBucketHeight) {
				state.timelineHeight += actualBucketHeight - estimateBucketHeight;
			} else {
				state.timelineHeight -= estimateBucketHeight - actualBucketHeight;
			}

			state.buckets[bucketIndex].bucketHeight = actualBucketHeight;
			return state;
		});
	};

	const cancelBucketRequest = async (token: AbortController, bucketDate: string) => {
		token.abort();
		// set new abort controller for bucket
		assetGridState.update((state) => {
			const bucketIndex = state.buckets.findIndex((b) => b.bucketDate === bucketDate);
			state.buckets[bucketIndex].cancelToken = new AbortController();
			return state;
		});
	};

	return {
		setInitialState,
		getAssetsByBucket,
		removeAsset,
		updateBucketHeight,
		cancelBucketRequest
	};
}

export const assetStore = createAssetStore();
