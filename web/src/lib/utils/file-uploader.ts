import {
  AssetMediaStatus,
  AssetUploadAction,
  AssetVisibility,
  checkBulkUpload,
  createAlbum,
  getAllAlbums,
  getBaseUrl,
  type AlbumResponseDto,
  type AssetMediaResponseDto,
} from '@immich/sdk';
import { toastManager } from '@immich/ui';
import { tick } from 'svelte';
import { t } from 'svelte-i18n';
import { get } from 'svelte/store';
import { authManager } from '$lib/managers/auth-manager.svelte';
import { eventManager } from '$lib/managers/event-manager.svelte';
import { uploadManager } from '$lib/managers/upload-manager.svelte';
import { addAssetsToAlbums } from '$lib/services/album.service';
import { uploadAssetsStore } from '$lib/stores/upload';
import { UploadState } from '$lib/types';
import { uploadRequest } from '$lib/utils';
import { ExecutorQueue } from '$lib/utils/executor-queue';
import { asQueryString } from '$lib/utils/shared-links';
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

export const uploadExecutionQueue = new ExecutorQueue({ concurrency: 2 });

type FilePickerParam = { multiple?: boolean; extensions?: string[]; rootFolderName?: string };
type DirectoryPickerParam = FilePickerParam & { recursive?: boolean };
type FileUploadParam = { multiple?: boolean; albumId?: string; albumNameFromFolder?: boolean };
type UploadableFile = File & { webkitRelativePath?: string };

const rootFolderNames = new WeakMap<File, string>();

export const openFilePicker = async (options: FilePickerParam = {}) => {
  const { multiple = true, extensions, rootFolderName = get(t)('upload_files_root_folder') } = options;

  const files = await new Promise<File[]>((resolve, reject) => {
    try {
      const fileSelector = document.createElement('input');

      fileSelector.type = 'file';
      fileSelector.multiple = multiple;

      if (extensions) {
        fileSelector.accept = extensions.join(',');
      }

      fileSelector.addEventListener(
        'change',
        (e: Event) => {
          const target = e.target as HTMLInputElement;
          if (!target.files) {
            return;
          }

          const files = Array.from(target.files);
          resolve(files);
        },
        { passive: true },
      );

      fileSelector.click();
    } catch (error) {
      console.log('Error selecting file', error);
      reject(error);
    }
  });

  return withRootFolderName(files, rootFolderName);
};

export const openDirectoryPicker = async (options: DirectoryPickerParam = {}) => {
  const { recursive = true, ...filePickerOptions } = options;

  const files = await new Promise<File[]>((resolve, reject) => {
    try {
      const fileSelector = document.createElement('input') as HTMLInputElement & {
        webkitdirectory?: boolean;
        directory?: boolean;
      };

      fileSelector.type = 'file';
      fileSelector.multiple = true;
      fileSelector.webkitdirectory = true;
      fileSelector.directory = true;

      if (filePickerOptions.extensions) {
        fileSelector.accept = filePickerOptions.extensions.join(',');
      }

      fileSelector.addEventListener(
        'change',
        (e: Event) => {
          const target = e.target as HTMLInputElement;
          resolve(target.files ? Array.from(target.files) : []);
        },
        { passive: true },
      );

      fileSelector.click();
    } catch (error) {
      console.log('Error selecting folder', error);
      reject(error);
    }
  });

  const filteredFiles = recursive
    ? files
    : files.filter((file) => {
        const relativePath = (file as UploadableFile).webkitRelativePath;
        return !relativePath || relativePath.split('/').filter(Boolean).length <= 2;
      });

  return withDirectoryRootFolderNames(filteredFiles);
};

export const openFileUploadDialog = async (options: FileUploadParam = {}) => {
  const { albumId, albumNameFromFolder, multiple = true } = options;
  const extensions = uploadManager.getExtensions();
  const files = await openFilePicker({
    multiple,
    extensions,
  });

  return fileUploadHandler({ files, albumId, albumNameFromFolder });
};

export const openDirectoryUploadDialog = async ({
  albumId,
  albumNameFromFolder,
  recursive = true,
}: FileUploadParam & { recursive?: boolean } = {}) => {
  const extensions = uploadManager.getExtensions();
  const files = await openDirectoryPicker({ extensions, recursive });

  return fileUploadHandler({ files, albumId, albumNameFromFolder });
};

type FileUploadHandlerParams = Omit<FileUploaderParams, 'deviceAssetId' | 'assetFile'> & {
  files: File[];
  albumNameFromFolder?: boolean;
};

export const fileUploadHandler = async ({
  files,
  albumId,
  albumNameFromFolder = false,
  isLockedAssets = false,
}: FileUploadHandlerParams): Promise<string[]> => {
  const extensions = uploadManager.getExtensions();
  const validFiles = files.filter((file) => {
    const name = file.name.toLowerCase();
    if (extensions.some((extension) => name.endsWith(extension))) {
      return true;
    }

    toastManager.warning(get(t)('unsupported_file_type', { values: { file: file.name, type: file.type } }), {
      timeout: 10_000,
    });
    return false;
  });

  const albumIdsByFile = albumNameFromFolder ? await getAlbumIdsByFolder(validFiles) : new Map<File, string>();
  const promises = [];
  for (const file of validFiles) {
    const fileAlbumId = albumIdsByFile.get(file) ?? albumId;
    const deviceAssetId = getDeviceAssetId(file);
    uploadAssetsStore.addItem({ id: deviceAssetId, file, albumId: fileAlbumId });
    promises.push(
      uploadExecutionQueue.addTask(() =>
        fileUploader({ assetFile: file, deviceAssetId, albumId: fileAlbumId, isLockedAssets }),
      ),
    );
  }

  const results = await Promise.all(promises);
  return results.filter((result): result is string => !!result);
};

const withRootFolderName = (files: File[], rootFolderName: string) => {
  for (const file of files) {
    rootFolderNames.set(file, rootFolderName);
  }

  return files;
};

const withDirectoryRootFolderNames = (files: File[]) => {
  for (const file of files) {
    const rootFolderName = getDirectoryRootFolderName(file);
    if (rootFolderName) {
      rootFolderNames.set(file, rootFolderName);
    }
  }

  return files;
};

const getDirectoryRootFolderName = (file: File) => {
  const relativePath = (file as UploadableFile).webkitRelativePath;
  if (!relativePath) {
    return;
  }

  const parts = relativePath.split('/').filter(Boolean);
  if (parts.length < 2) {
    return;
  }

  return parts[0];
};

const getFolderAlbumName = (file: File) => {
  return rootFolderNames.get(file) ?? getDirectoryRootFolderName(file);
};

const getAlbumIdsByFolder = async (files: File[]) => {
  const albumNames = new Set<string>();
  for (const file of files) {
    const albumName = getFolderAlbumName(file);
    if (albumName) {
      albumNames.add(albumName);
    }
  }

  if (albumNames.size === 0) {
    return new Map<File, string>();
  }

  const albums = await Promise.all([getAllAlbums({ isOwned: true }), getAllAlbums({ isShared: true })]);
  const existingAlbums = new Map<string, AlbumResponseDto>(albums.flat().map((album) => [album.albumName, album]));

  for (const albumName of albumNames) {
    if (existingAlbums.has(albumName)) {
      continue;
    }

    const album = await createAlbum({ createAlbumDto: { albumName } });
    existingAlbums.set(album.albumName, album);
    eventManager.emit('AlbumCreate', album);
  }

  const albumIdsByFile = new Map<File, string>();
  for (const file of files) {
    const albumName = getFolderAlbumName(file);
    const album = albumName ? existingAlbums.get(albumName) : undefined;
    if (album) {
      albumIdsByFile.set(file, album.id);
    }
  }

  return albumIdsByFile;
};

function getDeviceAssetId(asset: File) {
  return 'web' + '-' + asset.name + '-' + asset.lastModified;
}

function hashFile(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const worker = new Worker(new URL('$lib/workers/hash-file.ts', import.meta.url), { type: 'module' });

    worker.addEventListener('message', ({ data }: MessageEvent<{ result?: string; error?: string }>) => {
      worker.terminate();

      if (data.error) {
        reject(new Error(data.error));
      } else {
        resolve(data.result!);
      }
    });

    worker.addEventListener('error', (event) => {
      worker.terminate();

      reject(new Error(event.message));
    });

    worker.postMessage(file);
  });
}

type FileUploaderParams = {
  assetFile: File;
  albumId?: string;
  replaceAssetId?: string;
  isLockedAssets?: boolean;
  // TODO rework the asset uploader and remove this
  deviceAssetId: string;
};

// TODO: should probably use the @api SDK
async function fileUploader({
  assetFile,
  deviceAssetId,
  albumId,
  isLockedAssets = false,
}: FileUploaderParams): Promise<string | undefined> {
  const fileCreatedAt = new Date(assetFile.lastModified).toISOString();
  const $t = get(t);
  const wasInitiallyLoggedIn = !!authManager.authenticated;

  uploadAssetsStore.markStarted(deviceAssetId);

  try {
    const formData = new FormData();
    for (const [key, value] of Object.entries({
      fileCreatedAt,
      fileModifiedAt: new Date(assetFile.lastModified).toISOString(),
      isFavorite: 'false',
      assetData: new File([assetFile], assetFile.name),
    })) {
      formData.append(key, value);
    }

    if (isLockedAssets) {
      formData.append('visibility', AssetVisibility.Locked);
    }

    let responseData: { id: string; status: AssetMediaStatus; isTrashed?: boolean } | undefined;
    if (!authManager.isSharedLink) {
      uploadAssetsStore.updateItem(deviceAssetId, { message: $t('asset_hashing') });
      await tick();
      try {
        const checksum = await hashFile(assetFile);

        const {
          results: [checkUploadResult],
        } = await checkBulkUpload({ assetBulkUploadCheckDto: { assets: [{ id: assetFile.name, checksum }] } });
        if (checkUploadResult.action === AssetUploadAction.Reject && checkUploadResult.assetId) {
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
      const queryParams = asQueryString(authManager.params);

      uploadAssetsStore.updateItem(deviceAssetId, { message: $t('asset_uploading') });
      const response = await uploadRequest<AssetMediaResponseDto>({
        url: getBaseUrl() + '/assets' + (queryParams ? `?${queryParams}` : ''),
        data: formData,
        onUploadProgress: (event) => uploadAssetsStore.updateProgress(deviceAssetId, event.loaded, event.total),
      });

      if (![200, 201].includes(response.status)) {
        throw new Error($t('errors.unable_to_upload_file'));
      }

      responseData = response.data;
    }

    if (responseData.status === AssetMediaStatus.Duplicate) {
      uploadAssetsStore.track('duplicate');
    } else {
      uploadAssetsStore.track('success');
    }

    if (albumId && !authManager.isSharedLink) {
      uploadAssetsStore.updateItem(deviceAssetId, { message: $t('asset_adding_to_album') });
      await addAssetsToAlbums([albumId], [responseData.id], { notify: false });
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
    // If the user store no longer holds a user, it means they have logged out
    // In this case don't bother reporting any errors.
    if (wasInitiallyLoggedIn && !authManager.authenticated) {
      return;
    }

    const errorMessage = handleError(error, $t('errors.unable_to_upload_file'));
    uploadAssetsStore.track('error');
    uploadAssetsStore.updateItem(deviceAssetId, { state: UploadState.ERROR, error: errorMessage });
    return;
  }
}
