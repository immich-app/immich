import { UploadState } from '$lib/models/upload-asset';
import { uploadAssetsStore } from '$lib/stores/upload';
import { getKey, uploadRequest } from '$lib/utils';
import { addAssetsToAlbum } from '$lib/utils/asset-utils';
import { ExecutorQueue } from '$lib/utils/executor-queue';
import { Action, checkBulkUpload, defaults, getSupportedMediaTypes, type AssetFileUploadResponseDto } from '@immich/sdk';
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

  {
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

      const key = getKey();

      const res: AssetFileUploadResponseDto = await (async () => {

        const checksum = await getSha1Checksum(asset);
        if (checksum) {
          // TODO: 2 roundtrips to the servers have performance and functionality problems
          // We can have a single endpoint that does both checks and uploads using headers
          // for example, `x-immich-checksum`. Server can then process headers first,
          // and determine whether to consume body stream, or not at all, and return 201.
          // With that approach, we can saves bandwidth for duplicated assets even from different users/owners.
          // That is, on server, we can check the whole DB for the checksum. If checksum is found
          // but the assets belong to another user, we can do hardlink or copy --reflink=always
          // and create record, instead of uploading the whole file again.
          // It would save both bandwidth and storage.
          const { results: [checkUploadResult] } = await checkBulkUpload({ assetBulkUploadCheckDto: { assets: [{ id: asset.name, checksum }] } });
          if (checkUploadResult.action === Action.Reject && checkUploadResult.assetId) {
            // Always because of duplicate
            return {
              duplicate: true,
              id: checkUploadResult.assetId,
            }
          }
        }
        const response = await uploadRequest<AssetFileUploadResponseDto>({
          url: defaults.baseUrl + '/asset/upload' + (key ? `?key=${key}` : ''),
          data: formData,
          onUploadProgress: (event) => uploadAssetsStore.updateProgress(deviceAssetId, event.loaded, event.total),
        });
        if (![200, 201].includes(response.status)) {
          throw new Error('Failed to upload file');
        }
        return response.data;
      })();

      {

        if (res.duplicate) {
          uploadAssetsStore.duplicateCounter.update((count) => count + 1);
        } else {
          uploadAssetsStore.successCounter.update((c) => c + 1);
        }

        if (albumId && res.id) {
          uploadAssetsStore.updateAsset(deviceAssetId, { message: 'Adding to album...' });
          await addAssetsToAlbum(albumId, [res.id]);
          uploadAssetsStore.updateAsset(deviceAssetId, { message: 'Added to album' });
        }

        uploadAssetsStore.updateAsset(deviceAssetId, {
          state: res.duplicate ? UploadState.DUPLICATED : UploadState.DONE,
        });

        setTimeout(() => {
          uploadAssetsStore.removeUploadAsset(deviceAssetId);
        }, 1000);

        return res.id;
      }
    } catch (error) {
      handleError(error, 'Unable to upload file');
      const reason = getServerErrorMessage(error) || error;
      uploadAssetsStore.updateAsset(deviceAssetId, { state: UploadState.ERROR, error: reason });
      return undefined;
    }
  }
}

// TODO: should probably move this to @immach/sdk as well
async function getSha1Checksum(file: File): Promise<string | null> {
  return new Promise((resolve, reject) => {
    // Step 0: Check if the Crypto API is supported
    if (!crypto || !crypto.subtle || !crypto.subtle.digest) {
      // how do we use logger here?
      console.warn("crypto.subtle.digest API is not available. Client side duplicate checks cannot be used. Ensure you're using a secure context (HTTPS) or a supported browser.");
      resolve(null);
      return;
    }
    // Step 1: Read the file as an ArrayBuffer
    const reader = new FileReader();
    reader.onload = function (event) {
      const arrayBuffer = event.target?.result;
      if (!(arrayBuffer instanceof ArrayBuffer)) {
        reject('Failed to read file');
        return;
      }
      // Step 2: Compute the SHA-1 hash
      crypto.subtle.digest('SHA-1', arrayBuffer)
        .then(hashBuffer => {
          // Step 3: Convert ArrayBuffer to Hex String
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
          // Step 4: Resolve the promise with the SHA-1 checksum
          resolve(hashHex);
        })
        .catch(err => reject(err));
    };
    reader.onerror = function (err) {
      reader.abort();
      console.warn("crypto.subtle.digest API read error. Skipping client side duplicate checks.");
      resolve(null);
    };
    reader.readAsArrayBuffer(file);
  });
}
