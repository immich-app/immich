import { Selectable } from 'kysely';
import { Albums, Exif as DatabaseExif } from 'src/db';
import { MapAsset } from 'src/dtos/asset-response.dto';
import {
  AlbumUserRole,
  AssetFileType,
  AssetType,
  MemoryType,
  Permission,
  SharedLinkType,
  SourceType,
  UserStatus,
} from 'src/enum';
import { OnThisDayData, UserMetadataItem } from 'src/types';

export type AuthUser = {
  id: string;
  isAdmin: boolean;
  name: string;
  email: string;
  quotaUsageInBytes: number;
  quotaSizeInBytes: number | null;
};

export type AlbumUser = {
  user: User;
  role: AlbumUserRole;
};

export type AssetFile = {
  id: string;
  type: AssetFileType;
  path: string;
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
  assets?: MapAsset[];
};

export type AuthApiKey = {
  id: string;
  permissions: Permission[];
};

export type Activity = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  albumId: string;
  userId: string;
  user: User;
  assetId: string | null;
  comment: string | null;
  isLiked: boolean;
  updateId: string;
};

export type ApiKey = {
  id: string;
  name: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  permissions: Permission[];
};

export type Tag = {
  id: string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
  color: string | null;
  parentId: string | null;
};

export type Memory = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  memoryAt: Date;
  seenAt: Date | null;
  showAt: Date | null;
  hideAt: Date | null;
  type: MemoryType;
  data: OnThisDayData;
  ownerId: string;
  isSaved: boolean;
  assets: MapAsset[];
};

export type Asset = {
  id: string;
  checksum: Buffer<ArrayBufferLike>;
  deviceAssetId: string;
  deviceId: string;
  fileCreatedAt: Date;
  fileModifiedAt: Date;
  isExternal: boolean;
  isVisible: boolean;
  libraryId: string | null;
  livePhotoVideoId: string | null;
  localDateTime: Date;
  originalFileName: string;
  originalPath: string;
  ownerId: string;
  sidecarPath: string | null;
  type: AssetType;
};

export type User = {
  id: string;
  name: string;
  email: string;
  profileImagePath: string;
  profileChangedAt: Date;
};

export type UserAdmin = User & {
  storageLabel: string | null;
  shouldChangePassword: boolean;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  oauthId: string;
  quotaSizeInBytes: number | null;
  quotaUsageInBytes: number;
  status: UserStatus;
  metadata: UserMetadataItem[];
};

export type StorageAsset = {
  id: string;
  ownerId: string;
  files: AssetFile[];
  encodedVideoPath: string | null;
};

export type SidecarWriteAsset = {
  id: string;
  sidecarPath: string | null;
  originalPath: string;
  tags: Array<{ value: string }>;
};

export type Stack = {
  id: string;
  primaryAssetId: string;
  owner?: User;
  ownerId: string;
  assets: MapAsset[];
  assetCount?: number;
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

export type SharedLink = {
  id: string;
  album?: Album | null;
  albumId: string | null;
  allowDownload: boolean;
  allowUpload: boolean;
  assets: MapAsset[];
  createdAt: Date;
  description: string | null;
  expiresAt: Date | null;
  key: Buffer;
  password: string | null;
  showExif: boolean;
  type: SharedLinkType;
  userId: string;
};

export type Album = Selectable<Albums> & {
  owner: User;
  assets: MapAsset[];
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

export type Place = {
  admin1Code: string | null;
  admin1Name: string | null;
  admin2Code: string | null;
  admin2Name: string | null;
  alternateNames: string | null;
  countryCode: string;
  id: number;
  latitude: number;
  longitude: number;
  modificationDate: Date;
  name: string;
};

export type Session = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deviceOS: string;
  deviceType: string;
};

export type Exif = Omit<Selectable<DatabaseExif>, 'updatedAt' | 'updateId'>;

export type Person = {
  createdAt: Date;
  id: string;
  ownerId: string;
  updatedAt: Date;
  updateId: string;
  isFavorite: boolean;
  name: string;
  birthDate: Date | null;
  color: string | null;
  faceAssetId: string | null;
  isHidden: boolean;
  thumbnailPath: string;
};

export type AssetFace = {
  id: string;
  deletedAt: Date | null;
  assetId: string;
  boundingBoxX1: number;
  boundingBoxX2: number;
  boundingBoxY1: number;
  boundingBoxY2: number;
  imageHeight: number;
  imageWidth: number;
  personId: string | null;
  sourceType: SourceType;
  person?: Person | null;
};

const userColumns = ['id', 'name', 'email', 'profileImagePath', 'profileChangedAt'] as const;

export const columns = {
  asset: [
    'assets.id',
    'assets.checksum',
    'assets.deviceAssetId',
    'assets.deviceId',
    'assets.fileCreatedAt',
    'assets.fileModifiedAt',
    'assets.isExternal',
    'assets.isVisible',
    'assets.libraryId',
    'assets.livePhotoVideoId',
    'assets.localDateTime',
    'assets.originalFileName',
    'assets.originalPath',
    'assets.ownerId',
    'assets.sidecarPath',
    'assets.type',
  ],
  assetFiles: ['asset_files.id', 'asset_files.path', 'asset_files.type'],
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
  user: userColumns,
  userWithPrefix: ['users.id', 'users.name', 'users.email', 'users.profileImagePath', 'users.profileChangedAt'],
  userAdmin: [
    ...userColumns,
    'createdAt',
    'updatedAt',
    'deletedAt',
    'isAdmin',
    'status',
    'oauthId',
    'profileImagePath',
    'shouldChangePassword',
    'storageLabel',
    'quotaSizeInBytes',
    'quotaUsageInBytes',
  ],
  tag: ['tags.id', 'tags.value', 'tags.createdAt', 'tags.updatedAt', 'tags.color', 'tags.parentId'],
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
  stack: ['stack.id', 'stack.primaryAssetId', 'ownerId'],
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
  exif: [
    'exif.assetId',
    'exif.autoStackId',
    'exif.bitsPerSample',
    'exif.city',
    'exif.colorspace',
    'exif.country',
    'exif.dateTimeOriginal',
    'exif.description',
    'exif.exifImageHeight',
    'exif.exifImageWidth',
    'exif.exposureTime',
    'exif.fileSizeInByte',
    'exif.fNumber',
    'exif.focalLength',
    'exif.fps',
    'exif.iso',
    'exif.latitude',
    'exif.lensModel',
    'exif.livePhotoCID',
    'exif.longitude',
    'exif.make',
    'exif.model',
    'exif.modifyDate',
    'exif.orientation',
    'exif.profileDescription',
    'exif.projectionType',
    'exif.rating',
    'exif.state',
    'exif.timeZone',
  ],
} as const;
