/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, IsEnum, IsInt, IsPositive, IsString } from 'class-validator';
import { AssetResponseDto } from 'src/dtos/asset-response.dto';
import {
  AlbumUserRole,
  AssetOrder,
  AssetType,
  AssetVisibility,
  MemoryType,
  SyncEntityType,
  SyncRequestType,
} from 'src/enum';
import { Optional, ValidateDate, ValidateUUID } from 'src/validation';

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
  deletedAt!: Date | null;
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
  @ApiProperty({ enumName: 'AssetTypeEnum', enum: AssetType })
  type!: AssetType;
  deletedAt!: Date | null;
  isFavorite!: boolean;
  @ApiProperty({ enumName: 'AssetVisibility', enum: AssetVisibility })
  visibility!: AssetVisibility;
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
  @ApiProperty({ enumName: 'AlbumUserRole', enum: AlbumUserRole })
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
  @ApiProperty({ enumName: 'AssetOrder', enum: AssetOrder })
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
  @ApiProperty({ enumName: 'MemoryType', enum: MemoryType })
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
export class SyncAckV1 {}

export type SyncItem = {
  [SyncEntityType.UserV1]: SyncUserV1;
  [SyncEntityType.UserDeleteV1]: SyncUserDeleteV1;
  [SyncEntityType.PartnerV1]: SyncPartnerV1;
  [SyncEntityType.PartnerDeleteV1]: SyncPartnerDeleteV1;
  [SyncEntityType.AssetV1]: SyncAssetV1;
  [SyncEntityType.AssetDeleteV1]: SyncAssetDeleteV1;
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
  [SyncEntityType.AlbumAssetV1]: SyncAssetV1;
  [SyncEntityType.AlbumAssetBackfillV1]: SyncAssetV1;
  [SyncEntityType.AlbumAssetExifV1]: SyncAssetExifV1;
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
  [SyncEntityType.SyncAckV1]: SyncAckV1;
};

export class SyncStreamDto {
  @IsEnum(SyncRequestType, { each: true })
  @ApiProperty({ enumName: 'SyncRequestType', enum: SyncRequestType, isArray: true })
  types!: SyncRequestType[];
}

export class SyncAckDto {
  @ApiProperty({ enumName: 'SyncEntityType', enum: SyncEntityType })
  type!: SyncEntityType;
  ack!: string;
}

export class SyncAckSetDto {
  @ArrayMaxSize(1000)
  @IsString({ each: true })
  acks!: string[];
}

export class SyncAckDeleteDto {
  @IsEnum(SyncEntityType, { each: true })
  @ApiProperty({ enumName: 'SyncEntityType', enum: SyncEntityType, isArray: true })
  @Optional()
  types?: SyncEntityType[];
}
