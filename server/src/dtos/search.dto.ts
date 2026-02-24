import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';
import { Place } from 'src/database';
import { HistoryBuilder, Property } from 'src/decorators';
import { AlbumResponseDto } from 'src/dtos/album.dto';
import { AssetResponseDto } from 'src/dtos/asset-response.dto';
import { AssetOrder, AssetType, AssetVisibility } from 'src/enum';
import { Optional, ValidateBoolean, ValidateDate, ValidateEnum, ValidateString, ValidateUUID } from 'src/validation';

class BaseSearchDto {
  @ValidateUUID({ optional: true, nullable: true, description: 'Library ID to filter by' })
  libraryId?: string | null;

  @ApiPropertyOptional({ description: 'Device ID to filter by' })
  @IsString()
  @IsNotEmpty()
  @Optional()
  deviceId?: string;

  @ValidateEnum({ enum: AssetType, name: 'AssetTypeEnum', optional: true, description: 'Asset type filter' })
  type?: AssetType;

  @ValidateBoolean({ optional: true, description: 'Filter by encoded status' })
  isEncoded?: boolean;

  @ValidateBoolean({ optional: true, description: 'Filter by favorite status' })
  isFavorite?: boolean;

  @ValidateBoolean({ optional: true, description: 'Filter by motion photo status' })
  isMotion?: boolean;

  @ValidateBoolean({ optional: true, description: 'Filter by offline status' })
  isOffline?: boolean;

  @ValidateEnum({ enum: AssetVisibility, name: 'AssetVisibility', optional: true, description: 'Filter by visibility' })
  visibility?: AssetVisibility;

  @ValidateDate({ optional: true, description: 'Filter by creation date (before)' })
  createdBefore?: Date;

  @ValidateDate({ optional: true, description: 'Filter by creation date (after)' })
  createdAfter?: Date;

  @ValidateDate({ optional: true, description: 'Filter by update date (before)' })
  updatedBefore?: Date;

  @ValidateDate({ optional: true, description: 'Filter by update date (after)' })
  updatedAfter?: Date;

  @ValidateDate({ optional: true, description: 'Filter by trash date (before)' })
  trashedBefore?: Date;

  @ValidateDate({ optional: true, description: 'Filter by trash date (after)' })
  trashedAfter?: Date;

  @ValidateDate({ optional: true, description: 'Filter by taken date (before)' })
  takenBefore?: Date;

  @ValidateDate({ optional: true, description: 'Filter by taken date (after)' })
  takenAfter?: Date;

  @ApiPropertyOptional({ description: 'Filter by city name' })
  @IsString()
  @Optional({ nullable: true, emptyToNull: true })
  city?: string | null;

  @ApiPropertyOptional({ description: 'Filter by state/province name' })
  @IsString()
  @Optional({ nullable: true, emptyToNull: true })
  state?: string | null;

  @ApiPropertyOptional({ description: 'Filter by country name' })
  @IsString()
  @IsNotEmpty()
  @Optional({ nullable: true, emptyToNull: true })
  country?: string | null;

  @ApiPropertyOptional({ description: 'Filter by camera make' })
  @IsString()
  @Optional({ nullable: true, emptyToNull: true })
  make?: string;

  @ApiPropertyOptional({ description: 'Filter by camera model' })
  @IsString()
  @Optional({ nullable: true, emptyToNull: true })
  model?: string | null;

  @ApiPropertyOptional({ description: 'Filter by lens model' })
  @IsString()
  @Optional({ nullable: true, emptyToNull: true })
  lensModel?: string | null;

  @ValidateBoolean({ optional: true, description: 'Filter assets not in any album' })
  isNotInAlbum?: boolean;

  @ValidateUUID({ each: true, optional: true, description: 'Filter by person IDs' })
  personIds?: string[];

  @ValidateUUID({ each: true, optional: true, nullable: true, description: 'Filter by tag IDs' })
  tagIds?: string[] | null;

  @ValidateUUID({ each: true, optional: true, description: 'Filter by album IDs' })
  albumIds?: string[];

  @Property({
    type: 'number',
    description: 'Filter by rating [1-5], or null for unrated',
    minimum: -1,
    maximum: 5,
    history: new HistoryBuilder()
      .added('v1')
      .stable('v2')
      .updated('v2.6.0', 'Using -1 as a rating is deprecated and will be removed in the next major version.'),
  })
  @Optional({ nullable: true })
  @IsInt()
  @Max(5)
  @Min(-1)
  rating?: number | null;

  @ApiPropertyOptional({ description: 'Filter by OCR text content' })
  @IsString()
  @IsNotEmpty()
  @Optional()
  ocr?: string;
}

class BaseSearchWithResultsDto extends BaseSearchDto {
  @ValidateBoolean({ optional: true, description: 'Include deleted assets' })
  withDeleted?: boolean;

  @ValidateBoolean({ optional: true, description: 'Include EXIF data in response' })
  withExif?: boolean;

  @ApiPropertyOptional({ type: 'number', description: 'Number of results to return', minimum: 1, maximum: 1000 })
  @IsInt()
  @Min(1)
  @Max(1000)
  @Type(() => Number)
  @Optional()
  size?: number;
}

export class RandomSearchDto extends BaseSearchWithResultsDto {
  @ValidateBoolean({ optional: true, description: 'Include stacked assets' })
  withStacked?: boolean;

  @ValidateBoolean({ optional: true, description: 'Include assets with people' })
  withPeople?: boolean;
}

export class LargeAssetSearchDto extends BaseSearchWithResultsDto {
  @ApiPropertyOptional({ type: 'integer', description: 'Minimum file size in bytes', minimum: 0 })
  @Optional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  minFileSize?: number;
}

export class MetadataSearchDto extends RandomSearchDto {
  @ValidateUUID({ optional: true, description: 'Filter by asset ID' })
  id?: string;

  @ApiPropertyOptional({ description: 'Filter by device asset ID' })
  @IsString()
  @IsNotEmpty()
  @Optional()
  deviceAssetId?: string;

  @ValidateString({ optional: true, trim: true, description: 'Filter by description text' })
  description?: string;

  @ApiPropertyOptional({ description: 'Filter by file checksum' })
  @IsString()
  @IsNotEmpty()
  @Optional()
  checksum?: string;

  @ValidateString({ optional: true, trim: true, description: 'Filter by original file name' })
  originalFileName?: string;

  @ApiPropertyOptional({ description: 'Filter by original file path' })
  @IsString()
  @IsNotEmpty()
  @Optional()
  originalPath?: string;

  @ApiPropertyOptional({ description: 'Filter by preview file path' })
  @IsString()
  @IsNotEmpty()
  @Optional()
  previewPath?: string;

  @ApiPropertyOptional({ description: 'Filter by thumbnail file path' })
  @IsString()
  @IsNotEmpty()
  @Optional()
  thumbnailPath?: string;

  @ApiPropertyOptional({ description: 'Filter by encoded video file path' })
  @IsString()
  @IsNotEmpty()
  @Optional()
  encodedVideoPath?: string;

  @ValidateEnum({
    enum: AssetOrder,
    name: 'AssetOrder',
    optional: true,
    default: AssetOrder.Desc,
    description: 'Sort order',
  })
  order?: AssetOrder;

  @ApiPropertyOptional({ type: 'number', description: 'Page number', minimum: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @Optional()
  page?: number;
}

export class StatisticsSearchDto extends BaseSearchDto {
  @ValidateString({ optional: true, trim: true, description: 'Filter by description text' })
  description?: string;
}

export class SmartSearchDto extends BaseSearchWithResultsDto {
  @ValidateString({ optional: true, trim: true, description: 'Natural language search query' })
  query?: string;

  @ValidateUUID({ optional: true, description: 'Asset ID to use as search reference' })
  queryAssetId?: string;

  @ApiPropertyOptional({ description: 'Search language code' })
  @IsString()
  @IsNotEmpty()
  @Optional()
  language?: string;

  @ApiPropertyOptional({ type: 'number', description: 'Page number', minimum: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @Optional()
  page?: number;
}

export class SearchPlacesDto {
  @ApiProperty({ description: 'Place name to search for' })
  @IsString()
  @IsNotEmpty()
  name!: string;
}

export class SearchPeopleDto {
  @ApiProperty({ description: 'Person name to search for' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ValidateBoolean({ optional: true, description: 'Include hidden people' })
  withHidden?: boolean;
}

export class PlacesResponseDto {
  @ApiProperty({ description: 'Place name' })
  name!: string;
  @ApiProperty({ type: 'number', description: 'Latitude coordinate' })
  latitude!: number;
  @ApiProperty({ type: 'number', description: 'Longitude coordinate' })
  longitude!: number;
  @ApiPropertyOptional({ description: 'Administrative level 1 name (state/province)' })
  admin1name?: string;
  @ApiPropertyOptional({ description: 'Administrative level 2 name (county/district)' })
  admin2name?: string;
}

export function mapPlaces(place: Place): PlacesResponseDto {
  return {
    name: place.name,
    latitude: place.latitude,
    longitude: place.longitude,
    admin1name: place.admin1Name ?? undefined,
    admin2name: place.admin2Name ?? undefined,
  };
}

export enum SearchSuggestionType {
  COUNTRY = 'country',
  STATE = 'state',
  CITY = 'city',
  CAMERA_MAKE = 'camera-make',
  CAMERA_MODEL = 'camera-model',
  CAMERA_LENS_MODEL = 'camera-lens-model',
}

export class SearchSuggestionRequestDto {
  @ValidateEnum({ enum: SearchSuggestionType, name: 'SearchSuggestionType', description: 'Suggestion type' })
  type!: SearchSuggestionType;

  @ApiPropertyOptional({ description: 'Filter by country' })
  @IsString()
  @Optional()
  country?: string;

  @ApiPropertyOptional({ description: 'Filter by state/province' })
  @IsString()
  @Optional()
  state?: string;

  @ApiPropertyOptional({ description: 'Filter by camera make' })
  @IsString()
  @Optional()
  make?: string;

  @ApiPropertyOptional({ description: 'Filter by camera model' })
  @IsString()
  @Optional()
  model?: string;

  @ApiPropertyOptional({ description: 'Filter by lens model' })
  @IsString()
  @Optional()
  lensModel?: string;

  @ValidateBoolean({
    optional: true,
    description: 'Include null values in suggestions',
    history: new HistoryBuilder().added('v1.111.0').stable('v2'),
  })
  includeNull?: boolean;
}

class SearchFacetCountResponseDto {
  @ApiProperty({ type: 'integer', description: 'Number of assets with this facet value' })
  count!: number;
  @ApiProperty({ description: 'Facet value' })
  value!: string;
}

class SearchFacetResponseDto {
  @ApiProperty({ description: 'Facet field name' })
  fieldName!: string;
  @ApiProperty({ description: 'Facet counts' })
  counts!: SearchFacetCountResponseDto[];
}

class SearchAlbumResponseDto {
  @ApiProperty({ type: 'integer', description: 'Total number of matching albums' })
  total!: number;
  @ApiProperty({ type: 'integer', description: 'Number of albums in this page' })
  count!: number;
  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined })
  items!: AlbumResponseDto[];
  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined })
  facets!: SearchFacetResponseDto[];
}

class SearchAssetResponseDto {
  @ApiProperty({ type: 'integer', description: 'Total number of matching assets' })
  total!: number;
  @ApiProperty({ type: 'integer', description: 'Number of assets in this page' })
  count!: number;
  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined })
  items!: AssetResponseDto[];
  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined })
  facets!: SearchFacetResponseDto[];
  @ApiProperty({ description: 'Next page token' })
  nextPage!: string | null;
}

export class SearchResponseDto {
  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined })
  albums!: SearchAlbumResponseDto;
  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined })
  assets!: SearchAssetResponseDto;
}

export class SearchStatisticsResponseDto {
  @ApiProperty({ type: 'integer', description: 'Total number of matching assets' })
  total!: number;
}

class SearchExploreItem {
  @ApiProperty({ description: 'Explore value' })
  value!: string;
  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined })
  data!: AssetResponseDto;
}

export class SearchExploreResponseDto {
  @ApiProperty({ description: 'Explore field name' })
  fieldName!: string;
  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined })
  items!: SearchExploreItem[];
}

export class MemoryLaneDto {
  @ApiProperty({ type: 'integer', description: 'Day of month' })
  @IsInt()
  @Type(() => Number)
  @Max(31)
  @Min(1)
  day!: number;

  @ApiProperty({ type: 'integer', description: 'Month' })
  @IsInt()
  @Type(() => Number)
  @Max(12)
  @Min(1)
  month!: number;
}
