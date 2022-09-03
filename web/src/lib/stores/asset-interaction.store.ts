import { AssetGridState } from '$lib/models/asset-grid-state';
import { api, AssetResponseDto } from '@api';
import { writable } from 'svelte/store';
import { assetGridState, assetStore } from './assets.store';
import _ from 'lodash-es';

// Asset Viewer
export const viewingAssetStoreState = writable<AssetResponseDto>();
export const isViewingAssetStoreState = writable<boolean>(false);

// Multi-Selection mode
export const isMultiSelectStoreState = writable<boolean>(false);

function createAssetInteractionStore() {
	let assetSortedByDate: AssetResponseDto[] = [];
	let _assetGridState = new AssetGridState();
	let _viewingAssetStoreState: AssetResponseDto;
	let savedAssetLength = 0;

	// Subscriber
	assetGridState.subscribe((state) => {
		_assetGridState = state;
	});

	viewingAssetStoreState.subscribe((asset) => {
		_viewingAssetStoreState = asset;
	});

	// Methods
	const setViewingAsset = async (asset: AssetResponseDto) => {
		const { data } = await api.assetApi.getAssetById(asset.id);
		viewingAssetStoreState.set(data);
		isViewingAssetStoreState.set(true);
	};

	const setIsViewingAsset = (isViewing: boolean) => {
		isViewingAssetStoreState.set(isViewing);
	};

	const setIsMultiSelect = (isMultiSelect: boolean) => {
		isMultiSelectStoreState.set(isMultiSelect);
	};

	const navigateAsset = async (direction: 'next' | 'previous') => {
		// Flatten and sort the asset by date if there are new assets
		if (assetSortedByDate.length === 0 || savedAssetLength !== _assetGridState.assets.length) {
			assetSortedByDate = _.sortBy(_assetGridState.assets, (a) => a.createdAt);
			savedAssetLength = _assetGridState.assets.length;
		}

		// Find the index of the current asset
		const currentIndex = assetSortedByDate.findIndex((a) => a.id === _viewingAssetStoreState.id);

		// Get the next or previous asset
		const nextIndex = direction === 'previous' ? currentIndex + 1 : currentIndex - 1;

		// Run out of asset, this might be because there is no asset in the next bucket.
		if (nextIndex == -1) {
			let nextBucket = '';
			// Find next bucket that doesn't have all assets loaded

			for (const bucket of _assetGridState.buckets) {
				if (bucket.assets.length === 0) {
					nextBucket = bucket.bucketDate;
					break;
				}
			}

			if (nextBucket !== '') {
				await assetStore.getAssetsByBucket(nextBucket);
				navigateAsset(direction);
			}
			return;
		}

		const nextAsset = assetSortedByDate[nextIndex];
		setViewingAsset(nextAsset);
	};

	return {
		setViewingAsset,
		setIsViewingAsset,
		setIsMultiSelect,
		navigateAsset
	};
}

export const assetInteractionStore = createAssetInteractionStore();
