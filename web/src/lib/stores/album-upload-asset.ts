import { writable } from 'svelte/store';

function createAlbumUploadStore() {
	const albumUploadAsset = writable<Array<string>>([]);
	const albumUploadAssetCount = writable<number>(9999);

	return {
		asset: albumUploadAsset,
		count: albumUploadAssetCount
	};
}

export const albumUploadAssetStore = createAlbumUploadStore();
