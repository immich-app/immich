import { Selectable } from 'kysely';
import { MapAsset } from 'src/dtos/asset-response.dto';
import {
  AlbumUserRole,
  AssetFileType,
  AssetType,
  AssetVisibility,
  MemoryType,
  Permission,
  SharedLinkType,
  SourceType,
  UserAvatarColor,
  UserStatus,
} from 'src/enum';
import { AlbumTable } from 'src/schema/tables/album.table';
import { AssetExifTable } from 'src/schema/tables/asset-exif.table';
import { UserMetadataItem } from 'src/types';

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
  data: object;
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
  visibility: AssetVisibility;
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
  avatarColor: UserAvatarColor | null;
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
  slug: string | null;
};

export type Album = Selectable<AlbumTable> & {
  owner: User;
  assets: MapAsset[];
};

export type AuthSession = {
  id: string;
  isPendingSyncReset: boolean;
  hasElevatedPermission: boolean;
};

export type Partner = {
  sharedById: string;
  sharedBy: User;
  sharedWithId: string;
  sharedWith: User;
  createdAt: Date;
  createId: string;
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
  expiresAt: Date | null;
  deviceOS: string;
  deviceType: string;
  pinExpiresAt: Date | null;
  isPendingSyncReset: boolean;
};

export type Exif = Omit<Selectable<AssetExifTable>, 'updatedAt' | 'updateId'>;

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
  updatedAt: Date;
  updateId: string;
};

const userColumns = ['id', 'name', 'email', 'avatarColor', 'profileImagePath', 'profileChangedAt'] as const;
const userWithPrefixColumns = [
  'user2.id',
  'user2.name',
  'user2.email',
  'user2.avatarColor',
  'user2.profileImagePath',
  'user2.profileChangedAt',
] as const;

export const columns = {
  asset: [
    'asset.id',
    'asset.checksum',
    'asset.deviceAssetId',
    'asset.deviceId',
    'asset.fileCreatedAt',
    'asset.fileModifiedAt',
    'asset.isExternal',
    'asset.visibility',
    'asset.libraryId',
    'asset.livePhotoVideoId',
    'asset.localDateTime',
    'asset.originalFileName',
    'asset.originalPath',
    'asset.ownerId',
    'asset.sidecarPath',
    'asset.type',
  ],
  assetFiles: ['asset_file.id', 'asset_file.path', 'asset_file.type'],
  authUser: ['user.id', 'user.name', 'user.email', 'user.isAdmin', 'user.quotaUsageInBytes', 'user.quotaSizeInBytes'],
  authApiKey: ['api_key.id', 'api_key.permissions'],
  authSession: ['session.id', 'session.isPendingSyncReset', 'session.updatedAt', 'session.pinExpiresAt'],
  authSharedLink: [
    'shared_link.id',
    'shared_link.userId',
    'shared_link.expiresAt',
    'shared_link.showExif',
    'shared_link.allowUpload',
    'shared_link.allowDownload',
    'shared_link.password',
  ],
  user: userColumns,
  userWithPrefix: userWithPrefixColumns,
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
  tag: ['tag.id', 'tag.value', 'tag.createdAt', 'tag.updatedAt', 'tag.color', 'tag.parentId'],
  apiKey: ['id', 'name', 'userId', 'createdAt', 'updatedAt', 'permissions'],
  notification: ['id', 'createdAt', 'level', 'type', 'title', 'description', 'data', 'readAt'],
  syncAsset: [
    'asset.id',
    'asset.ownerId',
    'asset.originalFileName',
    'asset.thumbhash',
    'asset.checksum',
    'asset.fileCreatedAt',
    'asset.fileModifiedAt',
    'asset.localDateTime',
    'asset.type',
    'asset.deletedAt',
    'asset.isFavorite',
    'asset.visibility',
    'asset.duration',
    'asset.livePhotoVideoId',
    'asset.stackId',
  ],
  syncAlbumUser: ['album_user.albumsId as albumId', 'album_user.usersId as userId', 'album_user.role'],
  syncStack: ['stack.id', 'stack.createdAt', 'stack.updatedAt', 'stack.primaryAssetId', 'stack.ownerId'],
  syncUser: ['id', 'name', 'email', 'avatarColor', 'deletedAt', 'updateId'],
  stack: ['stack.id', 'stack.primaryAssetId', 'ownerId'],
  syncAssetExif: [
    'asset_exif.assetId',
    'asset_exif.description',
    'asset_exif.exifImageWidth',
    'asset_exif.exifImageHeight',
    'asset_exif.fileSizeInByte',
    'asset_exif.orientation',
    'asset_exif.dateTimeOriginal',
    'asset_exif.modifyDate',
    'asset_exif.timeZone',
    'asset_exif.latitude',
    'asset_exif.longitude',
    'asset_exif.projectionType',
    'asset_exif.city',
    'asset_exif.state',
    'asset_exif.country',
    'asset_exif.make',
    'asset_exif.model',
    'asset_exif.lensModel',
    'asset_exif.fNumber',
    'asset_exif.focalLength',
    'asset_exif.iso',
    'asset_exif.exposureTime',
    'asset_exif.profileDescription',
    'asset_exif.rating',
    'asset_exif.fps',
  ],
  exif: [
    'asset_exif.assetId',
    'asset_exif.autoStackId',
    'asset_exif.bitsPerSample',
    'asset_exif.city',
    'asset_exif.colorspace',
    'asset_exif.country',
    'asset_exif.dateTimeOriginal',
    'asset_exif.description',
    'asset_exif.exifImageHeight',
    'asset_exif.exifImageWidth',
    'asset_exif.exposureTime',
    'asset_exif.fileSizeInByte',
    'asset_exif.fNumber',
    'asset_exif.focalLength',
    'asset_exif.fps',
    'asset_exif.iso',
    'asset_exif.latitude',
    'asset_exif.lensModel',
    'asset_exif.livePhotoCID',
    'asset_exif.longitude',
    'asset_exif.make',
    'asset_exif.model',
    'asset_exif.modifyDate',
    'asset_exif.orientation',
    'asset_exif.profileDescription',
    'asset_exif.projectionType',
    'asset_exif.rating',
    'asset_exif.state',
    'asset_exif.timeZone',
  ],
} as const;
