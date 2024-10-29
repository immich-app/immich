import { UploadState } from '$lib/models/upload-asset';
import { uploadAssetsStore } from '$lib/stores/upload';
import { getKey, uploadRequest } from '$lib/utils';
import { addAssetsToAlbum } from '$lib/utils/asset-utils';
import { ExecutorQueue } from '$lib/utils/executor-queue';
import {
  Action,
  AssetMediaStatus,
  checkBulkUpload,
  getAssetOriginalPath,
  getBaseUrl,
  getSupportedMediaTypes,
  type AssetMediaResponseDto,
} from '@immich/sdk';
import { tick } from 'svelte';
import { t } from 'svelte-i18n';
import { get } from 'svelte/store';
import { handleError } from './handle-error';

export const addDummyItems = () => {
  uploadAssetsStore.addItem({ id: 'asset-0', file: { name: 'asset0.jpg', size: 123_456 } as File });
  uploadAssetsStore.updateItem('asset-0', { state: UploadState.PENDING });
  uploadAssetsStore.addItem({ id: 'asset-1', file: { name: 'asset1.jpg', size: 123_456 } as File });
  uploadAssetsStore.updateItem('asset-1', { state: UploadState.STARTED });
  uploadAssetsStore.updateProgress('asset-1', 75, 100);
  uploadAssetsStore.addItem({ id: 'asset-2', file: { name: 'asset2.jpg', size: 123_456 } as File });
  uploadAssetsStore.updateItem('asset-2', { state: UploadState.ERROR, error: new Error('Internal server error') });
  uploadAssetsStore.addItem({ id: 'asset-3', file: { name: 'asset3.jpg', size: 123_456 } as File });
  uploadAssetsStore.updateItem('asset-3', { state: UploadState.DUPLICATED, assetId: 'asset-2' });
  uploadAssetsStore.addItem({ id: 'asset-4', file: { name: 'asset3.jpg', size: 123_456 } as File });
  uploadAssetsStore.updateItem('asset-4', { state: UploadState.DUPLICATED, assetId: 'asset-2', isTrashed: true });
  uploadAssetsStore.addItem({ id: 'asset-10', file: { name: 'asset3.jpg', size: 123_456 } as File });
  uploadAssetsStore.updateItem('asset-10', { state: UploadState.DONE });
  uploadAssetsStore.track('error');
  uploadAssetsStore.track('success');
  uploadAssetsStore.track('duplicate');
};

// addDummyItems();

let _extensions: string[];

export const uploadExecutionQueue = new ExecutorQueue({ concurrency: 2 });

const getExtensions = async () => {
  if (!_extensions) {
    const { image, video } = await getSupportedMediaTypes();
    _extensions = [...image, ...video];
  }
  return _extensions;
};

type FileUploadParam = { multiple?: boolean } & (
  | { albumId?: string; assetId?: never }
  | { albumId?: never; assetId?: string }
);
export const openFileUploadDialog = async (options: FileUploadParam = {}) => {
  const { albumId, multiple = true, assetId } = options;
  const extensions = await getExtensions();

  return new Promise<(string | undefined)[]>((resolve, reject) => {
    try {
      const fileSelector = document.createElement('input');

      fileSelector.type = 'file';
      fileSelector.multiple = multiple;
      fileSelector.accept = extensions.join(',');
      fileSelector.addEventListener('change', (e: Event) => {
        const target = e.target as HTMLInputElement;
        if (!target.files) {
          return;
        }
        const files = Array.from(target.files);

        resolve(fileUploadHandler(files, albumId, assetId));
      });

      fileSelector.click();
    } catch (error) {
      console.log('Error selecting file', error);
      reject(error);
    }
  });
};

export const fileUploadHandler = async (files: File[], albumId?: string, assetId?: string): Promise<string[]> => {
  const extensions = await getExtensions();
  const promises = [];
  for (const file of files) {
    const name = file.name.toLowerCase();
    if (extensions.some((extension) => name.endsWith(extension))) {
      uploadAssetsStore.addItem({ id: getDeviceAssetId(file), file, albumId });
      promises.push(uploadExecutionQueue.addTask(() => fileUploader(file, albumId, assetId)));
    }
  }

  const results = await Promise.all(promises);
  return results.filter((result): result is string => !!result);
};

function getDeviceAssetId(asset: File) {
  return 'web' + '-' + asset.name + '-' + asset.lastModified;
}

// TODO: should probably use the @api SDK
async function fileUploader(assetFile: File, albumId?: string, replaceAssetId?: string): Promise<string | undefined> {
  const fileCreatedAt = new Date(assetFile.lastModified).toISOString();
  const deviceAssetId = getDeviceAssetId(assetFile);
  const $t = get(t);

  uploadAssetsStore.markStarted(deviceAssetId);

  try {
    const formData = new FormData();
    for (const [key, value] of Object.entries({
      deviceAssetId,
      deviceId: 'WEB',
      fileCreatedAt,
      fileModifiedAt: new Date(assetFile.lastModified).toISOString(),
      isFavorite: 'false',
      duration: '0:00:00.000000',
      assetData: new File([assetFile], assetFile.name),
    })) {
      formData.append(key, value);
    }

    let responseData: { id: string; status: AssetMediaStatus; isTrashed?: boolean } | undefined;
    const key = getKey();
    if (crypto?.subtle?.digest && !key) {
      uploadAssetsStore.updateItem(deviceAssetId, { message: $t('asset_hashing') });
      await tick();
      try {
        const bytes = await assetFile.arrayBuffer();
        const hash = await crypto.subtle.digest('SHA-1', bytes);
        const checksum = Array.from(new Uint8Array(hash))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');

        const {
          results: [checkUploadResult],
        } = await checkBulkUpload({ assetBulkUploadCheckDto: { assets: [{ id: assetFile.name, checksum }] } });
        if (checkUploadResult.action === Action.Reject && checkUploadResult.assetId) {
          responseData = {
            status: AssetMediaStatus.Duplicate,
            id: checkUploadResult.assetId,
            isTrashed: checkUploadResult.isTrashed,
          };
        }
      } catch (error) {
        console.error(`Error calculating sha1 file=${assetFile.name})`, error);
      }
    }

    if (!responseData) {
      uploadAssetsStore.updateItem(deviceAssetId, { message: $t('asset_uploading') });
      if (replaceAssetId) {
        const response = await uploadRequest<AssetMediaResponseDto>({
          url: getBaseUrl() + getAssetOriginalPath(replaceAssetId) + (key ? `?key=${key}` : ''),
          method: 'PUT',
          data: formData,
          onUploadProgress: (event) => uploadAssetsStore.updateProgress(deviceAssetId, event.loaded, event.total),
        });
        responseData = response.data;
      } else {
        const response = await uploadRequest<AssetMediaResponseDto>({
          url: getBaseUrl() + '/assets' + (key ? `?key=${key}` : ''),
          data: formData,
          onUploadProgress: (event) => uploadAssetsStore.updateProgress(deviceAssetId, event.loaded, event.total),
        });

        if (![200, 201].includes(response.status)) {
          throw new Error($t('errors.unable_to_upload_file'));
        }

        responseData = response.data;
      }
    }

    if (responseData.status === AssetMediaStatus.Duplicate) {
      uploadAssetsStore.track('duplicate');
    } else {
      uploadAssetsStore.track('success');
    }

    if (albumId) {
      uploadAssetsStore.updateItem(deviceAssetId, { message: $t('asset_adding_to_album') });
      await addAssetsToAlbum(albumId, [responseData.id], false);
      uploadAssetsStore.updateItem(deviceAssetId, { message: $t('asset_added_to_album') });
    }

    uploadAssetsStore.updateItem(deviceAssetId, {
      state: responseData.status === AssetMediaStatus.Duplicate ? UploadState.DUPLICATED : UploadState.DONE,
      assetId: responseData.id,
      isTrashed: responseData.isTrashed,
    });

    if (responseData.status !== AssetMediaStatus.Duplicate) {
      setTimeout(() => {
        uploadAssetsStore.removeItem(deviceAssetId);
      }, 1000);
    }

    return responseData.id;
  } catch (error) {
    const errorMessage = handleError(error, $t('errors.unable_to_upload_file'));
    uploadAssetsStore.track('error');
    uploadAssetsStore.updateItem(deviceAssetId, { state: UploadState.ERROR, error: errorMessage });
    return;
  }
}
