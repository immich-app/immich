import * as exifr from 'exifr';
import { serverEndpoint } from '../constants';

export async function fileUploader(asset: File, accessToken: string) {
	const assetType = asset.type.split('/')[0].toUpperCase();
	const temp = asset.name.split('.');
	const fileExtension = temp[temp.length - 1];
	const formData = new FormData();

	try {
		let exifData = null;

		if (assetType !== 'VIDEO') {
			exifData = await exifr.parse(asset);
		}

		const createdAt =
			exifData && exifData.DateTimeOriginal != null
				? new Date(exifData.DateTimeOriginal).toISOString()
				: new Date(asset.lastModified).toISOString();

		// Create and add Unique ID of asset on the device
		formData.append('deviceAssetId', 'web' + '-' + asset.name + '-' + asset.lastModified);

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
		request.upload.onload = () => {
			console.log(`The transfer is completed: ${request.status} ${request.response}`);
		};

		// listen for `error` event
		request.upload.onerror = () => {
			console.error('Download failed.');
		};

		// listen for `abort` event
		request.upload.onabort = () => {
			console.error('Download cancelled.');
		};

		// listen for `progress` event
		request.upload.onprogress = (event) => {
			// event.loaded returns how many bytes are downloaded
			// event.total returns the total number of bytes
			// event.total is only available if server sends `Content-Length` header
			console.log(`${asset.name} UPLOAD ${event.loaded} of ${event.total} bytes`);
		};

		request.open('POST', `${serverEndpoint}/asset/upload`);
		request.setRequestHeader('Authorization', `Bearer ${accessToken}`);

		request.send(formData);
	} catch (e) {
		console.log('error uploading file ', e);
	}
}
