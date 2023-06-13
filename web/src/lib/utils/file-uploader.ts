import { uploadAssetsStore } from '$lib/stores/upload';
import { addAssetsToAlbum, getFileMimeType, getFilenameExtension } from '$lib/utils/asset-utils';
import type { AssetFileUploadResponseDto } from '@api';
import axios from 'axios';
import { combineLatestAll, filter, firstValueFrom, from, mergeMap, of } from 'rxjs';
import type { UploadAsset } from '../models/upload-asset';
import {
	notificationController,
	NotificationType
} from './../components/shared-components/notification/notification';

export const openFileUploadDialog = async (
	albumId: string | undefined = undefined,
	sharedKey: string | undefined = undefined
) => {
	return new Promise<(string | undefined)[]>((resolve, reject) => {
		try {
			const fileSelector = document.createElement('input');

			fileSelector.type = 'file';
			fileSelector.multiple = true;

			// When adding a content type that is unsupported by browsers, make sure
			// to also add it to getFileMimeType() otherwise the upload will fail.
			fileSelector.accept = 'image/*,video/*,.heic,.heif,.dng,.3gp,.nef,.srw,.raf,.insp,.insv,.arw';

			fileSelector.onchange = async (e: Event) => {
				const target = e.target as HTMLInputElement;
				if (!target.files) {
					return;
				}
				const files = Array.from<File>(target.files);

				resolve(await fileUploadHandler(files, albumId, sharedKey));
			};

			fileSelector.click();
		} catch (e) {
			console.log('Error selecting file', e);
			reject(e);
		}
	});
};

export const fileUploadHandler = async (
	files: File[],
	albumId: string | undefined = undefined,
	sharedKey: string | undefined = undefined
) => {
	return firstValueFrom(
		from(files).pipe(
			filter((file) => {
				const assetType = getFileMimeType(file).split('/')[0];
				return assetType === 'video' || assetType === 'image';
			}),
			mergeMap(async (file) => of(await fileUploader(file, albumId, sharedKey)), 2),
			combineLatestAll()
		)
	);
};

//TODO: should probably use the @api SDK
async function fileUploader(
	asset: File,
	albumId: string | undefined = undefined,
	sharedKey: string | undefined = undefined
): Promise<string | undefined> {
	const mimeType = getFileMimeType(asset);
	const assetType = mimeType.split('/')[0].toUpperCase();
	const fileExtension = getFilenameExtension(asset.name);
	const formData = new FormData();
	const fileCreatedAt = new Date(asset.lastModified).toISOString();
	const deviceAssetId = 'web' + '-' + asset.name + '-' + asset.lastModified;

	try {
		// Create and add pseudo-unique ID of asset on the device
		formData.append('deviceAssetId', deviceAssetId);

		// Get device id - for web -> use WEB
		formData.append('deviceId', 'WEB');

		// Get asset type
		formData.append('assetType', assetType);

		// Get Asset Created Date
		formData.append('fileCreatedAt', fileCreatedAt);

		// Get Asset Modified At
		formData.append('fileModifiedAt', new Date(asset.lastModified).toISOString());

		// Set Asset is Favorite to false
		formData.append('isFavorite', 'false');

		// Get asset duration
		formData.append('duration', '0:00:00.000000');

		// Get asset file extension
		formData.append('fileExtension', '.' + fileExtension);

		// Get asset binary data with a custom MIME type, because browsers will
		// use application/octet-stream for unsupported MIME types, leading to
		// failed uploads.
		formData.append('assetData', new File([asset], asset.name, { type: mimeType }));

		const newUploadAsset: UploadAsset = {
			id: deviceAssetId,
			file: asset,
			progress: 0,
			fileExtension: fileExtension
		};

		uploadAssetsStore.addNewUploadAsset(newUploadAsset);

		const response = await axios.post(`/api/asset/upload`, formData, {
			params: {
				key: sharedKey
			},
			onUploadProgress: (event) => {
				const percentComplete = Math.floor((event.loaded / event.total) * 100);
				uploadAssetsStore.updateProgress(deviceAssetId, percentComplete);
			}
		});

		if (response.status == 200 || response.status == 201) {
			const res: AssetFileUploadResponseDto = response.data;

			if (albumId && res.id) {
				await addAssetsToAlbum(albumId, [res.id], sharedKey);
			}

			setTimeout(() => {
				uploadAssetsStore.removeUploadAsset(deviceAssetId);
			}, 1000);

			return res.id;
		}
	} catch (e) {
		console.log('error uploading file ', e);
		handleUploadError(asset, JSON.stringify(e));
		uploadAssetsStore.removeUploadAsset(deviceAssetId);
	}
}

function handleUploadError(asset: File, respBody = '{}', extraMessage?: string) {
	try {
		const res = JSON.parse(respBody);

		const extraMsg = res ? ' ' + res?.message : '';

		notificationController.show({
			type: NotificationType.Error,
			message: `Cannot upload file ${asset.name} ${extraMsg}${extraMessage}`,
			timeout: 5000
		});
	} catch (e) {
		console.error('ERROR parsing data JSON in handleUploadError');
	}
}
