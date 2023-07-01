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
  const filenames = [`${asset.originalFileName}.${getFilenameExtension(asset.originalPath)}`];
  if (asset.livePhotoVideoId) {
    filenames.push(`${asset.originalFileName}.mov`);
  }

  for (const filename of filenames) {
    try {
      updateDownload(filename, 0);

      const { data } = await api.assetApi.downloadFile(
        { id: asset.id, key },
        {
          responseType: 'blob',
          onDownloadProgress: (event: ProgressEvent) => {
            if (event.lengthComputable) {
              updateDownload(filename, Math.floor((event.loaded / event.total) * 100));
            }
          },
        },
      );

      downloadBlob(data, filename);
    } catch (e) {
      handleError(e, `Error downloading ${filename}`);
    } finally {
      setTimeout(() => clearDownload(filename), 3_000);
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

/**
 * Returns the MIME type of the file and an empty string when not found.
 */
export function getFileMimeType(file: File): string {
  const mimeTypes: Record<string, string> = {
    '3fr': 'image/x-hasselblad-3fr',
    '3gp': 'video/3gpp',
    ari: 'image/x-arriflex-ari',
    arw: 'image/x-sony-arw',
    avi: 'video/avi',
    avif: 'image/avif',
    cap: 'image/x-phaseone-cap',
    cin: 'image/x-phantom-cin',
    cr2: 'image/x-canon-cr2',
    cr3: 'image/x-canon-cr3',
    crw: 'image/x-canon-crw',
    dcr: 'image/x-kodak-dcr',
    dng: 'image/x-adobe-dng',
    erf: 'image/x-epson-erf',
    fff: 'image/x-hasselblad-fff',
    flv: 'video/x-flv',
    gif: 'image/gif',
    heic: 'image/heic',
    heif: 'image/heif',
    iiq: 'image/x-phaseone-iiq',
    insp: 'image/jpeg',
    insv: 'video/mp4',
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    jxl: 'image/jxl',
    k25: 'image/x-kodak-k25',
    kdc: 'image/x-kodak-kdc',
    m2ts: 'video/mp2t',
    mkv: 'video/x-matroska',
    mov: 'video/quicktime',
    mp4: 'video/mp4',
    mpg: 'video/mpeg',
    mrw: 'image/x-minolta-mrw',
    mts: 'video/mp2t',
    nef: 'image/x-nikon-nef',
    orf: 'image/x-olympus-orf',
    ori: 'image/x-olympus-ori',
    pef: 'image/x-pentax-pef',
    png: 'image/png',
    raf: 'image/x-fuji-raf',
    raw: 'image/x-panasonic-raw',
    rwl: 'image/x-leica-rwl',
    sr2: 'image/x-sony-sr2',
    srf: 'image/x-sony-srf',
    srw: 'image/x-samsung-srw',
    tiff: 'image/tiff',
    webm: 'video/webm',
    webp: 'image/webp',
    wmv: 'video/x-ms-wmv',
    x3f: 'image/x-sigma-x3f',
  };
  // Return the MIME type determined by the browser or the MIME type based on the file extension.
  return file.type || (mimeTypes[getFilenameExtension(file.name)] ?? '');
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
