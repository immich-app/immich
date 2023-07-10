import { uploadAssetsStore } from '$lib/stores/upload';
import { addAssetsToAlbum, getFilenameExtension } from '$lib/utils/asset-utils';
import type { AssetFileUploadResponseDto } from '@api';
import axios from 'axios';
import { combineLatestAll, filter, firstValueFrom, from, mergeMap, of } from 'rxjs';
import type { UploadAsset } from '../models/upload-asset';
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
  sharedKey: string | undefined = undefined,
) => {
  return firstValueFrom(
    from(files).pipe(
      filter((file) => extensions.includes('.' + getFilenameExtension(file.name))),
      mergeMap(async (file) => of(await fileUploader(file, albumId, sharedKey)), 2),
      combineLatestAll(),
    ),
  );
};

//TODO: should probably use the @api SDK
async function fileUploader(
  asset: File,
  albumId: string | undefined = undefined,
  sharedKey: string | undefined = undefined,
): Promise<string | undefined> {
  const formData = new FormData();
  const fileCreatedAt = new Date(asset.lastModified).toISOString();
  const deviceAssetId = 'web' + '-' + asset.name + '-' + asset.lastModified;

  try {
    // Create and add pseudo-unique ID of asset on the device
    formData.append('deviceAssetId', deviceAssetId);

    // Get device id - for web -> use WEB
    formData.append('deviceId', 'WEB');

    // Get Asset Created Date
    formData.append('fileCreatedAt', fileCreatedAt);

    // Get Asset Modified At
    formData.append('fileModifiedAt', new Date(asset.lastModified).toISOString());

    // Set Asset is Favorite to false
    formData.append('isFavorite', 'false');

    // Get asset duration
    formData.append('duration', '0:00:00.000000');

    // Get asset binary data with a custom MIME type, because browsers will
    // use application/octet-stream for unsupported MIME types, leading to
    // failed uploads.
    formData.append('assetData', new File([asset], asset.name));

    const newUploadAsset: UploadAsset = {
      id: deviceAssetId,
      file: asset,
      progress: 0,
    };

    uploadAssetsStore.addNewUploadAsset(newUploadAsset);

    const response = await axios.post(`/api/asset/upload`, formData, {
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
