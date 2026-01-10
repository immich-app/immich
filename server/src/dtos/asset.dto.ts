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
  @ApiPropertyOptional({ description: 'Mark as favorite' })
  @ValidateBoolean({ optional: true })
  isFavorite?: boolean;

  @ApiPropertyOptional({ description: 'Asset visibility', enum: AssetVisibility })
  @ValidateEnum({ enum: AssetVisibility, name: 'AssetVisibility', optional: true })
  visibility?: AssetVisibility;

  @ApiPropertyOptional({ description: 'Original date and time' })
  @Optional()
  @IsDateString()
  dateTimeOriginal?: string;

  @ApiPropertyOptional({ description: 'Latitude coordinate' })
  @ValidateGPS()
  @IsLatitude()
  @IsNotEmpty()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude coordinate' })
  @ValidateGPS()
  @IsLongitude()
  @IsNotEmpty()
  longitude?: number;

  @ApiPropertyOptional({ description: 'Rating (-1 to 5)' })
  @Optional()
  @IsInt()
  @Max(5)
  @Min(-1)
  rating?: number;

  @ApiPropertyOptional({ description: 'Asset description' })
  @Optional()
  @IsString()
  description?: string;
}

export class AssetBulkUpdateDto extends UpdateAssetBase {
  @ApiProperty({ description: 'Asset IDs to update', type: [String] })
  @ValidateUUID({ each: true })
  ids!: string[];

  @ApiPropertyOptional({ description: 'Duplicate asset ID', nullable: true })
  @Optional()
  duplicateId?: string | null;

  @ApiPropertyOptional({ description: 'Relative time offset in seconds' })
  @IsNotSiblingOf(['dateTimeOriginal'])
  @Optional()
  @IsInt()
  dateTimeRelative?: number;

  @ApiPropertyOptional({ description: 'Time zone (IANA timezone)' })
  @IsNotSiblingOf(['dateTimeOriginal'])
  @IsTimeZone()
  @Optional()
  timeZone?: string;
}

export class UpdateAssetDto extends UpdateAssetBase {
  @ApiPropertyOptional({ description: 'Live photo video ID', nullable: true })
  @ValidateUUID({ optional: true, nullable: true })
  livePhotoVideoId?: string | null;
}

export class RandomAssetsDto {
  @ApiPropertyOptional({ description: 'Number of random assets to return' })
  @Optional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  count?: number;
}

export class AssetBulkDeleteDto extends BulkIdsDto {
  @ApiPropertyOptional({ description: 'Force delete even if in use' })
  @ValidateBoolean({ optional: true })
  force?: boolean;
}

export class AssetIdsDto {
  @ApiProperty({ description: 'Asset IDs', type: [String] })
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
  @ApiProperty({ description: 'Job name', enum: AssetJobName })
  @ValidateEnum({ enum: AssetJobName, name: 'AssetJobName' })
  name!: AssetJobName;
}

export class AssetStatsDto {
  @ApiPropertyOptional({ description: 'Filter by visibility', enum: AssetVisibility })
  @ValidateEnum({ enum: AssetVisibility, name: 'AssetVisibility', optional: true })
  visibility?: AssetVisibility;

  @ApiPropertyOptional({ description: 'Filter by favorite status' })
  @ValidateBoolean({ optional: true })
  isFavorite?: boolean;

  @ApiPropertyOptional({ description: 'Filter by trash status' })
  @ValidateBoolean({ optional: true })
  isTrashed?: boolean;
}

export class AssetStatsResponseDto {
  @ApiProperty({ type: 'integer', description: 'Number of images' })
  images!: number;

  @ApiProperty({ type: 'integer', description: 'Number of videos' })
  videos!: number;

  @ApiProperty({ type: 'integer', description: 'Total number of assets' })
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
  @ApiProperty({ description: 'Metadata items to upsert', type: () => [AssetMetadataUpsertItemDto] })
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
  @ApiProperty({ description: 'Metadata items to upsert', type: () => [AssetMetadataBulkUpsertItemDto] })
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
  @ApiProperty({ description: 'Metadata items to delete', type: () => [AssetMetadataBulkDeleteItemDto] })
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

  @ApiPropertyOptional({ description: 'Copy shared links', default: true })
  @ValidateBoolean({ optional: true, default: true })
  sharedLinks?: boolean;

  @ApiPropertyOptional({ description: 'Copy album associations', default: true })
  @ValidateBoolean({ optional: true, default: true })
  albums?: boolean;

  @ApiPropertyOptional({ description: 'Copy sidecar file', default: true })
  @ValidateBoolean({ optional: true, default: true })
  sidecar?: boolean;

  @ApiPropertyOptional({ description: 'Copy stack association', default: true })
  @ValidateBoolean({ optional: true, default: true })
  stack?: boolean;

  @ApiPropertyOptional({ description: 'Copy favorite status', default: true })
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
