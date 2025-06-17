import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsPositive, IsString } from 'class-validator';
import { AssetResponseDto } from 'src/dtos/asset-response.dto';
import { AlbumUserRole, AssetOrder, AssetType, AssetVisibility, SyncEntityType, SyncRequestType } from 'src/enum';
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

export class SyncUserV1 {
  id!: string;
  name!: string;
  email!: string;
  deletedAt!: Date | null;
}

export class SyncUserDeleteV1 {
  userId!: string;
}

export class SyncPartnerV1 {
  sharedById!: string;
  sharedWithId!: string;
  inTimeline!: boolean;
}

export class SyncPartnerDeleteV1 {
  sharedById!: string;
  sharedWithId!: string;
}

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

export class SyncAssetDeleteV1 {
  assetId!: string;
}

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
  @ApiProperty({ type: 'integer' })
  latitude!: number | null;
  @ApiProperty({ type: 'integer' })
  longitude!: number | null;
  projectionType!: string | null;
  city!: string | null;
  state!: string | null;
  country!: string | null;
  make!: string | null;
  model!: string | null;
  lensModel!: string | null;
  @ApiProperty({ type: 'integer' })
  fNumber!: number | null;
  @ApiProperty({ type: 'integer' })
  focalLength!: number | null;
  @ApiProperty({ type: 'integer' })
  iso!: number | null;
  exposureTime!: string | null;
  profileDescription!: string | null;
  @ApiProperty({ type: 'integer' })
  rating!: number | null;
  @ApiProperty({ type: 'integer' })
  fps!: number | null;
}

export class SyncAlbumDeleteV1 {
  albumId!: string;
}

export class SyncAlbumUserDeleteV1 {
  albumId!: string;
  userId!: string;
}

export class SyncAlbumUserV1 {
  albumId!: string;
  userId!: string;
  @ApiProperty({ enumName: 'AlbumUserRole', enum: AlbumUserRole })
  role!: AlbumUserRole;
}

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
  [SyncEntityType.AlbumUserDeleteV1]: SyncAlbumUserDeleteV1;
  [SyncEntityType.SyncAckV1]: object;
};

const responseDtos = [
  SyncUserV1,
  SyncUserDeleteV1,
  SyncPartnerV1,
  SyncPartnerDeleteV1,
  SyncAssetV1,
  SyncAssetDeleteV1,
  SyncAssetExifV1,
  SyncAlbumV1,
  SyncAlbumDeleteV1,
  SyncAlbumUserV1,
  SyncAlbumUserDeleteV1,
];

export const extraSyncModels = responseDtos;

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
  @IsString({ each: true })
  acks!: string[];
}

export class SyncAckDeleteDto {
  @IsEnum(SyncEntityType, { each: true })
  @ApiProperty({ enumName: 'SyncEntityType', enum: SyncEntityType, isArray: true })
  @Optional()
  types?: SyncEntityType[];
}
