import { UploadState } from '$lib/models/upload-asset';
import { uploadAssetsStore } from '$lib/stores/upload';
import { getKey, uploadRequest } from '$lib/utils';
import { addAssetsToAlbum } from '$lib/utils/asset-utils';
import { ExecutorQueue } from '$lib/utils/executor-queue';
import {
  Action,
  checkBulkUpload,
  getBaseUrl,
  getSupportedMediaTypes,
  type AssetFileUploadResponseDto,
} from '@immich/sdk';
import { tick } from 'svelte';
import { getServerErrorMessage, handleError } from './handle-error';

let _extensions: string[];

export const uploadExecutionQueue = new ExecutorQueue({ concurrency: 2 });

const getExtensions = async () => {
  if (!_extensions) {
    const { image, video } = await getSupportedMediaTypes();
    _extensions = [...image, ...video];
  }
  return _extensions;
};

export const openFileUploadDialog = async (albumId?: string | undefined) => {
  const extensions = await getExtensions();

  return new Promise<(string | undefined)[]>((resolve, reject) => {
    try {
      const fileSelector = document.createElement('input');

      fileSelector.type = 'file';
      fileSelector.multiple = true;
      fileSelector.accept = extensions.join(',');
      fileSelector.addEventListener('change', (e: Event) => {
        const target = e.target as HTMLInputElement;
        if (!target.files) {
          return;
        }
        const files = Array.from(target.files);

        resolve(fileUploadHandler(files, albumId));
      });

      fileSelector.click();
    } catch (error) {
      console.log('Error selecting file', error);
      reject(error);
    }
  });
};

export const fileUploadHandler = async (files: File[], albumId: string | undefined = undefined): Promise<string[]> => {
  const extensions = await getExtensions();
  const promises = [];
  for (const file of files) {
    const name = file.name.toLowerCase();
    if (extensions.some((extension) => name.endsWith(extension))) {
      uploadAssetsStore.addNewUploadAsset({ id: getDeviceAssetId(file), file, albumId });
      promises.push(uploadExecutionQueue.addTask(() => fileUploader(file, albumId)));
    }
  }

  const results = await Promise.all(promises);
  return results.filter((result): result is string => !!result);
};

function getDeviceAssetId(asset: File) {
  return 'web' + '-' + asset.name + '-' + asset.lastModified;
}

// TODO: should probably use the @api SDK
async function fileUploader(asset: File, albumId: string | undefined = undefined): Promise<string | undefined> {
  const fileCreatedAt = new Date(asset.lastModified).toISOString();
  const deviceAssetId = getDeviceAssetId(asset);

  uploadAssetsStore.markStarted(deviceAssetId);

  try {
    const formData = new FormData();
    for (const [key, value] of Object.entries({
      deviceAssetId,
      deviceId: 'WEB',
      fileCreatedAt,
      fileModifiedAt: new Date(asset.lastModified).toISOString(),
      isFavorite: 'false',
      duration: '0:00:00.000000',
      assetData: new File([asset], asset.name),
    })) {
      formData.append(key, value);
    }

    let responseData: AssetFileUploadResponseDto | undefined;
    const key = getKey();
    if (crypto?.subtle?.digest && !key) {
      uploadAssetsStore.updateAsset(deviceAssetId, { message: 'Hashing...' });
      await tick();
      try {
        const bytes = await asset.arrayBuffer();
        const hash = await crypto.subtle.digest('SHA-1', bytes);
        const checksum = Array.from(new Uint8Array(hash))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');

        const {
          results: [checkUploadResult],
        } = await checkBulkUpload({ assetBulkUploadCheckDto: { assets: [{ id: asset.name, checksum }] } });
        if (checkUploadResult.action === Action.Reject && checkUploadResult.assetId) {
          responseData = { duplicate: true, id: checkUploadResult.assetId };
        }
      } catch (error) {
        console.error(`Error calculating sha1 file=${asset.name})`, error);
      }
    }

    if (!responseData) {
      uploadAssetsStore.updateAsset(deviceAssetId, { message: 'Uploading...' });
      const response = await uploadRequest<AssetFileUploadResponseDto>({
        url: getBaseUrl() + '/asset/upload' + (key ? `?key=${key}` : ''),
        data: formData,
        onUploadProgress: (event) => uploadAssetsStore.updateProgress(deviceAssetId, event.loaded, event.total),
      });
      if (![200, 201].includes(response.status)) {
        throw new Error('Failed to upload file');
      }
      responseData = response.data;
    }
    const { duplicate, id: assetId } = responseData;

    if (duplicate) {
      uploadAssetsStore.duplicateCounter.update((count) => count + 1);
    } else {
      uploadAssetsStore.successCounter.update((c) => c + 1);
    }

    if (albumId && assetId) {
      uploadAssetsStore.updateAsset(deviceAssetId, { message: 'Adding to album...' });
      await addAssetsToAlbum(albumId, [assetId]);
      uploadAssetsStore.updateAsset(deviceAssetId, { message: 'Added to album' });
    }

    uploadAssetsStore.updateAsset(deviceAssetId, { state: duplicate ? UploadState.DUPLICATED : UploadState.DONE });

    setTimeout(() => {
      uploadAssetsStore.removeUploadAsset(deviceAssetId);
    }, 1000);

    return assetId;
  } catch (error) {
    handleError(error, 'Unable to upload file');
    const reason = getServerErrorMessage(error) || error;
    uploadAssetsStore.updateAsset(deviceAssetId, { state: UploadState.ERROR, error: reason });
    return;
  }
}
