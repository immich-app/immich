import { AssetType } from '@app/infra/entities';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsPositive, IsString, Min } from 'class-validator';
import { Optional, QueryBoolean, QueryDate, ValidateUUID } from '../../domain.util';
import { BulkIdsDto } from '../response-dto';

export enum AssetOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class AssetSearchDto {
  @ValidateUUID({ optional: true })
  id?: string;

  @ValidateUUID({ optional: true })
  libraryId?: string;

  @IsString()
  @Optional()
  deviceAssetId?: string;

  @IsString()
  @Optional()
  deviceId?: string;

  @IsEnum(AssetType)
  @Optional()
  @ApiProperty({ enumName: 'AssetTypeEnum', enum: AssetType })
  type?: AssetType;

  @IsString()
  @Optional()
  checksum?: string;

  @QueryBoolean({ optional: true })
  isArchived?: boolean;

  @QueryBoolean({ optional: true })
  isEncoded?: boolean;

  @QueryBoolean({ optional: true })
  isExternal?: boolean;

  @QueryBoolean({ optional: true })
  isFavorite?: boolean;

  @QueryBoolean({ optional: true })
  isMotion?: boolean;

  @QueryBoolean({ optional: true })
  isOffline?: boolean;

  @QueryBoolean({ optional: true })
  isReadOnly?: boolean;

  @QueryBoolean({ optional: true })
  isVisible?: boolean;

  @QueryBoolean({ optional: true })
  withDeleted?: boolean;

  @QueryBoolean({ optional: true })
  withStacked?: boolean;

  @QueryBoolean({ optional: true })
  withExif?: boolean;

  @QueryBoolean({ optional: true })
  withPeople?: boolean;

  @QueryDate({ optional: true })
  createdBefore?: Date;

  @QueryDate({ optional: true })
  createdAfter?: Date;

  @QueryDate({ optional: true })
  updatedBefore?: Date;

  @QueryDate({ optional: true })
  updatedAfter?: Date;

  @QueryDate({ optional: true })
  trashedBefore?: Date;

  @QueryDate({ optional: true })
  trashedAfter?: Date;

  @QueryDate({ optional: true })
  takenBefore?: Date;

  @QueryDate({ optional: true })
  takenAfter?: Date;

  @IsString()
  @Optional()
  originalFileName?: string;

  @IsString()
  @Optional()
  originalPath?: string;

  @IsString()
  @Optional()
  resizePath?: string;

  @IsString()
  @Optional()
  webpPath?: string;

  @IsString()
  @Optional()
  encodedVideoPath?: string;

  @IsString()
  @Optional()
  city?: string;

  @IsString()
  @Optional()
  state?: string;

  @IsString()
  @Optional()
  country?: string;

  @IsString()
  @Optional()
  make?: string;

  @IsString()
  @Optional()
  model?: string;

  @IsString()
  @Optional()
  lensModel?: string;

  @IsEnum(AssetOrder)
  @Optional()
  @ApiProperty({ enumName: 'AssetOrder', enum: AssetOrder })
  order?: AssetOrder;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  @Optional()
  page?: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  @Optional()
  size?: number;
}

export class AssetBulkUpdateDto extends BulkIdsDto {
  @Optional()
  @IsBoolean()
  isFavorite?: boolean;

  @Optional()
  @IsBoolean()
  isArchived?: boolean;

  @Optional()
  @ValidateUUID()
  stackParentId?: string;

  @Optional()
  @IsBoolean()
  removeParent?: boolean;
}

export class UpdateAssetDto {
  @Optional()
  @IsBoolean()
  isFavorite?: boolean;

  @Optional()
  @IsBoolean()
  isArchived?: boolean;

  @Optional()
  @IsString()
  description?: string;
}

export class RandomAssetsDto {
  @Optional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  count?: number;
}

export enum TrashAction {
  EMPTY_ALL = 'empty-all',
  RESTORE_ALL = 'restore-all',
}

export class AssetBulkDeleteDto extends BulkIdsDto {
  @Optional()
  @IsBoolean()
  force?: boolean;
}
