import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';
import { createZodDto } from 'nestjs-zod';
import { Place } from 'src/database';
import { HistoryBuilder } from 'src/decorators';
import { AlbumResponseSchema } from 'src/dtos/album.dto';
import { AssetResponseSchema } from 'src/dtos/asset-response.dto';
import { AssetOrder, AssetType, AssetVisibility } from 'src/enum';
import { Optional, ValidateBoolean, ValidateDate, ValidateEnum, ValidateString, ValidateUUID } from 'src/validation';
import { z } from 'zod';

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

  @ApiPropertyOptional({ type: 'number', description: 'Filter by rating', minimum: -1, maximum: 5 })
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

export const SearchFacetCountResponseSchema = z
  .object({
    count: z.int().nonnegative().describe('Number of assets with this facet value'),
    value: z.string().describe('Facet value'),
  })
  .meta({ id: 'SearchFacetCountResponseDto' });

export class SearchFacetCountResponseDto extends createZodDto(SearchFacetCountResponseSchema) {}

export const SearchFacetResponseSchema = z
  .object({
    fieldName: z.string().describe('Facet field name'),
    counts: z.array(SearchFacetCountResponseSchema),
  })
  .meta({ id: 'SearchFacetResponseDto' });

export class SearchFacetResponseDto extends createZodDto(SearchFacetResponseSchema) {}

export const SearchAlbumResponseSchema = z
  .object({
    total: z.int().nonnegative().describe('Total number of matching albums'),
    count: z.int().nonnegative().describe('Number of albums in this page'),
    items: z.array(AlbumResponseSchema),
    facets: z.array(SearchFacetResponseSchema),
  })
  .meta({ id: 'SearchAlbumResponseDto' });

export class SearchAlbumResponseDto extends createZodDto(SearchAlbumResponseSchema) {}

export const SearchAssetResponseSchema = z
  .object({
    total: z.int().nonnegative().describe('Total number of matching assets'),
    count: z.int().nonnegative().describe('Number of assets in this page'),
    items: z.array(AssetResponseSchema),
    facets: z.array(SearchFacetResponseSchema),
    nextPage: z.string().describe('Next page token').nullable(),
  })
  .meta({ id: 'SearchAssetResponseDto' });

export class SearchAssetResponseDto extends createZodDto(SearchAssetResponseSchema) {}

export const SearchResponseSchema = z
  .object({
    albums: SearchAlbumResponseSchema,
    assets: SearchAssetResponseSchema,
  })
  .meta({ id: 'SearchResponseDto' });

export class SearchResponseDto extends createZodDto(SearchResponseSchema) {}

export class SearchStatisticsResponseDto {
  @ApiProperty({ type: 'integer', description: 'Total number of matching assets' })
  total!: number;
}

export const SearchExploreItemSchema = z
  .object({
    value: z.string().describe('Explore value'),
    data: AssetResponseSchema,
  })
  .meta({ id: 'SearchExploreItem' });

export class SearchExploreItem extends createZodDto(SearchExploreItemSchema) {}

export const SearchExploreResponseSchema = z
  .object({
    fieldName: z.string().describe('Explore field name'),
    items: z.array(SearchExploreItemSchema),
  })
  .meta({ id: 'SearchExploreResponseDto' });

export class SearchExploreResponseDto extends createZodDto(SearchExploreResponseSchema) {}

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
