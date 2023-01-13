import { api, AddAssetsResponseDto, AssetResponseDto, ThumbnailFormat } from '@api';
import {
	notificationController,
	NotificationType
} from '$lib/components/shared-components/notification/notification';
import { downloadAssets } from '$lib/stores/download';

export const getThumbnailUrl = (assetId: string, format: ThumbnailFormat, key?: string) => {
	let url = `/api/asset/thumbnail/${assetId}?format=${format}`;
	if (key) {
		url += `&key=${key}`;
	}
	return url;
};

export const addAssetsToAlbum = async (
	albumId: string,
	assetIds: Array<string>,
	key: string | undefined = undefined
): Promise<AddAssetsResponseDto> =>
	api.albumApi
		.addAssetsToAlbum(albumId, { assetIds }, { params: { key } })
		.then(({ data: dto }) => {
			if (dto.successfullyAdded > 0) {
				// This might be 0 if the user tries to add an asset that is already in the album
				notificationController.show({
					message: `Added ${dto.successfullyAdded} to ${dto.album?.albumName}`,
					type: NotificationType.Info
				});
			}

			return dto;
		});

export async function bulkDownload(
	fileName: string,
	assets: AssetResponseDto[],
	onDone: () => void,
	key?: string
) {
	const assetIds = assets.map((asset) => asset.id);

	try {
		// let skip = 0;
		let count = 0;
		let done = false;

		while (!done) {
			count++;

			const downloadFileName = fileName + `${count === 1 ? '' : count}.zip`;
			downloadAssets.set({ [downloadFileName]: 0 });

			let total = 0;

			const { data, status, headers } = await api.assetApi.downloadFiles(
				{ assetIds },
				{
					params: { key },
					responseType: 'blob',
					onDownloadProgress: function (progressEvent) {
						const request = this as XMLHttpRequest;
						if (!total) {
							total = Number(request.getResponseHeader('X-Immich-Content-Length-Hint')) || 0;
						}

						if (total) {
							const current = progressEvent.loaded;
							downloadAssets.set({ [downloadFileName]: Math.floor((current / total) * 100) });
						}
					}
				}
			);

			const isNotComplete = headers['x-immich-archive-complete'] === 'false';
			const fileCount = Number(headers['x-immich-archive-file-count']) || 0;
			if (isNotComplete && fileCount > 0) {
				// skip += fileCount;
			} else {
				onDone();
				done = true;
			}

			if (!(data instanceof Blob)) {
				return;
			}

			if (status === 201) {
				const fileUrl = URL.createObjectURL(data);
				const anchor = document.createElement('a');
				anchor.href = fileUrl;
				anchor.download = downloadFileName;

				document.body.appendChild(anchor);
				anchor.click();
				document.body.removeChild(anchor);

				URL.revokeObjectURL(fileUrl);

				// Remove item from download list
				setTimeout(() => {
					downloadAssets.set({});
				}, 2000);
			}
		}
	} catch (e) {
		console.error('Error downloading file ', e);
		notificationController.show({
			type: NotificationType.Error,
			message: 'Error downloading file, check console for more details.'
		});
	}
}
