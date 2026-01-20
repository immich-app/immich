import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsObject,
  IsPositive,
  IsString,
  IsTimeZone,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { BulkIdsDto } from 'src/dtos/asset-ids.response.dto';
import { AssetType, AssetVisibility } from 'src/enum';
import { AssetStats } from 'src/repositories/asset.repository';
import { IsNotSiblingOf, Optional, ValidateBoolean, ValidateEnum, ValidateString, ValidateUUID } from 'src/validation';

export class DeviceIdDto {
  @IsNotEmpty()
  @IsString()
  deviceId!: string;
}

const hasGPS = (o: { latitude: undefined; longitude: undefined }) =>
  o.latitude !== undefined || o.longitude !== undefined;
const ValidateGPS = () => ValidateIf(hasGPS);

export class UpdateAssetBase {
  @ValidateBoolean({ optional: true })
  isFavorite?: boolean;

  @ValidateEnum({ enum: AssetVisibility, name: 'AssetVisibility', optional: true })
  visibility?: AssetVisibility;

  @Optional()
  @IsDateString()
  dateTimeOriginal?: string;

  @ValidateGPS()
  @IsLatitude()
  @IsNotEmpty()
  latitude?: number;

  @ValidateGPS()
  @IsLongitude()
  @IsNotEmpty()
  longitude?: number;

  @Optional()
  @IsInt()
  @Max(5)
  @Min(-1)
  rating?: number;

  @Optional()
  @IsString()
  description?: string;
}

export class AssetBulkUpdateDto extends UpdateAssetBase {
  @ValidateUUID({ each: true })
  ids!: string[];

  @Optional()
  duplicateId?: string | null;

  @IsNotSiblingOf(['dateTimeOriginal'])
  @Optional()
  @IsInt()
  dateTimeRelative?: number;

  @IsNotSiblingOf(['dateTimeOriginal'])
  @IsTimeZone()
  @Optional()
  timeZone?: string;
}

export class UpdateAssetDto extends UpdateAssetBase {
  @ValidateUUID({ optional: true, nullable: true })
  livePhotoVideoId?: string | null;
}

export class RandomAssetsDto {
  @Optional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  count?: number;
}

export class AssetBulkDeleteDto extends BulkIdsDto {
  @ValidateBoolean({ optional: true })
  force?: boolean;
}

export class AssetIdsDto {
  @ValidateUUID({ each: true })
  assetIds!: string[];
}

export enum AssetJobName {
  REFRESH_FACES = 'refresh-faces',
  REFRESH_METADATA = 'refresh-metadata',
  REGENERATE_THUMBNAIL = 'regenerate-thumbnail',
  TRANSCODE_VIDEO = 'transcode-video',
}

export class AssetJobsDto extends AssetIdsDto {
  @ValidateEnum({ enum: AssetJobName, name: 'AssetJobName' })
  name!: AssetJobName;
}

export class AssetStatsDto {
  @ValidateEnum({ enum: AssetVisibility, name: 'AssetVisibility', optional: true })
  visibility?: AssetVisibility;

  @ValidateBoolean({ optional: true })
  isFavorite?: boolean;

  @ValidateBoolean({ optional: true })
  isTrashed?: boolean;
}

export class AssetStatsResponseDto {
  @ApiProperty({ type: 'integer' })
  images!: number;

  @ApiProperty({ type: 'integer' })
  videos!: number;

  @ApiProperty({ type: 'integer' })
  total!: number;
}

export class AssetMetadataRouteParams {
  @ValidateUUID()
  id!: string;

  @ValidateString()
  key!: string;
}

export class AssetMetadataUpsertDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssetMetadataUpsertItemDto)
  items!: AssetMetadataUpsertItemDto[];
}

export class AssetMetadataUpsertItemDto {
  @ValidateString()
  key!: string;

  @IsObject()
  value!: object;
}

export class AssetMetadataBulkUpsertDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssetMetadataBulkUpsertItemDto)
  items!: AssetMetadataBulkUpsertItemDto[];
}

export class AssetMetadataBulkUpsertItemDto {
  @ValidateUUID()
  assetId!: string;

  @ValidateString()
  key!: string;

  @IsObject()
  value!: object;
}

export class AssetMetadataBulkDeleteDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssetMetadataBulkDeleteItemDto)
  items!: AssetMetadataBulkDeleteItemDto[];
}

export class AssetMetadataBulkDeleteItemDto {
  @ValidateUUID()
  assetId!: string;

  @ValidateString()
  key!: string;
}

export class AssetMetadataResponseDto {
  @ValidateString()
  key!: string;
  value!: object;
  updatedAt!: Date;
}

export class AssetMetadataBulkResponseDto extends AssetMetadataResponseDto {
  assetId!: string;
}

export class AssetCopyDto {
  @ValidateUUID()
  sourceId!: string;

  @ValidateUUID()
  targetId!: string;

  @ValidateBoolean({ optional: true, default: true })
  sharedLinks?: boolean;

  @ValidateBoolean({ optional: true, default: true })
  albums?: boolean;

  @ValidateBoolean({ optional: true, default: true })
  sidecar?: boolean;

  @ValidateBoolean({ optional: true, default: true })
  stack?: boolean;

  @ValidateBoolean({ optional: true, default: true })
  favorite?: boolean;
}

export class AssetDownloadOriginalDto {
  @ValidateBoolean({ optional: true, default: false })
  edited?: boolean;
}

export const mapStats = (stats: AssetStats): AssetStatsResponseDto => {
  return {
    images: stats[AssetType.Image],
    videos: stats[AssetType.Video],
    total: Object.values(stats).reduce((total, value) => total + value, 0),
  };
};
