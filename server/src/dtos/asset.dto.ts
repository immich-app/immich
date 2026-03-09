import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
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
import { HistoryBuilder, Property } from 'src/decorators';
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
  @ValidateBoolean({ optional: true, description: 'Mark as favorite' })
  isFavorite?: boolean;

  @ValidateEnum({ enum: AssetVisibility, name: 'AssetVisibility', optional: true, description: 'Asset visibility' })
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

  @Property({
    description: 'Rating in range [1-5], or null for unrated',
    history: new HistoryBuilder()
      .added('v1')
      .stable('v2')
      .updated('v2.6.0', 'Using -1 as a rating is deprecated and will be removed in the next major version.'),
  })
  @Optional({ nullable: true })
  @IsInt()
  @Max(5)
  @Min(-1)
  @Transform(({ value }) => (value === 0 ? null : value))
  rating?: number | null;

  @ApiProperty({ description: 'Asset description' })
  @Optional()
  @IsString()
  description?: string;
}

export class AssetBulkUpdateDto extends UpdateAssetBase {
  @ValidateUUID({ each: true, description: 'Asset IDs to update' })
  ids!: string[];

  @ValidateString({ optional: true, nullable: true, description: 'Duplicate ID' })
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
  @ValidateUUID({ optional: true, nullable: true, description: 'Live photo video ID' })
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
  @ValidateBoolean({ optional: true, description: 'Force delete even if in use' })
  force?: boolean;
}

export class AssetIdsDto {
  @ValidateUUID({ each: true, description: 'Asset IDs' })
  assetIds!: string[];
}

export enum AssetJobName {
  REFRESH_FACES = 'refresh-faces',
  REFRESH_METADATA = 'refresh-metadata',
  REGENERATE_THUMBNAIL = 'regenerate-thumbnail',
  TRANSCODE_VIDEO = 'transcode-video',
}

export class AssetJobsDto extends AssetIdsDto {
  @ValidateEnum({ enum: AssetJobName, name: 'AssetJobName', description: 'Job name' })
  name!: AssetJobName;
}

export class AssetStatsDto {
  @ValidateEnum({ enum: AssetVisibility, name: 'AssetVisibility', description: 'Filter by visibility', optional: true })
  visibility?: AssetVisibility;

  @ValidateBoolean({ optional: true, description: 'Filter by favorite status' })
  isFavorite?: boolean;

  @ValidateBoolean({ optional: true, description: 'Filter by trash status' })
  isTrashed?: boolean;
}

export class AssetStatsResponseDto {
  @ApiProperty({ description: 'Number of images', type: 'integer' })
  images!: number;

  @ApiProperty({ description: 'Number of videos', type: 'integer' })
  videos!: number;

  @ApiProperty({ description: 'Total number of assets', type: 'integer' })
  total!: number;
}

export class AssetMetadataRouteParams {
  @ValidateUUID({ description: 'Asset ID' })
  id!: string;

  @ValidateString({ description: 'Metadata key' })
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
  @ValidateString({ description: 'Metadata key' })
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
  @ValidateUUID({ description: 'Asset ID' })
  assetId!: string;

  @ValidateString({ description: 'Metadata key' })
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
  @ValidateUUID({ description: 'Asset ID' })
  assetId!: string;

  @ValidateString({ description: 'Metadata key' })
  key!: string;
}

export class AssetMetadataResponseDto {
  @ValidateString({ description: 'Metadata key' })
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
  @ValidateUUID({ description: 'Source asset ID' })
  sourceId!: string;

  @ValidateUUID({ description: 'Target asset ID' })
  targetId!: string;

  @ValidateBoolean({ optional: true, description: 'Copy shared links', default: true })
  sharedLinks?: boolean;

  @ValidateBoolean({ optional: true, description: 'Copy album associations', default: true })
  albums?: boolean;

  @ValidateBoolean({ optional: true, description: 'Copy sidecar file', default: true })
  sidecar?: boolean;

  @ValidateBoolean({ optional: true, description: 'Copy stack association', default: true })
  stack?: boolean;

  @ValidateBoolean({ optional: true, description: 'Copy favorite status', default: true })
  favorite?: boolean;
}

export class AssetDownloadOriginalDto {
  @ValidateBoolean({ optional: true, description: 'Return edited asset if available', default: false })
  edited?: boolean;
}

export const mapStats = (stats: AssetStats): AssetStatsResponseDto => {
  return {
    images: stats[AssetType.Image],
    videos: stats[AssetType.Video],
    total: Object.values(stats).reduce((total, value) => total + value, 0),
  };
};
