/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, IsInt, IsPositive, IsString } from 'class-validator';
import { AssetResponseDto } from 'src/dtos/asset-response.dto';
import {
  AlbumUserRole,
  AssetMetadataKey,
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
  @ValidateUUID({ optional: true })
  lastId?: string;

  @ValidateDate()
  updatedUntil!: Date;

  @IsInt()
  @IsPositive()
  @ApiProperty({ type: 'integer' })
  limit!: number;

  @ValidateUUID({ optional: true })
  userId?: string;
}

export class AssetDeltaSyncDto {
  @ValidateDate()
  updatedAfter!: Date;

  @ValidateUUID({ each: true })
  userIds!: string[];
}

export class AssetDeltaSyncResponseDto {
  needsFullSync!: boolean;
  upserted!: AssetResponseDto[];
  deleted!: string[];
}

export const extraSyncModels: Function[] = [];

export const ExtraModel = (): ClassDecorator => {
  return (object: Function) => {
    extraSyncModels.push(object);
  };
};

@ExtraModel()
export class SyncUserV1 {
  id!: string;
  name!: string;
  email!: string;
  @ValidateEnum({ enum: UserAvatarColor, name: 'UserAvatarColor', nullable: true })
  avatarColor!: UserAvatarColor | null;
  deletedAt!: Date | null;
  hasProfileImage!: boolean;
  profileChangedAt!: Date;
}

@ExtraModel()
export class SyncAuthUserV1 extends SyncUserV1 {
  isAdmin!: boolean;
  pinCode!: string | null;
  oauthId!: string;
  storageLabel!: string | null;
  @ApiProperty({ type: 'integer' })
  quotaSizeInBytes!: number | null;
  @ApiProperty({ type: 'integer' })
  quotaUsageInBytes!: number;
}

@ExtraModel()
export class SyncUserDeleteV1 {
  userId!: string;
}

@ExtraModel()
export class SyncPartnerV1 {
  sharedById!: string;
  sharedWithId!: string;
  inTimeline!: boolean;
}

@ExtraModel()
export class SyncPartnerDeleteV1 {
  sharedById!: string;
  sharedWithId!: string;
}

@ExtraModel()
export class SyncAssetV1 {
  id!: string;
  ownerId!: string;
  originalFileName!: string;
  thumbhash!: string | null;
  checksum!: string;
  fileCreatedAt!: Date | null;
  fileModifiedAt!: Date | null;
  localDateTime!: Date | null;
  duration!: string | null;
  @ValidateEnum({ enum: AssetType, name: 'AssetTypeEnum' })
  type!: AssetType;
  deletedAt!: Date | null;
  isFavorite!: boolean;
  @ValidateEnum({ enum: AssetVisibility, name: 'AssetVisibility' })
  visibility!: AssetVisibility;
  livePhotoVideoId!: string | null;
  stackId!: string | null;
  libraryId!: string | null;
}

@ExtraModel()
export class SyncAssetDeleteV1 {
  assetId!: string;
}

@ExtraModel()
export class SyncAssetExifV1 {
  assetId!: string;
  description!: string | null;
  @ApiProperty({ type: 'integer' })
  exifImageWidth!: number | null;
  @ApiProperty({ type: 'integer' })
  exifImageHeight!: number | null;
  @ApiProperty({ type: 'integer' })
  fileSizeInByte!: number | null;
  orientation!: string | null;
  dateTimeOriginal!: Date | null;
  modifyDate!: Date | null;
  timeZone!: string | null;
  @ApiProperty({ type: 'number', format: 'double' })
  latitude!: number | null;
  @ApiProperty({ type: 'number', format: 'double' })
  longitude!: number | null;
  projectionType!: string | null;
  city!: string | null;
  state!: string | null;
  country!: string | null;
  make!: string | null;
  model!: string | null;
  lensModel!: string | null;
  @ApiProperty({ type: 'number', format: 'double' })
  fNumber!: number | null;
  @ApiProperty({ type: 'number', format: 'double' })
  focalLength!: number | null;
  @ApiProperty({ type: 'integer' })
  iso!: number | null;
  exposureTime!: string | null;
  profileDescription!: string | null;
  @ApiProperty({ type: 'integer' })
  rating!: number | null;
  @ApiProperty({ type: 'number', format: 'double' })
  fps!: number | null;
}

@ExtraModel()
export class SyncAssetMetadataV1 {
  assetId!: string;
  @ValidateEnum({ enum: AssetMetadataKey, name: 'AssetMetadataKey' })
  key!: AssetMetadataKey;
  value!: object;
}

@ExtraModel()
export class SyncAssetMetadataDeleteV1 {
  assetId!: string;
  @ValidateEnum({ enum: AssetMetadataKey, name: 'AssetMetadataKey' })
  key!: AssetMetadataKey;
}

@ExtraModel()
export class SyncAlbumDeleteV1 {
  albumId!: string;
}

@ExtraModel()
export class SyncAlbumUserDeleteV1 {
  albumId!: string;
  userId!: string;
}

@ExtraModel()
export class SyncAlbumUserV1 {
  albumId!: string;
  userId!: string;
  @ValidateEnum({ enum: AlbumUserRole, name: 'AlbumUserRole' })
  role!: AlbumUserRole;
}

@ExtraModel()
export class SyncAlbumV1 {
  id!: string;
  ownerId!: string;
  name!: string;
  description!: string;
  createdAt!: Date;
  updatedAt!: Date;
  thumbnailAssetId!: string | null;
  isActivityEnabled!: boolean;
  @ValidateEnum({ enum: AssetOrder, name: 'AssetOrder' })
  order!: AssetOrder;
}

@ExtraModel()
export class SyncAlbumToAssetV1 {
  albumId!: string;
  assetId!: string;
}

@ExtraModel()
export class SyncAlbumToAssetDeleteV1 {
  albumId!: string;
  assetId!: string;
}

@ExtraModel()
export class SyncMemoryV1 {
  id!: string;
  createdAt!: Date;
  updatedAt!: Date;
  deletedAt!: Date | null;
  ownerId!: string;
  @ValidateEnum({ enum: MemoryType, name: 'MemoryType' })
  type!: MemoryType;
  data!: object;
  isSaved!: boolean;
  memoryAt!: Date;
  seenAt!: Date | null;
  showAt!: Date | null;
  hideAt!: Date | null;
}

@ExtraModel()
export class SyncMemoryDeleteV1 {
  memoryId!: string;
}

@ExtraModel()
export class SyncMemoryAssetV1 {
  memoryId!: string;
  assetId!: string;
}

@ExtraModel()
export class SyncMemoryAssetDeleteV1 {
  memoryId!: string;
  assetId!: string;
}

@ExtraModel()
export class SyncStackV1 {
  id!: string;
  createdAt!: Date;
  updatedAt!: Date;
  primaryAssetId!: string;
  ownerId!: string;
}

@ExtraModel()
export class SyncStackDeleteV1 {
  stackId!: string;
}

@ExtraModel()
export class SyncPersonV1 {
  id!: string;
  createdAt!: Date;
  updatedAt!: Date;
  ownerId!: string;
  name!: string;
  birthDate!: Date | null;
  isHidden!: boolean;
  isFavorite!: boolean;
  color!: string | null;
  faceAssetId!: string | null;
}

@ExtraModel()
export class SyncPersonDeleteV1 {
  personId!: string;
}

@ExtraModel()
export class SyncAssetFaceV1 {
  id!: string;
  assetId!: string;
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
  sourceType!: string;
}

@ExtraModel()
export class SyncAssetFaceDeleteV1 {
  assetFaceId!: string;
}

@ExtraModel()
export class SyncUserMetadataV1 {
  userId!: string;
  @ValidateEnum({ enum: UserMetadataKey, name: 'UserMetadataKey' })
  key!: UserMetadataKey;
  value!: UserMetadata[UserMetadataKey];
}

@ExtraModel()
export class SyncUserMetadataDeleteV1 {
  userId!: string;
  @ValidateEnum({ enum: UserMetadataKey, name: 'UserMetadataKey' })
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
  [SyncEntityType.AssetFaceDeleteV1]: SyncAssetFaceDeleteV1;
  [SyncEntityType.UserMetadataV1]: SyncUserMetadataV1;
  [SyncEntityType.UserMetadataDeleteV1]: SyncUserMetadataDeleteV1;
  [SyncEntityType.SyncAckV1]: SyncAckV1;
  [SyncEntityType.SyncCompleteV1]: SyncCompleteV1;
  [SyncEntityType.SyncResetV1]: SyncResetV1;
};

export class SyncStreamDto {
  @ValidateEnum({ enum: SyncRequestType, name: 'SyncRequestType', each: true })
  types!: SyncRequestType[];

  @ValidateBoolean({ optional: true })
  reset?: boolean;
}

export class SyncAckDto {
  @ValidateEnum({ enum: SyncEntityType, name: 'SyncEntityType' })
  type!: SyncEntityType;
  ack!: string;
}

export class SyncAckSetDto {
  @ArrayMaxSize(1000)
  @IsString({ each: true })
  acks!: string[];
}

export class SyncAckDeleteDto {
  @ValidateEnum({ enum: SyncEntityType, name: 'SyncEntityType', optional: true, each: true })
  types?: SyncEntityType[];
}
