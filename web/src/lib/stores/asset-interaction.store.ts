import { AssetGridState, BucketPosition } from '$lib/models/asset-grid-state';
import { api, AssetResponseDto } from '@api';
import { derived, writable } from 'svelte/store';
import { assetGridState, assetStore } from './assets.store';
import { sortBy } from 'lodash-es';

// Asset Viewer
export const viewingAssetStoreState = writable<AssetResponseDto>();
export const isViewingAssetStoreState = writable<boolean>(false);

// Multi-Selection mode
export const assetsInAlbumStoreState = writable<AssetResponseDto[]>([]);
export const selectedAssets = writable<Set<AssetResponseDto>>(new Set());
export const selectedGroup = writable<Set<string>>(new Set());
export const isMultiSelectStoreState = derived(
	selectedAssets,
	($selectedAssets) => $selectedAssets.size > 0
);

function createAssetInteractionStore() {
	let _assetGridState = new AssetGridState();
	let _viewingAssetStoreState: AssetResponseDto;
	let _selectedAssets: Set<AssetResponseDto>;
	let _selectedGroup: Set<string>;
	let _assetsInAlbums: AssetResponseDto[];
	let savedAssetLength = 0;
	let assetSortedByDate: AssetResponseDto[] = [];

	// Subscriber
	assetGridState.subscribe((state) => {
		_assetGridState = state;
	});

	viewingAssetStoreState.subscribe((asset) => {
		_viewingAssetStoreState = asset;
	});

	selectedAssets.subscribe((assets) => {
		_selectedAssets = assets;
	});

	selectedGroup.subscribe((group) => {
		_selectedGroup = group;
	});

	assetsInAlbumStoreState.subscribe((assets) => {
		_assetsInAlbums = assets;
	});

	// Methods

	/**
	 * Asset Viewer
	 */
	const setViewingAsset = async (asset: AssetResponseDto) => {
		setViewingAssetId(asset.id);
	};

	const setViewingAssetId = async (id: string) => {
		const { data } = await api.assetApi.getAssetById({ id });
		viewingAssetStoreState.set(data);
		isViewingAssetStoreState.set(true);
	};

	const setIsViewingAsset = (isViewing: boolean) => {
		isViewingAssetStoreState.set(isViewing);
	};

	const navigateAsset = async (direction: 'next' | 'previous') => {
		// Flatten and sort the asset by date if there are new assets
		if (assetSortedByDate.length === 0 || savedAssetLength !== _assetGridState.assets.length) {
			assetSortedByDate = sortBy(_assetGridState.assets, (a) => a.fileCreatedAt);
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
				await assetStore.getAssetsByBucket(nextBucket, BucketPosition.Below);
				navigateAsset(direction);
			}
			return;
		}

		const nextAsset = assetSortedByDate[nextIndex];
		if (nextAsset) {
			setViewingAsset(nextAsset);
		}
	};

	/**
	 * Multiselect
	 */
	const addAssetToMultiselectGroup = (asset: AssetResponseDto) => {
		// Not select if in album already
		if (_assetsInAlbums.find((a) => a.id === asset.id)) {
			return;
		}

		_selectedAssets.add(asset);
		selectedAssets.set(_selectedAssets);
	};

	const removeAssetFromMultiselectGroup = (asset: AssetResponseDto) => {
		_selectedAssets.delete(asset);
		selectedAssets.set(_selectedAssets);
	};

	const addGroupToMultiselectGroup = (group: string) => {
		_selectedGroup.add(group);
		selectedGroup.set(_selectedGroup);
	};

	const removeGroupFromMultiselectGroup = (group: string) => {
		_selectedGroup.delete(group);
		selectedGroup.set(_selectedGroup);
	};

	const clearMultiselect = () => {
		_selectedAssets.clear();
		_selectedGroup.clear();
		_assetsInAlbums = [];

		selectedAssets.set(_selectedAssets);
		selectedGroup.set(_selectedGroup);
		assetsInAlbumStoreState.set(_assetsInAlbums);
	};

	return {
		setViewingAsset,
		setViewingAssetId,
		setIsViewingAsset,
		navigateAsset,
		addAssetToMultiselectGroup,
		removeAssetFromMultiselectGroup,
		addGroupToMultiselectGroup,
		removeGroupFromMultiselectGroup,
		clearMultiselect
	};
}

export const assetInteractionStore = createAssetInteractionStore();
