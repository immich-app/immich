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
  type AssetMediaCreatedResponse,
  type AssetMediaUpdatedResponse,
  type AssetResponseDto,
  type DuplicateAssetResponse,
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
// the following set of interfaces ensure that either albumId OR assetId
// may be specified, but not both.
interface FileUploadParams {
  multiple?: boolean;
}
interface FileUploadWithAlbum extends FileUploadParams {
  albumId?: string;
  assetId?: never;
}
interface FileUploadWithAsset extends FileUploadParams {
  albumId?: never;
  assetId?: string;
}
type FileUploadParam = FileUploadWithAlbum | FileUploadWithAsset;
const defaultParams: FileUploadWithAlbum = {
  multiple: true,
};

export const openFileUploadDialog = async ({ albumId, multiple, assetId }: FileUploadParam = defaultParams) => {
  const extensions = await getExtensions();

  return new Promise<(string | undefined)[]>((resolve, reject) => {
    try {
      const fileSelector = document.createElement('input');
      fileSelector.type = 'file';
      fileSelector.multiple = !!multiple;
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
      uploadAssetsStore.addNewUploadAsset({ id: getDeviceAssetId(file), file, albumId, assetId });
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
async function fileUploader(assetFile: File, albumId?: string, assetId?: string): Promise<string | undefined> {
  const fileCreatedAt = new Date(assetFile.lastModified).toISOString();
  const deviceAssetId = getDeviceAssetId(assetFile);

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

    let responseData: AssetMediaCreatedResponse | AssetMediaUpdatedResponse | DuplicateAssetResponse | undefined;
    const key = getKey();
    if (crypto?.subtle?.digest && !key) {
      uploadAssetsStore.updateAsset(deviceAssetId, { message: 'Hashing...' });
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
          responseData = { status: 'duplicate', duplicate: { id: checkUploadResult.assetId } as AssetResponseDto };
        }
      } catch (error) {
        console.error(`Error calculating sha1 file=${assetFile.name})`, error);
      }
    }

    if (!responseData) {
      uploadAssetsStore.updateAsset(deviceAssetId, { message: 'Uploading...' });
      if (assetId) {
        const response = await uploadRequest<AssetMediaUpdatedResponse>({
          url: getBaseUrl() + '/asset/' + assetId + '/file' + (key ? `?key=${key}` : ''),
          method: 'PUT',
          data: formData,
          onUploadProgress: (event) => uploadAssetsStore.updateProgress(deviceAssetId, event.loaded, event.total),
        });
        responseData = response.data;
      } else {
        const response = await uploadRequest<AssetMediaCreatedResponse>({
          url: getBaseUrl() + '/asset' + (key ? `?key=${key}` : ''),
          data: formData,
          onUploadProgress: (event) => uploadAssetsStore.updateProgress(deviceAssetId, event.loaded, event.total),
        });
        if (![200, 201].includes(response.status)) {
          throw new Error('Failed to upload file');
        }
        responseData = response.data;
      }
    }

    const { status } = responseData;

    if (status === 'duplicate') {
      uploadAssetsStore.duplicateCounter.update((count) => count + 1);
    } else {
      uploadAssetsStore.successCounter.update((c) => c + 1);
      const { asset } = responseData as AssetMediaCreatedResponse | AssetMediaUpdatedResponse;
      if (albumId && asset.id) {
        uploadAssetsStore.updateAsset(deviceAssetId, { message: 'Adding to album...' });
        await addAssetsToAlbum(albumId, [asset.id]);
        uploadAssetsStore.updateAsset(deviceAssetId, { message: 'Added to album' });
      }
    }

    uploadAssetsStore.updateAsset(deviceAssetId, {
      state: status === 'duplicate' ? UploadState.DUPLICATED : UploadState.DONE,
    });

    setTimeout(() => {
      uploadAssetsStore.removeUploadAsset(deviceAssetId);
    }, 1000);

    if ('asset' in responseData && responseData.asset.id) {
      return responseData.asset.id;
    }
  } catch (error) {
    handleError(error, 'Unable to upload file');
    const reason = getServerErrorMessage(error) || error;
    uploadAssetsStore.updateAsset(deviceAssetId, { state: UploadState.ERROR, error: reason });
    return;
  }
}
