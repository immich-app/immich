import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';
import { Place } from 'src/database';
import { PropertyLifecycle } from 'src/decorators';
import { AlbumResponseDto } from 'src/dtos/album.dto';
import { AssetResponseDto } from 'src/dtos/asset-response.dto';
import { AssetOrder, AssetType, AssetVisibility } from 'src/enum';
import { Optional, ValidateBoolean, ValidateDate, ValidateEnum, ValidateUUID } from 'src/validation';

class BaseSearchDto {
  @ValidateUUID({ optional: true, nullable: true })
  libraryId?: string | null;

  @IsString()
  @IsNotEmpty()
  @Optional()
  deviceId?: string;

  @ValidateEnum({ enum: AssetType, name: 'AssetTypeEnum', optional: true })
  type?: AssetType;

  @ValidateBoolean({ optional: true })
  isEncoded?: boolean;

  @ValidateBoolean({ optional: true })
  isFavorite?: boolean;

  @ValidateBoolean({ optional: true })
  isMotion?: boolean;

  @ValidateBoolean({ optional: true })
  isOffline?: boolean;

  @ValidateEnum({ enum: AssetVisibility, name: 'AssetVisibility', optional: true })
  visibility?: AssetVisibility;

  @ValidateDate({ optional: true })
  createdBefore?: Date;

  @ValidateDate({ optional: true })
  createdAfter?: Date;

  @ValidateDate({ optional: true })
  updatedBefore?: Date;

  @ValidateDate({ optional: true })
  updatedAfter?: Date;

  @ValidateDate({ optional: true })
  trashedBefore?: Date;

  @ValidateDate({ optional: true })
  trashedAfter?: Date;

  @ValidateDate({ optional: true })
  takenBefore?: Date;

  @ValidateDate({ optional: true })
  takenAfter?: Date;

  @IsString()
  @Optional({ nullable: true, emptyToNull: true })
  city?: string | null;

  @IsString()
  @Optional({ nullable: true, emptyToNull: true })
  state?: string | null;

  @IsString()
  @IsNotEmpty()
  @Optional({ nullable: true, emptyToNull: true })
  country?: string | null;

  @IsString()
  @Optional({ nullable: true, emptyToNull: true })
  make?: string;

  @IsString()
  @Optional({ nullable: true, emptyToNull: true })
  model?: string | null;

  @IsString()
  @Optional({ nullable: true, emptyToNull: true })
  lensModel?: string | null;

  @ValidateBoolean({ optional: true })
  isNotInAlbum?: boolean;

  @ValidateUUID({ each: true, optional: true })
  personIds?: string[];

  @ValidateUUID({ each: true, optional: true, nullable: true })
  tagIds?: string[] | null;

  @ValidateUUID({ each: true, optional: true })
  albumIds?: string[];

  @Optional()
  @IsInt()
  @Max(5)
  @Min(-1)
  rating?: number;
}

class BaseSearchWithResultsDto extends BaseSearchDto {
  @ValidateBoolean({ optional: true })
  withDeleted?: boolean;

  @ValidateBoolean({ optional: true })
  withExif?: boolean;

  @IsInt()
  @Min(1)
  @Max(1000)
  @Type(() => Number)
  @Optional()
  size?: number;
}

export class RandomSearchDto extends BaseSearchWithResultsDto {
  @ValidateBoolean({ optional: true })
  withStacked?: boolean;

  @ValidateBoolean({ optional: true })
  withPeople?: boolean;
}

export class LargeAssetSearchDto extends BaseSearchWithResultsDto {
  @Optional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  @ApiProperty({ type: 'integer' })
  minFileSize?: number;
}

export class MetadataSearchDto extends RandomSearchDto {
  @ValidateUUID({ optional: true })
  id?: string;

  @IsString()
  @IsNotEmpty()
  @Optional()
  deviceAssetId?: string;

  @IsString()
  @IsNotEmpty()
  @Optional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  @Optional()
  checksum?: string;

  @IsString()
  @IsNotEmpty()
  @Optional()
  originalFileName?: string;

  @IsString()
  @IsNotEmpty()
  @Optional()
  originalPath?: string;

  @IsString()
  @IsNotEmpty()
  @Optional()
  previewPath?: string;

  @IsString()
  @IsNotEmpty()
  @Optional()
  thumbnailPath?: string;

  @IsString()
  @IsNotEmpty()
  @Optional()
  encodedVideoPath?: string;

  @ValidateEnum({ enum: AssetOrder, name: 'AssetOrder', optional: true, default: AssetOrder.Desc })
  order?: AssetOrder;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  @Optional()
  page?: number;
}

export class StatisticsSearchDto extends BaseSearchDto {
  @IsString()
  @IsNotEmpty()
  @Optional()
  description?: string;
}

export class SmartSearchDto extends BaseSearchWithResultsDto {
  @IsString()
  @IsNotEmpty()
  @Optional()
  query?: string;

  @ValidateUUID({ optional: true })
  @Optional()
  queryAssetId?: string;

  @IsString()
  @IsNotEmpty()
  @Optional()
  language?: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  @Optional()
  page?: number;
}

export class SearchPlacesDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}

export class SearchPeopleDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ValidateBoolean({ optional: true })
  withHidden?: boolean;
}

export class PlacesResponseDto {
  name!: string;
  latitude!: number;
  longitude!: number;
  admin1name?: string;
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
}

export class SearchSuggestionRequestDto {
  @ValidateEnum({ enum: SearchSuggestionType, name: 'SearchSuggestionType' })
  type!: SearchSuggestionType;

  @IsString()
  @Optional()
  country?: string;

  @IsString()
  @Optional()
  state?: string;

  @IsString()
  @Optional()
  make?: string;

  @IsString()
  @Optional()
  model?: string;

  @ValidateBoolean({ optional: true })
  @PropertyLifecycle({ addedAt: 'v111.0.0' })
  includeNull?: boolean;
}

class SearchFacetCountResponseDto {
  @ApiProperty({ type: 'integer' })
  count!: number;
  value!: string;
}

class SearchFacetResponseDto {
  fieldName!: string;
  counts!: SearchFacetCountResponseDto[];
}

class SearchAlbumResponseDto {
  @ApiProperty({ type: 'integer' })
  total!: number;
  @ApiProperty({ type: 'integer' })
  count!: number;
  items!: AlbumResponseDto[];
  facets!: SearchFacetResponseDto[];
}

class SearchAssetResponseDto {
  @ApiProperty({ type: 'integer' })
  total!: number;
  @ApiProperty({ type: 'integer' })
  count!: number;
  items!: AssetResponseDto[];
  facets!: SearchFacetResponseDto[];
  nextPage!: string | null;
}

export class SearchResponseDto {
  albums!: SearchAlbumResponseDto;
  assets!: SearchAssetResponseDto;
}

export class SearchStatisticsResponseDto {
  @ApiProperty({ type: 'integer' })
  total!: number;
}

class SearchExploreItem {
  value!: string;
  data!: AssetResponseDto;
}

export class SearchExploreResponseDto {
  fieldName!: string;
  items!: SearchExploreItem[];
}

export class MemoryLaneDto {
  @IsInt()
  @Type(() => Number)
  @Max(31)
  @Min(1)
  @ApiProperty({ type: 'integer' })
  day!: number;

  @IsInt()
  @Type(() => Number)
  @Max(12)
  @Min(1)
  @ApiProperty({ type: 'integer' })
  month!: number;
}
