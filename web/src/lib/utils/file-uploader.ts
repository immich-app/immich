import {
	notificationController,
	NotificationType
} from './../components/shared-components/notification/notification';
/* @vite-ignore */
import * as exifr from 'exifr';
import { uploadAssetsStore } from '$lib/stores/upload';
import type { UploadAsset } from '../models/upload-asset';
import { AssetFileUploadResponseDto } from '@api';
import { albumUploadAssetStore } from '$lib/stores/album-upload-asset';
/**
 * Determine if the upload is for album or for the user general backup
 * @variant GENERAL - Upload assets to the server for general backup
 * @variant ALBUM - Upload assets to the server for backup and add to the album
 */
export enum UploadType {
	/**
	 * Upload assets to the server
	 */
	GENERAL = 'GENERAL',

	/**
	 * Upload assets to the server and add to album
	 */
	ALBUM = 'ALBUM'
}

export const openFileUploadDialog = (uploadType: UploadType) => {
	try {
		const fileSelector = document.createElement('input');

		fileSelector.type = 'file';
		fileSelector.multiple = true;
		fileSelector.accept = 'image/*,video/*,.heic,.heif,.dng,.3gp';

		fileSelector.onchange = async (e: Event) => {
			const target = e.target as HTMLInputElement;
			if (!target.files) {
				return;
			}
			const files = Array.from<File>(target.files);

			if (files.length > 200) {
				notificationController.show({
					type: NotificationType.Error,
					message: `Cannot upload more than 200 files at a time - you are uploading ${files.length} files. 
          Please use the CLI tool if you need to upload more than 200 files.`,
					timeout: 5000
				});

				return;
			}

			const acceptedFile = files.filter(
				(e) => e.type.split('/')[0] === 'video' || e.type.split('/')[0] === 'image'
			);

			if (uploadType === UploadType.ALBUM) {
				albumUploadAssetStore.asset.set([]);
				albumUploadAssetStore.count.set(acceptedFile.length);
			}

			await mergeMap(acceptedFile.map((asset) => {
				const deviceAssetId = 'web' + '-' + asset.name + '-' + asset.lastModified;
				const fileExtension = getFileExt(asset);
				const newUploadAsset: UploadAsset = {
					id: deviceAssetId,
					file: asset,
					progress: 0,
					fileExtension: fileExtension
				};
	
				uploadAssetsStore.addNewUploadAsset(newUploadAsset);
				return () => fileUploader(deviceAssetId, asset, uploadType);
			}));
		};

		fileSelector.click();
	} catch (e) {
		console.log('Error selecting file', e);
	}
};

//TODO: should probably use the @api SDK
async function fileUploader(deviceAssetId: string, asset: File, uploadType: UploadType) {
	const assetType = asset.type.split('/')[0].toUpperCase();
	const fileExtension = getFileExt(asset);
	const formData = new FormData();

	try {
		let exifData = null;

		if (assetType !== 'VIDEO') {
			exifData = await exifr.parse(asset).catch((e) => console.log('error parsing exif', e));
		}

		const createdAt =
			exifData && exifData.DateTimeOriginal != null
				? new Date(exifData.DateTimeOriginal).toISOString()
				: new Date(asset.lastModified).toISOString();

		// const deviceAssetId = 'web' + '-' + asset.name + '-' + asset.lastModified;

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

		// Get asset binary data.
		formData.append('assetData', asset);

		const request = new XMLHttpRequest();

		// request.upload.onloadstart = () => {
		// 	const newUploadAsset: UploadAsset = {
		// 		id: deviceAssetId,
		// 		file: asset,
		// 		progress: 0,
		// 		fileExtension: fileExtension
		// 	};

		// 	uploadAssetsStore.addNewUploadAsset(newUploadAsset);
		// };

		request.upload.onload = () => {
			setTimeout(() => {
				uploadAssetsStore.removeUploadAsset(deviceAssetId);
			}, 1000);
		};

		const deferred = new Promise((resolve, reject) => {
			request.onreadystatechange = () => {
				try {
					if (request.readyState === 4) {
						const res: AssetFileUploadResponseDto = JSON.parse(request.response || '{}');

						if (uploadType === UploadType.ALBUM) {
							albumUploadAssetStore.asset.update((assets) => {
								return [...assets, res?.id || ''];
							});
						}

						if (request.status !== 201) {
							handleUploadError(asset, res);
						}

						resolve(res);
					}
				} catch (e) {
					console.error('ERROR parsing data JSON in upload onreadystatechange');
					resolve(undefined);
				}
			};
		});

		// listen for `error` event
		request.upload.onerror = () => {
			uploadAssetsStore.removeUploadAsset(deviceAssetId);
		};

		// listen for `abort` event
		request.upload.onabort = () => {
			uploadAssetsStore.removeUploadAsset(deviceAssetId);
		};

		// listen for `progress` event
		request.upload.onprogress = (event) => {
			const percentComplete = Math.floor((event.loaded / event.total) * 100);
			uploadAssetsStore.updateProgress(deviceAssetId, percentComplete);
		};

		request.open('POST', `/api/asset/upload`);

		request.send(formData);
		await deferred;
	} catch (e) {
		console.log('error uploading file ', e);
	}
}
// TODO: This should have a proper type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handleUploadError(asset: File, respBody?: any) {
	const extraMsg = respBody ? ' ' + respBody.message : '';

	notificationController.show({
		type: NotificationType.Error,
		message: `Cannot upload file ${asset.name}!${extraMsg}`,
		timeout: 5000
	});
}

async function mergeMap<T>(source: (() => Promise<T>)[], concurrent = 2) {
	let results: T[] = [];

	while (source.length) {
		concurrent = concurrent > source.length ? source.length : concurrent;

		const selectedFns = source.splice(0, concurrent);
		const selectedResults = await Promise.all(selectedFns.map((fn) => fn()));

		results.push(...selectedResults);
	}

	return results;
}

function getFileExt(asset: File) {
	const temp = asset.name.split('.');
	return temp[temp.length - 1]
}
