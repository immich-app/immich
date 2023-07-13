import { notificationController, NotificationType } from '$lib/components/shared-components/notification/notification';
import { clearDownload, updateDownload } from '$lib/stores/download';
import { AddAssetsResponseDto, api, AssetApiGetDownloadInfoRequest, AssetResponseDto, DownloadResponseDto } from '@api';
import { handleError } from './handle-error';

export const addAssetsToAlbum = async (
  albumId: string,
  assetIds: Array<string>,
  key: string | undefined = undefined,
): Promise<AddAssetsResponseDto> =>
  api.albumApi.addAssetsToAlbum({ id: albumId, addAssetsDto: { assetIds }, key }).then(({ data: dto }) => {
    if (dto.successfullyAdded > 0) {
      // This might be 0 if the user tries to add an asset that is already in the album
      notificationController.show({
        message: `Added ${dto.successfullyAdded} to ${dto.album?.albumName}`,
        type: NotificationType.Info,
      });
    }

    return dto;
  });

const downloadBlob = (data: Blob, filename: string) => {
  const url = URL.createObjectURL(data);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;

  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  URL.revokeObjectURL(url);
};

export const downloadArchive = async (
  fileName: string,
  options: Omit<AssetApiGetDownloadInfoRequest, 'key'>,
  onDone?: () => void,
  key?: string,
) => {
  let downloadInfo: DownloadResponseDto | null = null;

  try {
    const { data } = await api.assetApi.getDownloadInfo({ ...options, key });
    downloadInfo = data;
  } catch (error) {
    handleError(error, 'Unable to download files');
    return;
  }

  // TODO: prompt for big download
  // const total = downloadInfo.totalSize;

  for (let i = 0; i < downloadInfo.archives.length; i++) {
    const archive = downloadInfo.archives[i];
    const suffix = downloadInfo.archives.length === 1 ? '' : `+${i + 1}`;
    const archiveName = fileName.replace('.zip', `${suffix}.zip`);

    let downloadKey = `${archiveName}`;
    if (downloadInfo.archives.length > 1) {
      downloadKey = `${archiveName} (${i + 1}/${downloadInfo.archives.length})`;
    }

    updateDownload(downloadKey, 0);

    try {
      const { data } = await api.assetApi.downloadArchive(
        { assetIdsDto: { assetIds: archive.assetIds }, key },
        {
          responseType: 'blob',
          onDownloadProgress: (event) => updateDownload(downloadKey, Math.floor((event.loaded / archive.size) * 100)),
        },
      );

      downloadBlob(data, archiveName);
    } catch (e) {
      handleError(e, 'Unable to download files');
      clearDownload(downloadKey);
      return;
    } finally {
      setTimeout(() => clearDownload(downloadKey), 3_000);
    }
  }

  onDone?.();
};

export const downloadFile = async (asset: AssetResponseDto, key?: string) => {
  const assets = [{ filename: `${asset.originalFileName}.${getFilenameExtension(asset.originalPath)}`, id: asset.id }];
  if (asset.livePhotoVideoId) {
    assets.push({
      filename: `${asset.originalFileName}.mov`,
      id: asset.livePhotoVideoId,
    });
  }

  for (const asset of assets) {
    try {
      updateDownload(asset.filename, 0);

      const { data } = await api.assetApi.downloadFile(
        { id: asset.id, key },
        {
          responseType: 'blob',
          onDownloadProgress: (event: ProgressEvent) => {
            if (event.lengthComputable) {
              updateDownload(asset.filename, Math.floor((event.loaded / event.total) * 100));
            }
          },
        },
      );

      downloadBlob(data, asset.filename);
    } catch (e) {
      handleError(e, `Error downloading ${asset.filename}`);
    } finally {
      setTimeout(() => clearDownload(asset.filename), 3_000);
    }
  }
};

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

function isRotated90CW(orientation: number) {
  return orientation == 6 || orientation == 90;
}

function isRotated270CW(orientation: number) {
  return orientation == 8 || orientation == -90;
}

/**
 * Returns aspect ratio for the asset
 */
export function getAssetRatio(asset: AssetResponseDto) {
  let height = asset.exifInfo?.exifImageHeight || 235;
  let width = asset.exifInfo?.exifImageWidth || 235;
  const orientation = Number(asset.exifInfo?.orientation);
  if (orientation) {
    if (isRotated90CW(orientation) || isRotated270CW(orientation)) {
      [width, height] = [height, width];
    }
  }
  return { width, height };
}
