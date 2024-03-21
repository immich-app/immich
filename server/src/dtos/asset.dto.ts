import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsPositive,
  IsString,
  ValidateIf,
} from 'class-validator';
import { BulkIdsDto } from 'src/dtos/asset-ids.response.dto';
import { AssetType } from 'src/entities/asset.entity';
import { AssetStats } from 'src/interfaces/asset.interface';
import { Optional, ValidateBoolean, ValidateUUID } from 'src/validation';

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

  @ValidateBoolean({ optional: true })
  isArchived?: boolean;

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
}

export class AssetBulkUpdateDto extends UpdateAssetBase {
  @ValidateUUID({ each: true })
  ids!: string[];

  @ValidateUUID({ optional: true })
  stackParentId?: string;

  @ValidateBoolean({ optional: true })
  removeParent?: boolean;
}

export class UpdateAssetDto extends UpdateAssetBase {
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

export class AssetBulkDeleteDto extends BulkIdsDto {
  @ValidateBoolean({ optional: true })
  force?: boolean;
}

export class AssetIdsDto {
  @ValidateUUID({ each: true })
  assetIds!: string[];
}

export enum AssetJobName {
  REGENERATE_THUMBNAIL = 'regenerate-thumbnail',
  REFRESH_METADATA = 'refresh-metadata',
  TRANSCODE_VIDEO = 'transcode-video',
}

export class AssetJobsDto extends AssetIdsDto {
  @ApiProperty({ enumName: 'AssetJobName', enum: AssetJobName })
  @IsEnum(AssetJobName)
  name!: AssetJobName;
}

export class AssetStatsDto {
  @ValidateBoolean({ optional: true })
  isArchived?: boolean;

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

export const mapStats = (stats: AssetStats): AssetStatsResponseDto => {
  return {
    images: stats[AssetType.IMAGE],
    videos: stats[AssetType.VIDEO],
    total: Object.values(stats).reduce((total, value) => total + value, 0),
  };
};
export enum UploadFieldName {
  ASSET_DATA = 'assetData',
  LIVE_PHOTO_DATA = 'livePhotoData',
  SIDECAR_DATA = 'sidecarData',
  PROFILE_DATA = 'file',
}
