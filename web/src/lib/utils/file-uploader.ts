import { uploadAssetsStore } from '$lib/stores/upload';
import { addAssetsToAlbum } from '$lib/utils/asset-utils';
import { api, type AssetFileUploadResponseDto } from '@api';
import { UploadState } from '$lib/models/upload-asset';
import { ExecutorQueue } from '$lib/utils/executor-queue';
import { getServerErrorMessage, handleError } from './handle-error';

let _extensions: string[];

export const uploadExecutionQueue = new ExecutorQueue({ concurrency: 2 });

const getExtensions = async () => {
  if (!_extensions) {
    const { data } = await api.serverInfoApi.getSupportedMediaTypes();
    _extensions = [...data.image, ...data.video];
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
      fileSelector.addEventListener('change', async (e: Event) => {
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

  return new Promise((resolve) => resolve(uploadAssetsStore.markStarted(deviceAssetId)))
    .then(() =>
      api.assetApi.uploadFile(
        {
          deviceAssetId,
          deviceId: 'WEB',
          fileCreatedAt,
          fileModifiedAt: new Date(asset.lastModified).toISOString(),
          isFavorite: false,
          duration: '0:00:00.000000',
          assetData: new File([asset], asset.name),
          key: api.getKey(),
        },
        {
          onUploadProgress: ({ event }) => {
            const { loaded, total } = event;
            uploadAssetsStore.updateProgress(deviceAssetId, loaded, total);
          },
        },
      ),
    )
    .then(async (response) => {
      if (response.status == 200 || response.status == 201) {
        const res: AssetFileUploadResponseDto = response.data;

        if (res.duplicate) {
          uploadAssetsStore.duplicateCounter.update((count) => count + 1);
        }

        if (albumId && res.id) {
          uploadAssetsStore.updateAsset(deviceAssetId, { message: 'Adding to album...' });
          await addAssetsToAlbum(albumId, [res.id]);
          uploadAssetsStore.updateAsset(deviceAssetId, { message: 'Added to album' });
        }

        uploadAssetsStore.updateAsset(deviceAssetId, {
          state: res.duplicate ? UploadState.DUPLICATED : UploadState.DONE,
        });
        uploadAssetsStore.successCounter.update((c) => c + 1);

        setTimeout(() => {
          uploadAssetsStore.removeUploadAsset(deviceAssetId);
        }, 1000);

        return res.id;
      }
    })
    .catch(async (error) => {
      await handleError(error, 'Unable to upload file');
      const reason = (await getServerErrorMessage(error)) || error;
      uploadAssetsStore.updateAsset(deviceAssetId, { state: UploadState.ERROR, error: reason });
      return undefined;
    });
}
