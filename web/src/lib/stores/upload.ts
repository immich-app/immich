import { writable, derived } from 'svelte/store';
import type { UploadAsset } from '../models/upload-asset';

export const uploadAssets = writable<Array<UploadAsset>>([]);

export const isUploading = derived(uploadAssets, ($uploadAssets) => {
	$uploadAssets.length > 0 ? true : false;
});

function createUploadStore() {
	const uploadAssets = writable<Array<UploadAsset>>([]);

	const { subscribe } = uploadAssets;

	const isUploading = derived(uploadAssets, ($uploadAssets) => {
		$uploadAssets.length > 0 ? true : false;
	});

	const addNewUploadAsset = (newAsset: UploadAsset) => {
		uploadAssets.update((currentSet) => [...currentSet, newAsset]);
	};

	const updateProgress = (id: string, progress: number) => {
		uploadAssets.update((uploadingAssets) => {
			return uploadingAssets.map((asset) => {
				if (asset.id == id) {
					return {
						...asset,
						progress: progress,
					};
				}

				return asset;
			});
		});
	};

	return {
		subscribe,
		isUploading,
		addNewUploadAsset,
		updateProgress,
	};
}

export const uploadAssetsStore = createUploadStore();
