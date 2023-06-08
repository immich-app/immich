import { AssetGridState, BucketPosition } from '$lib/models/asset-grid-state';
import { AssetCountByTimeBucketResponseDto, api } from '@api';
import { sumBy, flatMap } from 'lodash-es';
import { writable } from 'svelte/store';

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

	const estimateViewportHeight = (assetCount: number, viewportWidth: number): number => {
		// Ideally we would use the average aspect ratio for the photoset, however assume
		// a normal landscape aspect ratio of 3:2, then discount for the likelihood we
		// will be scaling down and coalescing.
		const thumbnailHeight = 235;
		const unwrappedWidth = (3 / 2) * assetCount * thumbnailHeight * (7 / 10);
		const rows = Math.ceil(unwrappedWidth / viewportWidth);
		const height = rows * thumbnailHeight;
		return height;
	};

	/**
	 * Set initial state
	 * @param viewportHeight
	 * @param viewportWidth
	 * @param data
	 */
	const setInitialState = (
		viewportHeight: number,
		viewportWidth: number,
		data: AssetCountByTimeBucketResponseDto,
		userId: string | undefined
	) => {
		assetGridState.set({
			viewportHeight,
			viewportWidth,
			timelineHeight: 0,
			buckets: data.buckets.map((bucket) => ({
				bucketDate: bucket.timeBucket,
				bucketHeight: estimateViewportHeight(bucket.count, viewportWidth),
				assets: [],
				cancelToken: new AbortController(),
				position: BucketPosition.Unknown
			})),
			assets: [],
			userId
		});

		// Update timeline height based on calculated bucket height
		assetGridState.update((state) => {
			state.timelineHeight = sumBy(state.buckets, (d) => d.bucketHeight);
			return state;
		});
	};

	const getAssetsByBucket = async (bucket: string, position: BucketPosition) => {
		try {
			const currentBucketData = _assetGridState.buckets.find((b) => b.bucketDate === bucket);
			if (currentBucketData?.assets && currentBucketData.assets.length > 0) {
				assetGridState.update((state) => {
					const bucketIndex = state.buckets.findIndex((b) => b.bucketDate === bucket);
					state.buckets[bucketIndex].position = position;
					return state;
				});
				return;
			}

			loadingBucketState.set({
				..._loadingBucketState,
				[bucket]: true
			});
			const { data: assets } = await api.assetApi.getAssetByTimeBucket(
				{
					getAssetByTimeBucketDto: {
						timeBucket: [bucket],
						userId: _assetGridState.userId,
						withoutThumbs: true
					}
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
				state.buckets[bucketIndex].position = position;
				state.assets = flatMap(state.buckets, (b) => b.assets);
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
			state.assets = flatMap(state.buckets, (b) => b.assets);
			return state;
		});
	};

	const _removeBucket = (bucketDate: string) => {
		assetGridState.update((state) => {
			const bucketIndex = state.buckets.findIndex((b) => b.bucketDate === bucketDate);
			state.buckets.splice(bucketIndex, 1);
			state.assets = flatMap(state.buckets, (b) => b.assets);
			return state;
		});
	};

	const updateBucketHeight = (bucket: string, actualBucketHeight: number): number => {
		let scrollTimeline = false;
		let heightDelta = 0;

		assetGridState.update((state) => {
			const bucketIndex = state.buckets.findIndex((b) => b.bucketDate === bucket);
			// Update timeline height based on the new bucket height
			const estimateBucketHeight = state.buckets[bucketIndex].bucketHeight;

			heightDelta = actualBucketHeight - estimateBucketHeight;
			state.timelineHeight += heightDelta;

			scrollTimeline = state.buckets[bucketIndex].position == BucketPosition.Above;

			state.buckets[bucketIndex].bucketHeight = actualBucketHeight;
			state.buckets[bucketIndex].position = BucketPosition.Unknown;

			return state;
		});

		if (scrollTimeline) {
			return heightDelta;
		}

		return 0;
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

	const updateAsset = (assetId: string, isFavorite: boolean) => {
		assetGridState.update((state) => {
			const bucketIndex = state.buckets.findIndex((b) => b.assets.some((a) => a.id === assetId));
			const assetIndex = state.buckets[bucketIndex].assets.findIndex((a) => a.id === assetId);
			state.buckets[bucketIndex].assets[assetIndex].isFavorite = isFavorite;

			state.assets = flatMap(state.buckets, (b) => b.assets);
			return state;
		});
	};

	return {
		setInitialState,
		getAssetsByBucket,
		removeAsset,
		updateBucketHeight,
		cancelBucketRequest,
		updateAsset
	};
}

export const assetStore = createAssetStore();
