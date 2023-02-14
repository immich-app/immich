import {
	notificationController,
	NotificationType
} from './../components/shared-components/notification/notification';
import { uploadAssetsStore } from '$lib/stores/upload';
import type { UploadAsset } from '../models/upload-asset';
import { api, AssetFileUploadResponseDto } from '@api';
import { addAssetsToAlbum, getFileMimeType, getFilenameExtension } from '$lib/utils/asset-utils';
import { Subject, mergeMap } from 'rxjs';

export const openFileUploadDialog = (
	albumId: string | undefined = undefined,
	sharedKey: string | undefined = undefined,
	onDone?: (id: string) => void
) => {
	try {
		const fileSelector = document.createElement('input');

		fileSelector.type = 'file';
		fileSelector.multiple = true;

		// When adding a content type that is unsupported by browsers, make sure
		// to also add it to getFileMimeType() otherwise the upload will fail.
		fileSelector.accept = 'image/*,video/*,.heic,.heif,.dng,.3gp,.nef,.srw,.raf';

		fileSelector.onchange = async (e: Event) => {
			const target = e.target as HTMLInputElement;
			if (!target.files) {
				return;
			}
			const files = Array.from<File>(target.files);

			await fileUploadHandler(files, albumId, sharedKey, onDone);
		};

		fileSelector.click();
	} catch (e) {
		console.log('Error selecting file', e);
	}
};

export const fileUploadHandler = async (
	files: File[],
	albumId: string | undefined = undefined,
	sharedKey: string | undefined = undefined,
	onDone?: (id: string) => void
) => {
	const files$ = new Subject<File>();
	files$
		.pipe(
			mergeMap(async (file) => {
				await fileUploader(file, albumId, sharedKey, onDone);
			}, 2)
		)
		.subscribe();

	const acceptedFile = files.filter((file) => {
		const assetType = getFileMimeType(file).split('/')[0];
		return assetType === 'video' || assetType === 'image';
	});
	for (const file of acceptedFile) {
		files$.next(file);
	}
};

//TODO: should probably use the @api SDK
async function fileUploader(
	asset: File,
	albumId: string | undefined = undefined,
	sharedKey: string | undefined = undefined,
	onDone?: (id: string) => void
) {
	console.log('uploading', asset.name);
	const mimeType = getFileMimeType(asset);
	const assetType = mimeType.split('/')[0].toUpperCase();
	const fileExtension = getFilenameExtension(asset.name);
	const formData = new FormData();
	const createdAt = new Date(asset.lastModified).toISOString();
	const deviceAssetId = 'web' + '-' + asset.name + '-' + asset.lastModified;

	try {
		// Create and add Unique ID of asset on the device
		formData.append('deviceAssetId', deviceAssetId);

		// Get device id - for web -> use WEB
		formData.append('deviceId', 'WEB');

		// Get asset type
		formData.append('assetType', assetType);

		// Get Asset Created Date
		formData.append('createdAt', createdAt);

		// Get Asset Modified At
		formData.append('modifiedAt', new Date(asset.lastModified).toISOString());

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

		// Check if asset upload on server before performing upload
		const { data, status } = await api.assetApi.checkDuplicateAsset(
			{
				deviceAssetId: String(deviceAssetId),
				deviceId: 'WEB'
			},
			{
				params: {
					key: sharedKey
				}
			}
		);

		if (status === 200) {
			if (data.isExist) {
				const dataId = data.id;
				if (albumId && dataId) {
					addAssetsToAlbum(albumId, [dataId], sharedKey);
				}
				onDone && dataId && onDone(dataId);
				return;
			}
		}

		const request = new XMLHttpRequest();
		request.upload.onloadstart = () => {
			const newUploadAsset: UploadAsset = {
				id: deviceAssetId,
				file: asset,
				progress: 0,
				fileExtension: fileExtension
			};

			uploadAssetsStore.addNewUploadAsset(newUploadAsset);
		};

		request.upload.onload = () => {
			uploadAssetsStore.removeUploadAsset(deviceAssetId);
			const res: AssetFileUploadResponseDto = JSON.parse(request.response || '{}');
			if (albumId) {
				try {
					if (res.id) {
						addAssetsToAlbum(albumId, [res.id], sharedKey);
					}
				} catch (e) {
					console.error('ERROR parsing data JSON in upload onload');
				}
			}
			onDone && onDone(res.id);
		};

		// listen for `error` event
		request.upload.onerror = () => {
			uploadAssetsStore.removeUploadAsset(deviceAssetId);
			handleUploadError(asset, request.response);
		};

		// listen for `abort` event
		request.upload.onabort = () => {
			uploadAssetsStore.removeUploadAsset(deviceAssetId);
			handleUploadError(asset, request.response);
		};

		// listen for `progress` event
		request.upload.onprogress = (event) => {
			const percentComplete = Math.floor((event.loaded / event.total) * 100);
			uploadAssetsStore.updateProgress(deviceAssetId, percentComplete);
		};

		request.open('POST', `/api/asset/upload?key=${sharedKey ?? ''}`);

		request.send(formData);
	} catch (e) {
		console.log('error uploading file ', e);
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
