import { AssetGridState } from '$lib/models/asset-grid-state';
import { api, AssetResponseDto } from '@api';
import { writable } from 'svelte/store';
import { assetGridState } from './assets.store';

// Asset Viewer
export const viewingAssetStoreState = writable<AssetResponseDto>();
export const isViewingAssetStoreState = writable<boolean>(false);

// Multi-Selection mode
export const isMultiSelectStoreState = writable<boolean>(false);

function createAssetInteractionStore() {
	let assetGridStoreState = new AssetGridState();
	assetGridState.subscribe((state) => {
		assetGridStoreState = state;
	});

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

	return {
		setViewingAsset,
		setIsViewingAsset,
		setIsMultiSelect
	};
}

export const assetInteractionStore = createAssetInteractionStore();
