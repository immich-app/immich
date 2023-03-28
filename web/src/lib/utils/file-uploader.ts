import {
	notificationController,
	NotificationType
} from './../components/shared-components/notification/notification';
import { uploadAssetsStore } from '$lib/stores/upload';
import type { UploadAsset } from '../models/upload-asset';
import { api, AssetBulkUploadCheckResultReasonEnum, AssetFileUploadResponseDto } from '@api';
import { addAssetsToAlbum, getFileMimeType, getFilenameExtension } from '$lib/utils/asset-utils';
import { mergeMap, filter, firstValueFrom, from, of, combineLatestAll } from 'rxjs';
import axios from 'axios';

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
			fileSelector.accept = 'image/*,video/*,.heic,.heif,.dng,.3gp,.nef,.srw,.raf';

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

async function sha1(file: File): Promise<string> {
	const fileBuffer = await file.arrayBuffer();
	const hashBuffer = await crypto.subtle.digest('SHA-1', fileBuffer);

	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

	return hashHex;
}

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

	try {
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

		const checksum = await sha1(asset);

		// Get asset binary data with a custom MIME type, because browsers will
		// use application/octet-stream for unsupported MIME types, leading to
		// failed uploads.
		formData.append('assetData', new File([asset], asset.name, { type: mimeType }));

		// Check if asset upload on server before performing upload
		const { data, status } = await api.assetApi.bulkUploadCheck({
			assets: [{ id: 'web', checksum: checksum }]
		});

		if (
			status === 200 &&
			data.results[0].reason === AssetBulkUploadCheckResultReasonEnum.Duplicate
		) {
			if (albumId) {
				await addAssetsToAlbum(albumId, [data.results[0].id], sharedKey);
			}

			return asset.name;
		}

		const newUploadAsset: UploadAsset = {
			id: asset.name,
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
				uploadAssetsStore.updateProgress(asset.name, percentComplete);
			}
		});

		if (response.status == 200 || response.status == 201) {
			const res: AssetFileUploadResponseDto = response.data;

			if (albumId && res.id) {
				await addAssetsToAlbum(albumId, [res.id], sharedKey);
			}

			setTimeout(() => {
				uploadAssetsStore.removeUploadAsset(asset.name);
			}, 1000);

			return res.id;
		}
	} catch (e) {
		console.log('error uploading file ', e);
		handleUploadError(asset, JSON.stringify(e));
		uploadAssetsStore.removeUploadAsset(asset.name);
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
