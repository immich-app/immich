import { AssetFactory } from 'test/factories/asset.factory';

export const getForStorageTemplate = (asset: ReturnType<AssetFactory['build']>) => {
  return {
    id: asset.id,
    ownerId: asset.ownerId,
    livePhotoVideoId: asset.livePhotoVideoId,
    type: asset.type,
    isExternal: asset.isExternal,
    checksum: asset.checksum,
    timeZone: asset.exifInfo.timeZone,
    fileCreatedAt: asset.fileCreatedAt,
    originalPath: asset.originalPath,
    originalFileName: asset.originalFileName,
    fileSizeInByte: asset.exifInfo.fileSizeInByte,
    files: asset.files,
    make: asset.exifInfo.make,
    model: asset.exifInfo.model,
    lensModel: asset.exifInfo.lensModel,
    isEdited: asset.isEdited,
  };
};
