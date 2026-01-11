import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
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

@ApiSchema({ description: 'Device ID request parameter' })
export class DeviceIdDto {
  /** Device ID */
  @IsNotEmpty()
  @IsString()
  deviceId!: string;
}

const hasGPS = (o: { latitude: undefined; longitude: undefined }) =>
  o.latitude !== undefined || o.longitude !== undefined;
const ValidateGPS = () => ValidateIf(hasGPS);

@ApiSchema({ description: 'Base asset update fields' })
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

@ApiSchema({ description: 'Bulk asset update request with IDs and update fields' })
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

@ApiSchema({ description: 'Asset update request with optional live photo video ID' })
export class UpdateAssetDto extends UpdateAssetBase {
  /** Live photo video ID */
  @ApiPropertyOptional({ nullable: true })
  @ValidateUUID({ optional: true, nullable: true })
  livePhotoVideoId?: string | null;
}

@ApiSchema({ description: 'Random assets query parameters' })
export class RandomAssetsDto {
  /** Number of random assets to return */
  @Optional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  count?: number;
}

@ApiSchema({ description: 'Bulk asset delete request with IDs and optional force flag' })
export class AssetBulkDeleteDto extends BulkIdsDto {
  /** Force delete even if in use */
  @ValidateBoolean({ optional: true })
  force?: boolean;
}

@ApiSchema({ description: 'Asset IDs request parameter' })
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

@ApiSchema({ description: 'Asset job request with IDs and job name' })
export class AssetJobsDto extends AssetIdsDto {
  /** Job name */
  @ValidateEnum({ enum: AssetJobName, name: 'AssetJobName' })
  name!: AssetJobName;
}

@ApiSchema({ description: 'Asset statistics query parameters' })
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

@ApiSchema({ description: 'Asset statistics response with counts' })
export class AssetStatsResponseDto {
  /** Number of images */
  images!: number;

  /** Number of videos */
  videos!: number;

  /** Total number of assets */
  total!: number;
}

@ApiSchema({ description: 'Asset metadata route parameters' })
export class AssetMetadataRouteParams {
  /** Asset ID */
  @ValidateUUID()
  id!: string;

  /** Metadata key */
  @ValidateString()
  key!: string;
}

@ApiSchema({ description: 'Asset metadata upsert request' })
export class AssetMetadataUpsertDto {
  /** Metadata items to upsert */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssetMetadataUpsertItemDto)
  items!: AssetMetadataUpsertItemDto[];
}

@ApiSchema({ description: 'Asset metadata upsert item with key and value' })
export class AssetMetadataUpsertItemDto {
  /** Metadata key */
  @ValidateString()
  key!: string;

  /** Metadata value (object) */
  @IsObject()
  value!: object;
}

@ApiSchema({ description: 'Bulk asset metadata upsert request' })
export class AssetMetadataBulkUpsertDto {
  /** Metadata items to upsert */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssetMetadataBulkUpsertItemDto)
  items!: AssetMetadataBulkUpsertItemDto[];
}

@ApiSchema({ description: 'Bulk asset metadata upsert item with asset ID, key, and value' })
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

@ApiSchema({ description: 'Bulk asset metadata delete request' })
export class AssetMetadataBulkDeleteDto {
  /** Metadata items to delete */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssetMetadataBulkDeleteItemDto)
  items!: AssetMetadataBulkDeleteItemDto[];
}

@ApiSchema({ description: 'Bulk asset metadata delete item with asset ID and key' })
export class AssetMetadataBulkDeleteItemDto {
  /** Asset ID */
  @ValidateUUID()
  assetId!: string;

  /** Metadata key */
  @ValidateString()
  key!: string;
}

@ApiSchema({ description: 'Asset metadata response with key value' })
export class AssetMetadataResponseDto {
  /** Metadata key */
  @ValidateString()
  key!: string;

  /** Metadata value (object) */
  value!: object;

  /** Last update date */
  updatedAt!: Date;
}

@ApiSchema({ description: 'Bulk asset metadata response with asset ID' })
export class AssetMetadataBulkResponseDto extends AssetMetadataResponseDto {
  /** Asset ID */
  assetId!: string;
}

@ApiSchema({ description: 'Asset copy request with source, target, and copy options' })
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

@ApiSchema({ description: 'Asset download original query parameters' })
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
