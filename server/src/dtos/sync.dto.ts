/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, IsInt, IsPositive, IsString } from 'class-validator';
import { AssetResponseDto } from 'src/dtos/asset-response.dto';
import { AssetEditAction } from 'src/dtos/editing.dto';
import {
  AlbumUserRole,
  AssetOrder,
  AssetType,
  AssetVisibility,
  MemoryType,
  SyncEntityType,
  SyncRequestType,
  UserAvatarColor,
  UserMetadataKey,
} from 'src/enum';
import { UserMetadata } from 'src/types';
import { ValidateBoolean, ValidateDate, ValidateEnum, ValidateUUID } from 'src/validation';

export class AssetFullSyncDto {
  @ValidateUUID({ optional: true, description: 'Last asset ID (pagination)' })
  lastId?: string;

  @ValidateDate({ description: 'Sync assets updated until this date' })
  updatedUntil!: Date;

  @ApiProperty({ type: 'integer', description: 'Maximum number of assets to return' })
  @IsInt()
  @IsPositive()
  limit!: number;

  @ValidateUUID({ optional: true, description: 'Filter by user ID' })
  userId?: string;
}

export class AssetDeltaSyncDto {
  @ValidateDate({ description: 'Sync assets updated after this date' })
  updatedAfter!: Date;

  @ValidateUUID({ each: true, description: 'User IDs to sync' })
  userIds!: string[];
}

export class AssetDeltaSyncResponseDto {
  @ApiProperty({ description: 'Whether full sync is needed' })
  needsFullSync!: boolean;
  @ApiProperty({ description: 'Upserted assets' })
  upserted!: AssetResponseDto[];
  @ApiProperty({ description: 'Deleted asset IDs' })
  deleted!: string[];
}

export const extraSyncModels: Function[] = [];

export const ExtraModel = (): ClassDecorator => {
  // eslint-disable-next-line unicorn/consistent-function-scoping
  return (object: Function) => {
    extraSyncModels.push(object);
  };
};

@ExtraModel()
export class SyncUserV1 {
  @ApiProperty({ description: 'User ID' })
  id!: string;
  @ApiProperty({ description: 'User name' })
  name!: string;
  @ApiProperty({ description: 'User email' })
  email!: string;
  @ValidateEnum({ enum: UserAvatarColor, name: 'UserAvatarColor', description: 'User avatar color' })
  avatarColor!: UserAvatarColor | null;
  @ApiProperty({ description: 'User deleted at' })
  deletedAt!: Date | null;
  @ApiProperty({ description: 'User has profile image' })
  hasProfileImage!: boolean;
  @ApiProperty({ description: 'User profile changed at' })
  profileChangedAt!: Date;
}

@ExtraModel()
export class SyncAuthUserV1 extends SyncUserV1 {
  @ApiProperty({ description: 'User is admin' })
  isAdmin!: boolean;
  @ApiProperty({ description: 'User pin code' })
  pinCode!: string | null;
  @ApiProperty({ description: 'User OAuth ID' })
  oauthId!: string;
  @ApiProperty({ description: 'User storage label' })
  storageLabel!: string | null;
  @ApiProperty({ type: 'integer' })
  quotaSizeInBytes!: number | null;
  @ApiProperty({ type: 'integer' })
  quotaUsageInBytes!: number;
}

@ExtraModel()
export class SyncUserDeleteV1 {
  @ApiProperty({ description: 'User ID' })
  userId!: string;
}

@ExtraModel()
export class SyncPartnerV1 {
  @ApiProperty({ description: 'Shared by ID' })
  sharedById!: string;
  @ApiProperty({ description: 'Shared with ID' })
  sharedWithId!: string;
  @ApiProperty({ description: 'In timeline' })
  inTimeline!: boolean;
}

@ExtraModel()
export class SyncPartnerDeleteV1 {
  @ApiProperty({ description: 'Shared by ID' })
  sharedById!: string;
  @ApiProperty({ description: 'Shared with ID' })
  sharedWithId!: string;
}

@ExtraModel()
export class SyncAssetV1 {
  @ApiProperty({ description: 'Asset ID' })
  id!: string;
  @ApiProperty({ description: 'Owner ID' })
  ownerId!: string;
  @ApiProperty({ description: 'Original file name' })
  originalFileName!: string;
  @ApiProperty({ description: 'Thumbhash' })
  thumbhash!: string | null;
  @ApiProperty({ description: 'Checksum' })
  checksum!: string;
  @ApiProperty({ description: 'File created at' })
  fileCreatedAt!: Date | null;
  @ApiProperty({ description: 'File modified at' })
  fileModifiedAt!: Date | null;
  @ApiProperty({ description: 'Local date time' })
  localDateTime!: Date | null;
  @ApiProperty({ description: 'Duration' })
  duration!: string | null;
  @ValidateEnum({ enum: AssetType, name: 'AssetTypeEnum', description: 'Asset type' })
  type!: AssetType;
  @ApiProperty({ description: 'Deleted at' })
  deletedAt!: Date | null;
  @ApiProperty({ description: 'Is favorite' })
  isFavorite!: boolean;
  @ValidateEnum({ enum: AssetVisibility, name: 'AssetVisibility', description: 'Asset visibility' })
  visibility!: AssetVisibility;
  @ApiProperty({ description: 'Live photo video ID' })
  livePhotoVideoId!: string | null;
  @ApiProperty({ description: 'Stack ID' })
  stackId!: string | null;
  @ApiProperty({ description: 'Library ID' })
  libraryId!: string | null;
  @ApiProperty({ type: 'integer', description: 'Asset width' })
  width!: number | null;
  @ApiProperty({ type: 'integer', description: 'Asset height' })
  height!: number | null;
  @ApiProperty({ description: 'Is edited' })
  isEdited!: boolean;
}

@ExtraModel()
export class SyncAssetDeleteV1 {
  @ApiProperty({ description: 'Asset ID' })
  assetId!: string;
}

@ExtraModel()
export class SyncAssetExifV1 {
  @ApiProperty({ description: 'Asset ID' })
  assetId!: string;
  @ApiProperty({ description: 'Description' })
  description!: string | null;
  @ApiProperty({ type: 'integer', description: 'Exif image width' })
  exifImageWidth!: number | null;
  @ApiProperty({ type: 'integer', description: 'Exif image height' })
  exifImageHeight!: number | null;
  @ApiProperty({ type: 'integer', description: 'File size in byte' })
  fileSizeInByte!: number | null;
  @ApiProperty({ description: 'Orientation' })
  orientation!: string | null;
  @ApiProperty({ description: 'Date time original' })
  dateTimeOriginal!: Date | null;
  @ApiProperty({ description: 'Modify date' })
  modifyDate!: Date | null;
  @ApiProperty({ description: 'Time zone' })
  timeZone!: string | null;
  @ApiProperty({ type: 'number', format: 'double', description: 'Latitude' })
  latitude!: number | null;
  @ApiProperty({ type: 'number', format: 'double', description: 'Longitude' })
  longitude!: number | null;
  @ApiProperty({ description: 'Projection type' })
  projectionType!: string | null;
  @ApiProperty({ description: 'City' })
  city!: string | null;
  @ApiProperty({ description: 'State' })
  state!: string | null;
  @ApiProperty({ description: 'Country' })
  country!: string | null;
  @ApiProperty({ description: 'Make' })
  make!: string | null;
  @ApiProperty({ description: 'Model' })
  model!: string | null;
  @ApiProperty({ description: 'Lens model' })
  lensModel!: string | null;
  @ApiProperty({ type: 'number', format: 'double', description: 'F number' })
  fNumber!: number | null;
  @ApiProperty({ type: 'number', format: 'double', description: 'Focal length' })
  focalLength!: number | null;
  @ApiProperty({ type: 'integer', description: 'ISO' })
  iso!: number | null;
  @ApiProperty({ description: 'Exposure time' })
  exposureTime!: string | null;
  @ApiProperty({ description: 'Profile description' })
  profileDescription!: string | null;
  @ApiProperty({ type: 'integer', description: 'Rating' })
  rating!: number | null;
  @ApiProperty({ type: 'number', format: 'double', description: 'FPS' })
  fps!: number | null;
}

@ExtraModel()
export class SyncAssetEditV1 {
  id!: string;
  assetId!: string;

  @ValidateEnum({ enum: AssetEditAction, name: 'AssetEditAction' })
  action!: AssetEditAction;
  parameters!: object;

  @ApiProperty({ type: 'integer' })
  sequence!: number;
}

@ExtraModel()
export class SyncAssetEditDeleteV1 {
  editId!: string;
}

@ExtraModel()
export class SyncAssetMetadataV1 {
  @ApiProperty({ description: 'Asset ID' })
  assetId!: string;
  @ApiProperty({ description: 'Key' })
  key!: string;
  @ApiProperty({ description: 'Value' })
  value!: object;
}

@ExtraModel()
export class SyncAssetMetadataDeleteV1 {
  @ApiProperty({ description: 'Asset ID' })
  assetId!: string;
  @ApiProperty({ description: 'Key' })
  key!: string;
}

@ExtraModel()
export class SyncAlbumDeleteV1 {
  @ApiProperty({ description: 'Album ID' })
  albumId!: string;
}

@ExtraModel()
export class SyncAlbumUserDeleteV1 {
  @ApiProperty({ description: 'Album ID' })
  albumId!: string;
  @ApiProperty({ description: 'User ID' })
  userId!: string;
}

@ExtraModel()
export class SyncAlbumUserV1 {
  @ApiProperty({ description: 'Album ID' })
  albumId!: string;
  @ApiProperty({ description: 'User ID' })
  userId!: string;
  @ValidateEnum({ enum: AlbumUserRole, name: 'AlbumUserRole', description: 'Album user role' })
  role!: AlbumUserRole;
}

@ExtraModel()
export class SyncAlbumV1 {
  @ApiProperty({ description: 'Album ID' })
  id!: string;
  @ApiProperty({ description: 'Owner ID' })
  ownerId!: string;
  @ApiProperty({ description: 'Album name' })
  name!: string;
  @ApiProperty({ description: 'Album description' })
  description!: string;
  @ApiProperty({ description: 'Created at' })
  createdAt!: Date;
  @ApiProperty({ description: 'Updated at' })
  updatedAt!: Date;
  @ApiProperty({ description: 'Thumbnail asset ID' })
  thumbnailAssetId!: string | null;
  @ApiProperty({ description: 'Is activity enabled' })
  isActivityEnabled!: boolean;
  @ValidateEnum({ enum: AssetOrder, name: 'AssetOrder' })
  order!: AssetOrder;
}

@ExtraModel()
export class SyncAlbumToAssetV1 {
  @ApiProperty({ description: 'Album ID' })
  albumId!: string;
  @ApiProperty({ description: 'Asset ID' })
  assetId!: string;
}

@ExtraModel()
export class SyncAlbumToAssetDeleteV1 {
  @ApiProperty({ description: 'Album ID' })
  albumId!: string;
  @ApiProperty({ description: 'Asset ID' })
  assetId!: string;
}

@ExtraModel()
export class SyncMemoryV1 {
  @ApiProperty({ description: 'Memory ID' })
  id!: string;
  @ApiProperty({ description: 'Created at' })
  createdAt!: Date;
  @ApiProperty({ description: 'Updated at' })
  updatedAt!: Date;
  @ApiProperty({ description: 'Deleted at' })
  deletedAt!: Date | null;
  @ApiProperty({ description: 'Owner ID' })
  ownerId!: string;
  @ValidateEnum({ enum: MemoryType, name: 'MemoryType', description: 'Memory type' })
  type!: MemoryType;
  @ApiProperty({ description: 'Data' })
  data!: object;
  @ApiProperty({ description: 'Is saved' })
  isSaved!: boolean;
  @ApiProperty({ description: 'Memory at' })
  memoryAt!: Date;
  @ApiProperty({ description: 'Seen at' })
  seenAt!: Date | null;
  @ApiProperty({ description: 'Show at' })
  showAt!: Date | null;
  @ApiProperty({ description: 'Hide at' })
  hideAt!: Date | null;
}

@ExtraModel()
export class SyncMemoryDeleteV1 {
  @ApiProperty({ description: 'Memory ID' })
  memoryId!: string;
}

@ExtraModel()
export class SyncMemoryAssetV1 {
  @ApiProperty({ description: 'Memory ID' })
  memoryId!: string;
  @ApiProperty({ description: 'Asset ID' })
  assetId!: string;
}

@ExtraModel()
export class SyncMemoryAssetDeleteV1 {
  @ApiProperty({ description: 'Memory ID' })
  memoryId!: string;
  @ApiProperty({ description: 'Asset ID' })
  assetId!: string;
}

@ExtraModel()
export class SyncStackV1 {
  @ApiProperty({ description: 'Stack ID' })
  id!: string;
  @ApiProperty({ description: 'Created at' })
  createdAt!: Date;
  @ApiProperty({ description: 'Updated at' })
  updatedAt!: Date;
  @ApiProperty({ description: 'Primary asset ID' })
  primaryAssetId!: string;
  @ApiProperty({ description: 'Owner ID' })
  ownerId!: string;
}

@ExtraModel()
export class SyncStackDeleteV1 {
  @ApiProperty({ description: 'Stack ID' })
  stackId!: string;
}

@ExtraModel()
export class SyncPersonV1 {
  @ApiProperty({ description: 'Person ID' })
  id!: string;
  @ApiProperty({ description: 'Created at' })
  createdAt!: Date;
  @ApiProperty({ description: 'Updated at' })
  updatedAt!: Date;
  @ApiProperty({ description: 'Owner ID' })
  ownerId!: string;
  @ApiProperty({ description: 'Person name' })
  name!: string;
  @ApiProperty({ description: 'Birth date' })
  birthDate!: Date | null;
  @ApiProperty({ description: 'Is hidden' })
  isHidden!: boolean;
  @ApiProperty({ description: 'Is favorite' })
  isFavorite!: boolean;
  @ApiProperty({ description: 'Color' })
  color!: string | null;
  @ApiProperty({ description: 'Face asset ID' })
  faceAssetId!: string | null;
}

@ExtraModel()
export class SyncPersonDeleteV1 {
  @ApiProperty({ description: 'Person ID' })
  personId!: string;
}

@ExtraModel()
export class SyncAssetFaceV1 {
  @ApiProperty({ description: 'Asset face ID' })
  id!: string;
  @ApiProperty({ description: 'Asset ID' })
  assetId!: string;
  @ApiProperty({ description: 'Person ID' })
  personId!: string | null;
  @ApiProperty({ type: 'integer' })
  imageWidth!: number;
  @ApiProperty({ type: 'integer' })
  imageHeight!: number;
  @ApiProperty({ type: 'integer' })
  boundingBoxX1!: number;
  @ApiProperty({ type: 'integer' })
  boundingBoxY1!: number;
  @ApiProperty({ type: 'integer' })
  boundingBoxX2!: number;
  @ApiProperty({ type: 'integer' })
  boundingBoxY2!: number;
  @ApiProperty({ description: 'Source type' })
  sourceType!: string;
}

@ExtraModel()
export class SyncAssetFaceV2 extends SyncAssetFaceV1 {
  @ApiProperty({ description: 'Face deleted at' })
  deletedAt!: Date | null;
  @ApiProperty({ description: 'Is the face visible in the asset' })
  isVisible!: boolean;
}

export function syncAssetFaceV2ToV1(faceV2: SyncAssetFaceV2): SyncAssetFaceV1 {
  const { deletedAt: _, isVisible: __, ...faceV1 } = faceV2;

  return faceV1;
}

@ExtraModel()
export class SyncAssetFaceDeleteV1 {
  @ApiProperty({ description: 'Asset face ID' })
  assetFaceId!: string;
}

@ExtraModel()
export class SyncUserMetadataV1 {
  @ApiProperty({ description: 'User ID' })
  userId!: string;
  @ValidateEnum({ enum: UserMetadataKey, name: 'UserMetadataKey', description: 'User metadata key' })
  key!: UserMetadataKey;
  @ApiProperty({ description: 'User metadata value' })
  value!: UserMetadata[UserMetadataKey];
}

@ExtraModel()
export class SyncUserMetadataDeleteV1 {
  @ApiProperty({ description: 'User ID' })
  userId!: string;
  @ValidateEnum({ enum: UserMetadataKey, name: 'UserMetadataKey', description: 'User metadata key' })
  key!: UserMetadataKey;
}

@ExtraModel()
export class SyncAckV1 {}

@ExtraModel()
export class SyncResetV1 {}

@ExtraModel()
export class SyncCompleteV1 {}

export type SyncItem = {
  [SyncEntityType.AuthUserV1]: SyncAuthUserV1;
  [SyncEntityType.UserV1]: SyncUserV1;
  [SyncEntityType.UserDeleteV1]: SyncUserDeleteV1;
  [SyncEntityType.PartnerV1]: SyncPartnerV1;
  [SyncEntityType.PartnerDeleteV1]: SyncPartnerDeleteV1;
  [SyncEntityType.AssetV1]: SyncAssetV1;
  [SyncEntityType.AssetDeleteV1]: SyncAssetDeleteV1;
  [SyncEntityType.AssetMetadataV1]: SyncAssetMetadataV1;
  [SyncEntityType.AssetMetadataDeleteV1]: SyncAssetMetadataDeleteV1;
  [SyncEntityType.AssetExifV1]: SyncAssetExifV1;
  [SyncEntityType.AssetEditV1]: SyncAssetEditV1;
  [SyncEntityType.AssetEditDeleteV1]: SyncAssetEditDeleteV1;
  [SyncEntityType.PartnerAssetV1]: SyncAssetV1;
  [SyncEntityType.PartnerAssetBackfillV1]: SyncAssetV1;
  [SyncEntityType.PartnerAssetDeleteV1]: SyncAssetDeleteV1;
  [SyncEntityType.PartnerAssetExifV1]: SyncAssetExifV1;
  [SyncEntityType.PartnerAssetExifBackfillV1]: SyncAssetExifV1;
  [SyncEntityType.AlbumV1]: SyncAlbumV1;
  [SyncEntityType.AlbumDeleteV1]: SyncAlbumDeleteV1;
  [SyncEntityType.AlbumUserV1]: SyncAlbumUserV1;
  [SyncEntityType.AlbumUserBackfillV1]: SyncAlbumUserV1;
  [SyncEntityType.AlbumUserDeleteV1]: SyncAlbumUserDeleteV1;
  [SyncEntityType.AlbumAssetCreateV1]: SyncAssetV1;
  [SyncEntityType.AlbumAssetUpdateV1]: SyncAssetV1;
  [SyncEntityType.AlbumAssetBackfillV1]: SyncAssetV1;
  [SyncEntityType.AlbumAssetExifCreateV1]: SyncAssetExifV1;
  [SyncEntityType.AlbumAssetExifUpdateV1]: SyncAssetExifV1;
  [SyncEntityType.AlbumAssetExifBackfillV1]: SyncAssetExifV1;
  [SyncEntityType.AlbumToAssetV1]: SyncAlbumToAssetV1;
  [SyncEntityType.AlbumToAssetBackfillV1]: SyncAlbumToAssetV1;
  [SyncEntityType.AlbumToAssetDeleteV1]: SyncAlbumToAssetDeleteV1;
  [SyncEntityType.MemoryV1]: SyncMemoryV1;
  [SyncEntityType.MemoryDeleteV1]: SyncMemoryDeleteV1;
  [SyncEntityType.MemoryToAssetV1]: SyncMemoryAssetV1;
  [SyncEntityType.MemoryToAssetDeleteV1]: SyncMemoryAssetDeleteV1;
  [SyncEntityType.StackV1]: SyncStackV1;
  [SyncEntityType.StackDeleteV1]: SyncStackDeleteV1;
  [SyncEntityType.PartnerStackBackfillV1]: SyncStackV1;
  [SyncEntityType.PartnerStackDeleteV1]: SyncStackDeleteV1;
  [SyncEntityType.PartnerStackV1]: SyncStackV1;
  [SyncEntityType.PersonV1]: SyncPersonV1;
  [SyncEntityType.PersonDeleteV1]: SyncPersonDeleteV1;
  [SyncEntityType.AssetFaceV1]: SyncAssetFaceV1;
  [SyncEntityType.AssetFaceV2]: SyncAssetFaceV2;
  [SyncEntityType.AssetFaceDeleteV1]: SyncAssetFaceDeleteV1;
  [SyncEntityType.UserMetadataV1]: SyncUserMetadataV1;
  [SyncEntityType.UserMetadataDeleteV1]: SyncUserMetadataDeleteV1;
  [SyncEntityType.SyncAckV1]: SyncAckV1;
  [SyncEntityType.SyncCompleteV1]: SyncCompleteV1;
  [SyncEntityType.SyncResetV1]: SyncResetV1;
};

export class SyncStreamDto {
  @ValidateEnum({ enum: SyncRequestType, name: 'SyncRequestType', each: true, description: 'Sync request types' })
  types!: SyncRequestType[];

  @ValidateBoolean({ optional: true, description: 'Reset sync state' })
  reset?: boolean;
}

export class SyncAckDto {
  @ValidateEnum({ enum: SyncEntityType, name: 'SyncEntityType', description: 'Sync entity type' })
  type!: SyncEntityType;
  @ApiProperty({ description: 'Acknowledgment ID' })
  ack!: string;
}

export class SyncAckSetDto {
  @ApiProperty({ description: 'Acknowledgment IDs (max 1000)' })
  @ArrayMaxSize(1000)
  @IsString({ each: true })
  acks!: string[];
}

export class SyncAckDeleteDto {
  @ValidateEnum({
    enum: SyncEntityType,
    name: 'SyncEntityType',
    optional: true,
    each: true,
    description: 'Sync entity types to delete acks for',
  })
  types?: SyncEntityType[];
}
