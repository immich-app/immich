import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty({ description: 'Device ID' })
  @IsNotEmpty()
  @IsString()
  deviceId!: string;
}

const hasGPS = (o: { latitude: undefined; longitude: undefined }) =>
  o.latitude !== undefined || o.longitude !== undefined;
const ValidateGPS = () => ValidateIf(hasGPS);

export class UpdateAssetBase {
  @ApiProperty({ description: 'Mark as favorite' })
  @ValidateBoolean({ optional: true })
  isFavorite?: boolean;

  @ApiProperty({ description: 'Asset visibility' })
  @ValidateEnum({ enum: AssetVisibility, name: 'AssetVisibility', optional: true })
  visibility?: AssetVisibility;

  @ApiProperty({ description: 'Original date and time' })
  @Optional()
  @IsDateString()
  dateTimeOriginal?: string;

  @ApiProperty({ description: 'Latitude coordinate' })
  @ValidateGPS()
  @IsLatitude()
  @IsNotEmpty()
  latitude?: number;

  @ApiProperty({ description: 'Longitude coordinate' })
  @ValidateGPS()
  @IsLongitude()
  @IsNotEmpty()
  longitude?: number;

  @ApiProperty({ description: 'Rating (-1 to 5)' })
  @Optional()
  @IsInt()
  @Max(5)
  @Min(-1)
  rating?: number;

  @ApiProperty({ description: 'Asset description' })
  @Optional()
  @IsString()
  description?: string;
}

export class AssetBulkUpdateDto extends UpdateAssetBase {
  @ApiProperty({ description: 'Asset IDs to update' })
  @ValidateUUID({ each: true })
  ids!: string[];

  @ApiProperty({ description: 'Duplicate asset ID' })
  @Optional()
  duplicateId?: string | null;

  @ApiProperty({ description: 'Relative time offset in seconds' })
  @IsNotSiblingOf(['dateTimeOriginal'])
  @Optional()
  @IsInt()
  dateTimeRelative?: number;

  @ApiProperty({ description: 'Time zone (IANA timezone)' })
  @IsNotSiblingOf(['dateTimeOriginal'])
  @IsTimeZone()
  @Optional()
  timeZone?: string;
}

export class UpdateAssetDto extends UpdateAssetBase {
  @ApiProperty({ description: 'Live photo video ID', nullable: true })
  @ValidateUUID({ optional: true, nullable: true })
  livePhotoVideoId?: string | null;
}

export class RandomAssetsDto {
  @ApiProperty({ description: 'Number of random assets to return' })
  @Optional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  count?: number;
}

export class AssetBulkDeleteDto extends BulkIdsDto {
  @ApiProperty({ description: 'Force delete even if in use' })
  @ValidateBoolean({ optional: true })
  force?: boolean;
}

export class AssetIdsDto {
  @ApiProperty({ description: 'Asset IDs' })
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
  @ApiProperty({ description: 'Job name' })
  @ValidateEnum({ enum: AssetJobName, name: 'AssetJobName' })
  name!: AssetJobName;
}

export class AssetStatsDto {
  @ApiProperty({ description: 'Filter by visibility' })
  @ApiPropertyOptional({ enum: AssetVisibility })
  @ValidateEnum({ enum: AssetVisibility, name: 'AssetVisibility', optional: true })
  visibility?: AssetVisibility;

  @ApiProperty({ description: 'Filter by favorite status' })
  @ValidateBoolean({ optional: true })
  isFavorite?: boolean;

  @ApiProperty({ description: 'Filter by trash status' })
  @ValidateBoolean({ optional: true })
  isTrashed?: boolean;
}

export class AssetStatsResponseDto {
  @ApiProperty({ description: 'Number of images' })
  images!: number;

  @ApiProperty({ description: 'Number of videos' })
  videos!: number;

  @ApiProperty({ description: 'Total number of assets' })
  total!: number;
}

export class AssetMetadataRouteParams {
  @ApiProperty({ description: 'Asset ID' })
  @ValidateUUID()
  id!: string;

  @ApiProperty({ description: 'Metadata key' })
  @ValidateString()
  key!: string;
}

export class AssetMetadataUpsertDto {
  @ApiProperty({ description: 'Metadata items to upsert' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssetMetadataUpsertItemDto)
  items!: AssetMetadataUpsertItemDto[];
}

export class AssetMetadataUpsertItemDto {
  @ApiProperty({ description: 'Metadata key' })
  @ValidateString()
  key!: string;

  @ApiProperty({ description: 'Metadata value (object)' })
  @IsObject()
  value!: object;
}

export class AssetMetadataBulkUpsertDto {
  @ApiProperty({ description: 'Metadata items to upsert' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssetMetadataBulkUpsertItemDto)
  items!: AssetMetadataBulkUpsertItemDto[];
}

export class AssetMetadataBulkUpsertItemDto {
  @ApiProperty({ description: 'Asset ID' })
  @ValidateUUID()
  assetId!: string;

  @ApiProperty({ description: 'Metadata key' })
  @ValidateString()
  key!: string;

  @ApiProperty({ description: 'Metadata value (object)' })
  @IsObject()
  value!: object;
}

export class AssetMetadataBulkDeleteDto {
  @ApiProperty({ description: 'Metadata items to delete' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssetMetadataBulkDeleteItemDto)
  items!: AssetMetadataBulkDeleteItemDto[];
}

export class AssetMetadataBulkDeleteItemDto {
  @ApiProperty({ description: 'Asset ID' })
  @ValidateUUID()
  assetId!: string;

  @ApiProperty({ description: 'Metadata key' })
  @ValidateString()
  key!: string;
}

export class AssetMetadataResponseDto {
  @ApiProperty({ description: 'Metadata key' })
  @ValidateString()
  key!: string;

  @ApiProperty({ description: 'Metadata value (object)' })
  value!: object;

  @ApiProperty({ description: 'Last update date' })
  updatedAt!: Date;
}

export class AssetMetadataBulkResponseDto extends AssetMetadataResponseDto {
  @ApiProperty({ description: 'Asset ID' })
  assetId!: string;
}

export class AssetCopyDto {
  @ApiProperty({ description: 'Source asset ID' })
  @ValidateUUID()
  sourceId!: string;

  @ApiProperty({ description: 'Target asset ID' })
  @ValidateUUID()
  targetId!: string;

  @ApiProperty({ description: 'Copy shared links' })
  @ValidateBoolean({ optional: true, default: true })
  sharedLinks?: boolean;

  @ApiProperty({ description: 'Copy album associations' })
  @ValidateBoolean({ optional: true, default: true })
  albums?: boolean;

  @ApiProperty({ description: 'Copy sidecar file' })
  @ValidateBoolean({ optional: true, default: true })
  sidecar?: boolean;

  @ApiProperty({ description: 'Copy stack association' })
  @ValidateBoolean({ optional: true, default: true })
  stack?: boolean;

  @ApiProperty({ description: 'Copy favorite status' })
  @ValidateBoolean({ optional: true, default: true })
  favorite?: boolean;
}

export class AssetDownloadOriginalDto {
  @ApiProperty({ description: 'Return edited asset if available' })
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
