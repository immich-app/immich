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
  @ApiPropertyOptional({ description: 'Library ID to filter by', nullable: true })
  @ValidateUUID({ optional: true, nullable: true })
  libraryId?: string | null;

  @ApiPropertyOptional({ description: 'Device ID to filter by' })
  @IsString()
  @IsNotEmpty()
  @Optional()
  deviceId?: string;

  @ApiPropertyOptional({ description: 'Asset type filter', enum: AssetType })
  @ValidateEnum({ enum: AssetType, name: 'AssetTypeEnum', optional: true })
  type?: AssetType;

  @ApiPropertyOptional({ description: 'Filter by encoded status' })
  @ValidateBoolean({ optional: true })
  isEncoded?: boolean;

  @ApiPropertyOptional({ description: 'Filter by favorite status' })
  @ValidateBoolean({ optional: true })
  isFavorite?: boolean;

  @ApiPropertyOptional({ description: 'Filter by motion photo status' })
  @ValidateBoolean({ optional: true })
  isMotion?: boolean;

  @ApiPropertyOptional({ description: 'Filter by offline status' })
  @ValidateBoolean({ optional: true })
  isOffline?: boolean;

  @ApiPropertyOptional({ description: 'Filter by visibility', enum: AssetVisibility })
  @ValidateEnum({ enum: AssetVisibility, name: 'AssetVisibility', optional: true })
  visibility?: AssetVisibility;

  @ApiPropertyOptional({ description: 'Filter by creation date (before)', format: 'date-time' })
  @ValidateDate({ optional: true })
  createdBefore?: Date;

  @ApiPropertyOptional({ description: 'Filter by creation date (after)', format: 'date-time' })
  @ValidateDate({ optional: true })
  createdAfter?: Date;

  @ApiPropertyOptional({ description: 'Filter by update date (before)', format: 'date-time' })
  @ValidateDate({ optional: true })
  updatedBefore?: Date;

  @ApiPropertyOptional({ description: 'Filter by update date (after)', format: 'date-time' })
  @ValidateDate({ optional: true })
  updatedAfter?: Date;

  @ApiPropertyOptional({ description: 'Filter by trash date (before)', format: 'date-time' })
  @ValidateDate({ optional: true })
  trashedBefore?: Date;

  @ApiPropertyOptional({ description: 'Filter by trash date (after)', format: 'date-time' })
  @ValidateDate({ optional: true })
  trashedAfter?: Date;

  @ApiPropertyOptional({ description: 'Filter by taken date (before)', format: 'date-time' })
  @ValidateDate({ optional: true })
  takenBefore?: Date;

  @ApiPropertyOptional({ description: 'Filter by taken date (after)', format: 'date-time' })
  @ValidateDate({ optional: true })
  takenAfter?: Date;

  @ApiPropertyOptional({ description: 'Filter by city name', nullable: true })
  @IsString()
  @Optional({ nullable: true, emptyToNull: true })
  city?: string | null;

  @ApiPropertyOptional({ description: 'Filter by state/province name', nullable: true })
  @IsString()
  @Optional({ nullable: true, emptyToNull: true })
  state?: string | null;

  @ApiPropertyOptional({ description: 'Filter by country name', nullable: true })
  @IsString()
  @IsNotEmpty()
  @Optional({ nullable: true, emptyToNull: true })
  country?: string | null;

  @ApiPropertyOptional({ description: 'Filter by camera make' })
  @IsString()
  @Optional({ nullable: true, emptyToNull: true })
  make?: string;

  @ApiPropertyOptional({ description: 'Filter by camera model', nullable: true })
  @IsString()
  @Optional({ nullable: true, emptyToNull: true })
  model?: string | null;

  @ApiPropertyOptional({ description: 'Filter by lens model', nullable: true })
  @IsString()
  @Optional({ nullable: true, emptyToNull: true })
  lensModel?: string | null;

  @ApiPropertyOptional({ description: 'Filter assets not in any album' })
  @ValidateBoolean({ optional: true })
  isNotInAlbum?: boolean;

  @ApiPropertyOptional({ description: 'Filter by person IDs', type: [String] })
  @ValidateUUID({ each: true, optional: true })
  personIds?: string[];

  @ApiPropertyOptional({ description: 'Filter by tag IDs', type: [String], nullable: true })
  @ValidateUUID({ each: true, optional: true, nullable: true })
  tagIds?: string[] | null;

  @ApiPropertyOptional({ description: 'Filter by album IDs', type: [String] })
  @ValidateUUID({ each: true, optional: true })
  albumIds?: string[];

  @ApiPropertyOptional({ type: 'number', description: 'Filter by rating (-1 to 5)', minimum: -1, maximum: 5 })
  @Optional()
  @IsInt()
  @Max(5)
  @Min(-1)
  rating?: number;

  @ApiPropertyOptional({ description: 'Filter by OCR text content' })
  @IsString()
  @IsNotEmpty()
  @Optional()
  ocr?: string;
}

class BaseSearchWithResultsDto extends BaseSearchDto {
  @ApiPropertyOptional({ description: 'Include deleted assets' })
  @ValidateBoolean({ optional: true })
  withDeleted?: boolean;

  @ApiPropertyOptional({ description: 'Include EXIF data in response' })
  @ValidateBoolean({ optional: true })
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
  @ApiPropertyOptional({ description: 'Include stacked assets' })
  @ValidateBoolean({ optional: true })
  withStacked?: boolean;

  @ApiPropertyOptional({ description: 'Include assets with people' })
  @ValidateBoolean({ optional: true })
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
  @ApiPropertyOptional({ description: 'Filter by asset ID' })
  @ValidateUUID({ optional: true })
  id?: string;

  @ApiPropertyOptional({ description: 'Filter by device asset ID' })
  @IsString()
  @IsNotEmpty()
  @Optional()
  deviceAssetId?: string;

  @ApiPropertyOptional({ description: 'Filter by description text' })
  @ValidateString({ optional: true, trim: true })
  description?: string;

  @ApiPropertyOptional({ description: 'Filter by file checksum' })
  @IsString()
  @IsNotEmpty()
  @Optional()
  checksum?: string;

  @ApiPropertyOptional({ description: 'Filter by original file name' })
  @ValidateString({ optional: true, trim: true })
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

  @ApiPropertyOptional({ description: 'Sort order', enum: AssetOrder, default: AssetOrder.Desc })
  @ValidateEnum({ enum: AssetOrder, name: 'AssetOrder', optional: true, default: AssetOrder.Desc })
  order?: AssetOrder;

  @ApiPropertyOptional({ type: 'number', description: 'Page number', minimum: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @Optional()
  page?: number;
}

export class StatisticsSearchDto extends BaseSearchDto {
  @ApiPropertyOptional({ description: 'Filter by description text' })
  @ValidateString({ optional: true, trim: true })
  description?: string;
}

export class SmartSearchDto extends BaseSearchWithResultsDto {
  @ApiPropertyOptional({ description: 'Natural language search query' })
  @ValidateString({ optional: true, trim: true })
  query?: string;

  @ApiPropertyOptional({ description: 'Asset ID to use as search reference' })
  @ValidateUUID({ optional: true })
  @Optional()
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

  @ApiPropertyOptional({ description: 'Include hidden people' })
  @ValidateBoolean({ optional: true })
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
  @ApiProperty({ description: 'Suggestion type', enum: SearchSuggestionType })
  @ValidateEnum({ enum: SearchSuggestionType, name: 'SearchSuggestionType' })
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

  @ApiPropertyOptional({ description: 'Include null values in suggestions' })
  @ValidateBoolean({ optional: true })
  @Property({ history: new HistoryBuilder().added('v1.111.0').stable('v2') })
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
  @ApiProperty({ description: 'Facet counts', type: () => [SearchFacetCountResponseDto] })
  counts!: SearchFacetCountResponseDto[];
}

class SearchAlbumResponseDto {
  @ApiProperty({ type: 'integer', description: 'Total number of matching albums' })
  total!: number;
  @ApiProperty({ type: 'integer', description: 'Number of albums in this page' })
  count!: number;
  @ApiProperty({ description: 'Album items', type: () => [AlbumResponseDto] })
  items!: AlbumResponseDto[];
  @ApiProperty({ description: 'Search facets', type: () => [SearchFacetResponseDto] })
  facets!: SearchFacetResponseDto[];
}

class SearchAssetResponseDto {
  @ApiProperty({ type: 'integer', description: 'Total number of matching assets' })
  total!: number;
  @ApiProperty({ type: 'integer', description: 'Number of assets in this page' })
  count!: number;
  @ApiProperty({ description: 'Asset items', type: () => [AssetResponseDto] })
  items!: AssetResponseDto[];
  @ApiProperty({ description: 'Search facets', type: () => [SearchFacetResponseDto] })
  facets!: SearchFacetResponseDto[];
  @ApiPropertyOptional({ description: 'Next page token', nullable: true })
  nextPage!: string | null;
}

export class SearchResponseDto {
  @ApiProperty({ description: 'Album search results', type: () => SearchAlbumResponseDto })
  albums!: SearchAlbumResponseDto;
  @ApiProperty({ description: 'Asset search results', type: () => SearchAssetResponseDto })
  assets!: SearchAssetResponseDto;
}

export class SearchStatisticsResponseDto {
  @ApiProperty({ type: 'integer', description: 'Total number of matching assets' })
  total!: number;
}

class SearchExploreItem {
  @ApiProperty({ description: 'Explore value' })
  value!: string;
  @ApiProperty({ description: 'Representative asset', type: () => AssetResponseDto })
  data!: AssetResponseDto;
}

export class SearchExploreResponseDto {
  @ApiProperty({ description: 'Explore field name' })
  fieldName!: string;
  @ApiProperty({ description: 'Explore items', type: () => [SearchExploreItem] })
  items!: SearchExploreItem[];
}

export class MemoryLaneDto {
  @ApiProperty({ type: 'integer', description: 'Day of month (1-31)', minimum: 1, maximum: 31 })
  @IsInt()
  @Type(() => Number)
  @Max(31)
  @Min(1)
  day!: number;

  @ApiProperty({ type: 'integer', description: 'Month (1-12)', minimum: 1, maximum: 12 })
  @IsInt()
  @Type(() => Number)
  @Max(12)
  @Min(1)
  month!: number;
}
