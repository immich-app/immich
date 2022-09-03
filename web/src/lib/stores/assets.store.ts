import { writable, derived, readable } from 'svelte/store';
import lodash from 'lodash-es';
import _ from 'lodash';
import moment from 'moment';
import { api, AssetCountByTimeBucketResponseDto, AssetResponseDto } from '@api';
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
	 * Set intial state
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
			timelineHeight: calculateViewportHeightByNumberOfAsset(data.totalCount, viewportWidth),
			buckets: data.buckets.map((d) => ({
				bucketDate: d.timeBucket,
				bucketHeight: calculateViewportHeightByNumberOfAsset(d.count, viewportWidth),
				assets: [],
				cancelToken: new AbortController()
			})),
			assets: []
		});
	};

	/**
	 * Get all assets belong to a time bucket
	 * @param bucket time bucket in String format
	 */
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
		} catch (e) {
			console.error('Failed to get asset for bucket ', bucket);
			console.error(e);
		}
	};

	const updateBucketHeight = (bucket: string, height: number) => {
		assetGridState.update((state) => {
			const bucketIndex = state.buckets.findIndex((b) => b.bucketDate === bucket);
			state.buckets[bucketIndex].bucketHeight = height;
			return state;
		});
	};

	const cancelBucketRequest = (token: AbortController) => {
		token.abort();
	};

	return {
		setInitialState,
		getAssetsByBucket,
		updateBucketHeight,
		cancelBucketRequest
	};
}

export const assetStore = createAssetStore();
