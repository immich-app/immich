import { writable, derived } from 'svelte/store';
import type { UploadAsset } from '../models/upload-asset';

function createUploadStore() {
	const uploadAssets = writable<Array<UploadAsset>>([]);

	const { subscribe } = uploadAssets;

	const isUploading = derived(uploadAssets, ($uploadAssets) => {
		return $uploadAssets.length > 0 ? true : false;
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

	const removeUploadAsset = (id: string) => {
		uploadAssets.update((uploadingAsset) => uploadingAsset.filter((a) => a.id != id));
	};

	return {
		subscribe,
		isUploading,
		addNewUploadAsset,
		updateProgress,
		removeUploadAsset,
	};
}

export const uploadAssetsStore = createUploadStore();
