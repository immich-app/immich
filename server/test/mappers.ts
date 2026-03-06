import { Selectable, ShallowDehydrateObject } from 'kysely';
import { AssetEditActionItem } from 'src/dtos/editing.dto';
import { ActivityTable } from 'src/schema/tables/activity.table';
import { AssetTable } from 'src/schema/tables/asset.table';
import { PartnerTable } from 'src/schema/tables/partner.table';
import { AlbumFactory } from 'test/factories/album.factory';
import { AssetFaceFactory } from 'test/factories/asset-face.factory';
import { AssetFactory } from 'test/factories/asset.factory';
import { MemoryFactory } from 'test/factories/memory.factory';
import { SharedLinkFactory } from 'test/factories/shared-link.factory';
import { StackFactory } from 'test/factories/stack.factory';
import { UserFactory } from 'test/factories/user.factory';

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
  asset: asset
    ? { ownerId: asset.ownerId, visibility: asset.visibility, fileCreatedAt: asset.fileCreatedAt.toISOString() }
    : null,
  faceSearch: { faceId: face.id, embedding: '[1, 2, 3, 4]' },
});

export const getDehydrated = <T extends Record<string, unknown>>(entity: T) => {
  const copiedEntity = structuredClone(entity);
  for (const [key, value] of Object.entries(copiedEntity)) {
    if (value instanceof Date) {
      Object.assign(copiedEntity, { [key]: value.toISOString() });
      continue;
    }
  }

  return copiedEntity as ShallowDehydrateObject<T>;
};

export const getForAlbum = (album: ReturnType<AlbumFactory['build']>) => ({
  ...album,
  assets: album.assets.map((asset) =>
    getDehydrated({ ...getForAsset(asset), exifInfo: getDehydrated(asset.exifInfo) }),
  ),
  albumUsers: album.albumUsers.map((albumUser) => ({
    ...albumUser,
    createdAt: albumUser.createdAt.toISOString(),
    user: getDehydrated(albumUser.user),
  })),
  owner: getDehydrated(album.owner),
  sharedLinks: album.sharedLinks.map((sharedLink) => getDehydrated(sharedLink)),
});

export const getForActivity = (activity: Selectable<ActivityTable> & { user: ReturnType<UserFactory['build']> }) => ({
  ...activity,
  user: getDehydrated(activity.user),
});

export const getForAsset = (asset: ReturnType<AssetFactory['build']>) => {
  return {
    ...asset,
    faces: asset.faces.map((face) => ({
      ...getDehydrated(face),
      person: face.person ? getDehydrated(face.person) : null,
    })),
    owner: getDehydrated(asset.owner),
    stack: asset.stack
      ? { ...getDehydrated(asset.stack), assets: asset.stack.assets.map((asset) => getDehydrated(asset)) }
      : null,
    files: asset.files.map((file) => getDehydrated(file)),
    exifInfo: asset.exifInfo ? getDehydrated(asset.exifInfo) : null,
    edits: asset.edits.map(({ action, parameters }) => ({ action, parameters })) as AssetEditActionItem[],
  };
};

export const getForPartner = (
  partner: Selectable<PartnerTable> & Record<'sharedWith' | 'sharedBy', ReturnType<UserFactory['build']>>,
) => ({
  ...partner,
  sharedBy: getDehydrated(partner.sharedBy),
  sharedWith: getDehydrated(partner.sharedWith),
});

export const getForMemory = (memory: ReturnType<MemoryFactory['build']>) => ({
  ...memory,
  assets: memory.assets.map((asset) => getDehydrated(asset)),
});

export const getForMetadataExtraction = (asset: ReturnType<AssetFactory['build']>) => ({
  id: asset.id,
  checksum: asset.checksum,
  deviceAssetId: asset.deviceAssetId,
  deviceId: asset.deviceId,
  fileCreatedAt: asset.fileCreatedAt,
  fileModifiedAt: asset.fileModifiedAt,
  isExternal: asset.isExternal,
  visibility: asset.visibility,
  libraryId: asset.libraryId,
  livePhotoVideoId: asset.livePhotoVideoId,
  localDateTime: asset.localDateTime,
  originalFileName: asset.originalFileName,
  originalPath: asset.originalPath,
  ownerId: asset.ownerId,
  type: asset.type,
  width: asset.width,
  height: asset.height,
  faces: asset.faces.map((face) => getDehydrated(face)),
  files: asset.files.map((file) => getDehydrated(file)),
});

export const getForGenerateThumbnail = (asset: ReturnType<AssetFactory['build']>) => ({
  id: asset.id,
  visibility: asset.visibility,
  originalFileName: asset.originalFileName,
  originalPath: asset.originalPath,
  ownerId: asset.ownerId,
  thumbhash: asset.thumbhash,
  type: asset.type,
  files: asset.files.map((file) => getDehydrated(file)),
  exifInfo: getDehydrated(asset.exifInfo),
  edits: asset.edits.map(({ action, parameters }) => ({ action, parameters })) as AssetEditActionItem[],
});

export const getForAssetFace = (face: ReturnType<AssetFaceFactory['build']>) => ({
  ...face,
  person: face.person ? getDehydrated(face.person) : null,
});

export const getForDetectedFaces = (asset: ReturnType<AssetFactory['build']>) => ({
  id: asset.id,
  visibility: asset.visibility,
  exifInfo: getDehydrated(asset.exifInfo),
  faces: asset.faces.map((face) => getDehydrated(face)),
  files: asset.files.map((file) => getDehydrated(file)),
});

export const getForSidecarWrite = (asset: ReturnType<AssetFactory['build']>) => ({
  id: asset.id,
  originalPath: asset.originalPath,
  files: asset.files.map((file) => getDehydrated(file)),
  exifInfo: getDehydrated(asset.exifInfo),
});

export const getForAssetDeletion = (asset: ReturnType<AssetFactory['build']>) => ({
  id: asset.id,
  visibility: asset.visibility,
  libraryId: asset.libraryId,
  ownerId: asset.ownerId,
  livePhotoVideoId: asset.livePhotoVideoId,
  encodedVideoPath: asset.encodedVideoPath,
  originalPath: asset.originalPath,
  isOffline: asset.isOffline,
  exifInfo: asset.exifInfo ? getDehydrated(asset.exifInfo) : null,
  files: asset.files.map((file) => getDehydrated(file)),
  stack: asset.stack
    ? {
        ...getDehydrated(asset.stack),
        assets: asset.stack.assets.filter(({ id }) => id !== asset.stack?.primaryAssetId).map(({ id }) => ({ id })),
      }
    : null,
});

export const getForStack = (stack: ReturnType<StackFactory['build']>) => ({
  ...stack,
  assets: stack.assets.map((asset) => ({
    ...getDehydrated(asset),
    exifInfo: getDehydrated(asset.exifInfo),
  })),
});

export const getForDuplicate = (asset: ReturnType<AssetFactory['build']>) => ({
  ...getDehydrated(asset),
  exifInfo: getDehydrated(asset.exifInfo),
});

export const getForSharedLink = (sharedLink: ReturnType<SharedLinkFactory['build']>) => ({
  ...sharedLink,
  assets: sharedLink.assets.map((asset) => ({
    ...getDehydrated({ ...getForAsset(asset) }),
    exifInfo: getDehydrated(asset.exifInfo),
  })),
  album: sharedLink.album
    ? {
        ...getDehydrated(sharedLink.album),
        owner: getDehydrated(sharedLink.album.owner),
        assets: sharedLink.album.assets.map((asset) => getDehydrated(asset)),
      }
    : null,
});
