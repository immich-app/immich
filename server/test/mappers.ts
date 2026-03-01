import { Selectable } from 'kysely';
import { AssetTable } from 'src/schema/tables/asset.table';
import { AssetFaceFactory } from 'test/factories/asset-face.factory';
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
    visibility: asset.visibility,
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

export const getAsDetectedFace = (face: ReturnType<AssetFaceFactory['build']>) => ({
  faces: [
    {
      boundingBox: {
        x1: face.boundingBoxX1,
        y1: face.boundingBoxY1,
        x2: face.boundingBoxX2,
        y2: face.boundingBoxY2,
      },
      embedding: '[1, 2, 3, 4]',
      score: 0.2,
    },
  ],
  imageHeight: face.imageHeight,
  imageWidth: face.imageWidth,
});

export const getForFacialRecognitionJob = (
  face: ReturnType<AssetFaceFactory['build']>,
  asset: Pick<Selectable<AssetTable>, 'ownerId' | 'visibility' | 'fileCreatedAt'> | null,
) => ({
  ...face,
  asset,
  faceSearch: { faceId: face.id, embedding: '[1, 2, 3, 4]' },
});
