import { TimeGroupEnum } from './../../api/open-api/api';
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

	const updateBucketHeight = (bucket: string, height: number) => {
		assetGridState.update((state) => {
			const bucketIndex = state.buckets.findIndex((b) => b.bucketDate === bucket);
			state.buckets[bucketIndex].bucketHeight = height;
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
