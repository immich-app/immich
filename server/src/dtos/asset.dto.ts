import { ApiPropertyOptional } from '@nestjs/swagger';
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
  /** Device ID */
  @IsNotEmpty()
  @IsString()
  deviceId!: string;
}

const hasGPS = (o: { latitude: undefined; longitude: undefined }) =>
  o.latitude !== undefined || o.longitude !== undefined;
const ValidateGPS = () => ValidateIf(hasGPS);

export class UpdateAssetBase {
  /** Mark as favorite */
  @ValidateBoolean({ optional: true })
  isFavorite?: boolean;

  /** Asset visibility */
  @ValidateEnum({ enum: AssetVisibility, name: 'AssetVisibility', optional: true })
  visibility?: AssetVisibility;

  /** Original date and time */
  @Optional()
  @IsDateString()
  dateTimeOriginal?: string;

  /** Latitude coordinate */
  @ValidateGPS()
  @IsLatitude()
  @IsNotEmpty()
  latitude?: number;

  /** Longitude coordinate */
  @ValidateGPS()
  @IsLongitude()
  @IsNotEmpty()
  longitude?: number;

  /** Rating (-1 to 5) */
  @Optional()
  @IsInt()
  @Max(5)
  @Min(-1)
  rating?: number;

  /** Asset description */
  @Optional()
  @IsString()
  description?: string;
}

export class AssetBulkUpdateDto extends UpdateAssetBase {
  /** Asset IDs to update */
  @ValidateUUID({ each: true })
  ids!: string[];

  /** Duplicate asset ID */
  @Optional()
  duplicateId?: string | null;

  /** Relative time offset in seconds */
  @IsNotSiblingOf(['dateTimeOriginal'])
  @Optional()
  @IsInt()
  dateTimeRelative?: number;

  /** Time zone (IANA timezone) */
  @IsNotSiblingOf(['dateTimeOriginal'])
  @IsTimeZone()
  @Optional()
  timeZone?: string;
}

export class UpdateAssetDto extends UpdateAssetBase {
  /** Live photo video ID */
  @ApiPropertyOptional({ nullable: true })
  @ValidateUUID({ optional: true, nullable: true })
  livePhotoVideoId?: string | null;
}

export class RandomAssetsDto {
  /** Number of random assets to return */
  @Optional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  count?: number;
}

export class AssetBulkDeleteDto extends BulkIdsDto {
  /** Force delete even if in use */
  @ValidateBoolean({ optional: true })
  force?: boolean;
}

export class AssetIdsDto {
  /** Asset IDs */
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
  /** Job name */
  @ValidateEnum({ enum: AssetJobName, name: 'AssetJobName' })
  name!: AssetJobName;
}

export class AssetStatsDto {
  /** Filter by visibility */
  @ApiPropertyOptional({ enum: AssetVisibility })
  @ValidateEnum({ enum: AssetVisibility, name: 'AssetVisibility', optional: true })
  visibility?: AssetVisibility;

  /** Filter by favorite status */
  @ValidateBoolean({ optional: true })
  isFavorite?: boolean;

  /** Filter by trash status */
  @ValidateBoolean({ optional: true })
  isTrashed?: boolean;
}

export class AssetStatsResponseDto {
  /** Number of images */
  images!: number;

  /** Number of videos */
  videos!: number;

  /** Total number of assets */
  total!: number;
}

export class AssetMetadataRouteParams {
  /** Asset ID */
  @ValidateUUID()
  id!: string;

  /** Metadata key */
  @ValidateString()
  key!: string;
}

export class AssetMetadataUpsertDto {
  /** Metadata items to upsert */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssetMetadataUpsertItemDto)
  items!: AssetMetadataUpsertItemDto[];
}

export class AssetMetadataUpsertItemDto {
  /** Metadata key */
  @ValidateString()
  key!: string;

  /** Metadata value (object) */
  @IsObject()
  value!: object;
}

export class AssetMetadataBulkUpsertDto {
  /** Metadata items to upsert */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssetMetadataBulkUpsertItemDto)
  items!: AssetMetadataBulkUpsertItemDto[];
}

export class AssetMetadataBulkUpsertItemDto {
  /** Asset ID */
  @ValidateUUID()
  assetId!: string;

  /** Metadata key */
  @ValidateString()
  key!: string;

  /** Metadata value (object) */
  @IsObject()
  value!: object;
}

export class AssetMetadataBulkDeleteDto {
  /** Metadata items to delete */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssetMetadataBulkDeleteItemDto)
  items!: AssetMetadataBulkDeleteItemDto[];
}

export class AssetMetadataBulkDeleteItemDto {
  /** Asset ID */
  @ValidateUUID()
  assetId!: string;

  /** Metadata key */
  @ValidateString()
  key!: string;
}

export class AssetMetadataResponseDto {
  /** Metadata key */
  @ValidateString()
  key!: string;

  /** Metadata value (object) */
  value!: object;

  /** Last update date */
  updatedAt!: Date;
}

export class AssetMetadataBulkResponseDto extends AssetMetadataResponseDto {
  /** Asset ID */
  assetId!: string;
}

export class AssetCopyDto {
  /** Source asset ID */
  @ValidateUUID()
  sourceId!: string;

  /** Target asset ID */
  @ValidateUUID()
  targetId!: string;

  /** Copy shared links */
  @ValidateBoolean({ optional: true, default: true })
  sharedLinks?: boolean;

  /** Copy album associations */
  @ValidateBoolean({ optional: true, default: true })
  albums?: boolean;

  /** Copy sidecar file */
  @ValidateBoolean({ optional: true, default: true })
  sidecar?: boolean;

  /** Copy stack association */
  @ValidateBoolean({ optional: true, default: true })
  stack?: boolean;

  /** Copy favorite status */
  @ValidateBoolean({ optional: true, default: true })
  favorite?: boolean;
}

export class AssetDownloadOriginalDto {
  /** Return edited asset if available */
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
