import { api, AddAssetsResponseDto, AssetResponseDto } from '@api';
import {
	notificationController,
	NotificationType
} from '$lib/components/shared-components/notification/notification';
import { downloadAssets } from '$lib/stores/download';

export const addAssetsToAlbum = async (
	albumId: string,
	assetIds: Array<string>,
	key: string | undefined = undefined
): Promise<AddAssetsResponseDto> =>
	api.albumApi
		.addAssetsToAlbum({ id: albumId, addAssetsDto: { assetIds }, key })
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
	onDone?: () => void,
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
				{ downloadFilesDto: { assetIds }, key },
				{
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
				onDone?.();
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

/**
 * Returns the lowercase filename extension without a dot (.) and
 * an empty string when not found.
 */
export function getFilenameExtension(filename: string): string {
	const lastIndex = Math.max(0, filename.lastIndexOf('.'));
	const startIndex = (lastIndex || Infinity) + 1;
	return filename.slice(startIndex).toLowerCase();
}

/**
 * Returns the filename of an asset including file extension
 */
export function getAssetFilename(asset: AssetResponseDto): string {
	const fileExtension = getFilenameExtension(asset.originalPath);
	return `${asset.originalFileName}.${fileExtension}`;
}

/**
 * Returns the MIME type of the file and an empty string when not found.
 */
export function getFileMimeType(file: File): string {
	const mimeTypes: Record<string, string> = {
		'3fr': 'image/x-hasselblad-3fr',
		'3gp': 'video/3gpp',
		ari: 'image/x-arriflex-ari',
		arw: 'image/x-sony-arw',
		avif: 'image/avif',
		cap: 'image/x-phaseone-cap',
		cin: 'image/x-phantom-cin',
		cr2: 'image/x-canon-cr2',
		cr3: 'image/x-canon-cr3',
		crw: 'image/x-canon-crw',
		dcr: 'image/x-kodak-dcr',
		dng: 'image/dng',
		erf: 'image/x-epson-erf',
		fff: 'image/x-hasselblad-fff',
		heic: 'image/heic',
		heif: 'image/heif',
		iiq: 'image/x-phaseone-iiq',
		insp: 'image/jpeg',
		insv: 'video/mp4',
		jxl: 'image/jxl',
		k25: 'image/x-kodak-k25',
		kdc: 'image/x-kodak-kdc',
		mrw: 'image/x-minolta-mrw',
		nef: 'image/x-nikon-nef',
		orf: 'image/x-olympus-orf',
		ori: 'image/x-olympus-ori',
		pef: 'image/x-pentax-pef',
		raf: 'image/x-fuji-raf',
		raw: 'image/x-panasonic-raw',
		rwl: 'image/x-leica-rwl',
		sr2: 'image/x-sony-sr2',
		srf: 'image/x-sony-srf',
		srw: 'image/x-samsung-srw',
		x3f: 'image/x-sigma-x3f'
	};
	// Return the MIME type determined by the browser or the MIME type based on the file extension.
	return file.type || (mimeTypes[getFilenameExtension(file.name)] ?? '');
}

/**
 * Returns aspect ratio for the asset
 */
export function getAssetRatio(asset: AssetResponseDto) {
	let height = asset.exifInfo?.exifImageHeight || 235;
	let width = asset.exifInfo?.exifImageWidth || 235;
	const orientation = Number(asset.exifInfo?.orientation);
	if (orientation) {
		if (orientation == 6 || orientation == -90) {
			[width, height] = [height, width];
		}
	}
	return { width, height };
}
