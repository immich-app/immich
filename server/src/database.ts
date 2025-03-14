import { sql } from 'kysely';
import { AssetStatus, AssetType, Permission } from 'src/enum';

export type AuthUser = {
  id: string;
  isAdmin: boolean;
  name: string;
  email: string;
  quotaUsageInBytes: number;
  quotaSizeInBytes: number | null;
};

export type Library = {
  id: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  updateId: string;
  name: string;
  importPaths: string[];
  exclusionPatterns: string[];
  deletedAt: Date | null;
  refreshedAt: Date | null;
  assets?: Asset[];
};

export type AuthApiKey = {
  id: string;
  permissions: Permission[];
};

export type ApiKey = {
  id: string;
  name: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  permissions: Permission[];
};

export type User = {
  id: string;
  name: string;
  email: string;
  profileImagePath: string;
  profileChangedAt: Date;
};

export type Asset = {
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  id: string;
  updateId: string;
  status: AssetStatus;
  checksum: Buffer<ArrayBufferLike>;
  deviceAssetId: string;
  deviceId: string;
  duplicateId: string | null;
  duration: string | null;
  encodedVideoPath: string | null;
  fileCreatedAt: Date | null;
  fileModifiedAt: Date | null;
  isArchived: boolean;
  isExternal: boolean;
  isFavorite: boolean;
  isOffline: boolean;
  isVisible: boolean;
  libraryId: string | null;
  livePhotoVideoId: string | null;
  localDateTime: Date | null;
  originalFileName: string;
  originalPath: string;
  ownerId: string;
  sidecarPath: string | null;
  stackId: string | null;
  thumbhash: Buffer<ArrayBufferLike> | null;
  type: AssetType;
};

export type AuthSharedLink = {
  id: string;
  expiresAt: Date | null;
  userId: string;
  showExif: boolean;
  allowUpload: boolean;
  allowDownload: boolean;
  password: string | null;
};

export type AuthSession = {
  id: string;
};

export type Partner = {
  sharedById: string;
  sharedBy: User;
  sharedWithId: string;
  sharedWith: User;
  createdAt: Date;
  updatedAt: Date;
  updateId: string;
  inTimeline: boolean;
};

export const columns = {
  ackEpoch: (columnName: 'createdAt' | 'updatedAt' | 'deletedAt') =>
    sql.raw<string>(`extract(epoch from "${columnName}")::text`).as('ackEpoch'),
  authUser: [
    'users.id',
    'users.name',
    'users.email',
    'users.isAdmin',
    'users.quotaUsageInBytes',
    'users.quotaSizeInBytes',
  ],
  authApiKey: ['api_keys.id', 'api_keys.permissions'],
  authSession: ['sessions.id', 'sessions.updatedAt'],
  authSharedLink: [
    'shared_links.id',
    'shared_links.userId',
    'shared_links.expiresAt',
    'shared_links.showExif',
    'shared_links.allowUpload',
    'shared_links.allowDownload',
    'shared_links.password',
  ],
  userDto: ['id', 'name', 'email', 'profileImagePath', 'profileChangedAt'],
  tagDto: ['id', 'value', 'createdAt', 'updatedAt', 'color', 'parentId'],
  apiKey: ['id', 'name', 'userId', 'createdAt', 'updatedAt', 'permissions'],
  syncAsset: [
    'id',
    'ownerId',
    'thumbhash',
    'checksum',
    'fileCreatedAt',
    'fileModifiedAt',
    'localDateTime',
    'type',
    'deletedAt',
    'isFavorite',
    'isVisible',
    'updateId',
  ],
  syncAssetExif: [
    'exif.assetId',
    'exif.description',
    'exif.exifImageWidth',
    'exif.exifImageHeight',
    'exif.fileSizeInByte',
    'exif.orientation',
    'exif.dateTimeOriginal',
    'exif.modifyDate',
    'exif.timeZone',
    'exif.latitude',
    'exif.longitude',
    'exif.projectionType',
    'exif.city',
    'exif.state',
    'exif.country',
    'exif.make',
    'exif.model',
    'exif.lensModel',
    'exif.fNumber',
    'exif.focalLength',
    'exif.iso',
    'exif.exposureTime',
    'exif.profileDescription',
    'exif.rating',
    'exif.fps',
    'exif.updateId',
  ],
} as const;
