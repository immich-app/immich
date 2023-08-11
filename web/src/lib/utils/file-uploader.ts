import { uploadAssetsStore } from '$lib/stores/upload';
import { addAssetsToAlbum } from '$lib/utils/asset-utils';
import type { AssetFileUploadResponseDto } from '@api';
import axios from 'axios';
import { notificationController, NotificationType } from './../components/shared-components/notification/notification';

const extensions = [
  '.3fr',
  '.3gp',
  '.ari',
  '.arw',
  '.avi',
  '.avif',
  '.cap',
  '.cin',
  '.cr2',
  '.cr3',
  '.crw',
  '.dcr',
  '.dng',
  '.erf',
  '.fff',
  '.flv',
  '.gif',
  '.heic',
  '.heif',
  '.iiq',
  '.jpeg',
  '.jpg',
  '.k25',
  '.kdc',
  '.mkv',
  '.mov',
  '.mp2t',
  '.mp4',
  '.mpeg',
  '.mrw',
  '.nef',
  '.orf',
  '.ori',
  '.pef',
  '.png',
  '.raf',
  '.raw',
  '.rwl',
  '.sr2',
  '.srf',
  '.srw',
  '.tiff',
  '.webm',
  '.webp',
  '.wmv',
  '.x3f',
];

export const openFileUploadDialog = async (
  albumId: string | undefined = undefined,
  sharedKey: string | undefined = undefined,
) => {
  return new Promise<(string | undefined)[]>((resolve, reject) => {
    try {
      const fileSelector = document.createElement('input');

      fileSelector.type = 'file';
      fileSelector.multiple = true;
      fileSelector.accept = extensions.join(',');
      fileSelector.onchange = async (e: Event) => {
        const target = e.target as HTMLInputElement;
        if (!target.files) {
          return;
        }
        const files = Array.from(target.files);

        resolve(fileUploadHandler(files, albumId, sharedKey));
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
  sharedKey: string | undefined = undefined,
) => {
  const iterable = {
    files: files.filter((file) => extensions.some((ext) => file.name.toLowerCase().endsWith(ext)))[Symbol.iterator](),

    async *[Symbol.asyncIterator]() {
      for (const file of this.files) {
        yield fileUploader(file, albumId, sharedKey);
      }
    },
  };

  const concurrency = 2;
  // TODO: use Array.fromAsync instead when it's available universally.
  return Promise.all([...Array(concurrency)].map(() => fromAsync(iterable))).then((res) => res.flat());
};

// polyfill for Array.fromAsync.
//
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/fromAsync
const fromAsync = async function <T>(iterable: AsyncIterable<T>) {
  const result = [];
  for await (const value of iterable) {
    result.push(value);
  }
  return result;
};

// TODO: should probably use the @api SDK
async function fileUploader(
  asset: File,
  albumId: string | undefined = undefined,
  sharedKey: string | undefined = undefined,
): Promise<string | undefined> {
  const formData = new FormData();
  const fileCreatedAt = new Date(asset.lastModified).toISOString();
  const deviceAssetId = 'web' + '-' + asset.name + '-' + asset.lastModified;

  try {
    formData.append('deviceAssetId', deviceAssetId);
    formData.append('deviceId', 'WEB');
    formData.append('fileCreatedAt', fileCreatedAt);
    formData.append('fileModifiedAt', new Date(asset.lastModified).toISOString());
    formData.append('isFavorite', 'false');
    formData.append('duration', '0:00:00.000000');
    formData.append('assetData', new File([asset], asset.name));

    uploadAssetsStore.addNewUploadAsset({
      id: deviceAssetId,
      file: asset,
      progress: 0,
    });

    const response = await axios.post('/api/asset/upload', formData, {
      params: {
        key: sharedKey,
      },
      onUploadProgress: (event) => {
        const percentComplete = Math.floor((event.loaded / event.total) * 100);
        uploadAssetsStore.updateProgress(deviceAssetId, percentComplete);
      },
    });

    if (response.status == 200 || response.status == 201) {
      const res: AssetFileUploadResponseDto = response.data;

      if (res.duplicate) {
        uploadAssetsStore.duplicateCounter.update((count) => count + 1);
      }

      if (albumId && res.id) {
        await addAssetsToAlbum(albumId, [res.id], sharedKey);
      }

      setTimeout(() => {
        uploadAssetsStore.removeUploadAsset(deviceAssetId);
      }, 1000);

      return res.id;
    }
  } catch (e) {
    console.log('error uploading file ', e);
    handleUploadError(asset, JSON.stringify(e));
    uploadAssetsStore.removeUploadAsset(deviceAssetId);
  }
}

function handleUploadError(asset: File, respBody = '{}', extraMessage?: string) {
  uploadAssetsStore.errorCounter.update((count) => count + 1);

  try {
    const res = JSON.parse(respBody);

    const extraMsg = res ? ' ' + res?.message : '';

    notificationController.show({
      type: NotificationType.Error,
      message: `Cannot upload file ${asset.name} ${extraMsg}${extraMessage}`,
      timeout: 5000,
    });
  } catch (e) {
    console.error('ERROR parsing data JSON in handleUploadError');
  }
}
