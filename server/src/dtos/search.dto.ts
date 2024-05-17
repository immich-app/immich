import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';
import { PropertyLifecycle } from 'src/decorators';
import { AlbumResponseDto } from 'src/dtos/album.dto';
import { AssetResponseDto } from 'src/dtos/asset-response.dto';
import { AssetOrder } from 'src/entities/album.entity';
import { AssetType } from 'src/entities/asset.entity';
import { GeodataPlacesEntity } from 'src/entities/geodata-places.entity';
import { Optional, ValidateBoolean, ValidateDate, ValidateUUID } from 'src/validation';

class BaseSearchDto {
  @ValidateUUID({ optional: true })
  libraryId?: string;

  @IsString()
  @IsNotEmpty()
  @Optional()
  deviceId?: string;

  @IsEnum(AssetType)
  @Optional()
  @ApiProperty({ enumName: 'AssetTypeEnum', enum: AssetType })
  type?: AssetType;

  @ValidateBoolean({ optional: true })
  isArchived?: boolean;

  @ValidateBoolean({ optional: true })
  @ApiProperty({ default: false })
  withArchived?: boolean;

  @ValidateBoolean({ optional: true })
  isEncoded?: boolean;

  @ValidateBoolean({ optional: true })
  isFavorite?: boolean;

  @ValidateBoolean({ optional: true })
  isMotion?: boolean;

  @ValidateBoolean({ optional: true })
  isOffline?: boolean;

  @ValidateBoolean({ optional: true })
  isVisible?: boolean;

  @ValidateBoolean({ optional: true })
  withDeleted?: boolean;

  @ValidateBoolean({ optional: true })
  withExif?: boolean;

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
  @IsNotEmpty()
  @Optional()
  city?: string;

  @IsString()
  @IsNotEmpty()
  @Optional()
  state?: string;

  @IsString()
  @IsNotEmpty()
  @Optional()
  country?: string;

  @IsString()
  @IsNotEmpty()
  @Optional()
  make?: string;

  @IsString()
  @IsNotEmpty()
  @Optional()
  model?: string;

  @IsString()
  @IsNotEmpty()
  @Optional()
  lensModel?: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  @Optional()
  page?: number;

  @IsInt()
  @Min(1)
  @Max(1000)
  @Type(() => Number)
  @Optional()
  size?: number;

  @ValidateBoolean({ optional: true })
  isNotInAlbum?: boolean;

  @ValidateUUID({ each: true, optional: true })
  personIds?: string[];
}

export class MetadataSearchDto extends BaseSearchDto {
  @ValidateUUID({ optional: true })
  id?: string;

  @IsString()
  @IsNotEmpty()
  @Optional()
  deviceAssetId?: string;

  @IsString()
  @IsNotEmpty()
  @Optional()
  checksum?: string;

  @ValidateBoolean({ optional: true })
  withStacked?: boolean;

  @ValidateBoolean({ optional: true })
  withPeople?: boolean;

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
  @PropertyLifecycle({ deprecatedAt: 'v1.100.0' })
  resizePath?: string;

  @IsString()
  @IsNotEmpty()
  @Optional()
  @PropertyLifecycle({ deprecatedAt: 'v1.100.0' })
  webpPath?: string;

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

  @IsEnum(AssetOrder)
  @Optional()
  @ApiProperty({ enumName: 'AssetOrder', enum: AssetOrder })
  order?: AssetOrder;
}

export class SmartSearchDto extends BaseSearchDto {
  @IsString()
  @IsNotEmpty()
  query!: string;
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

export function mapPlaces(place: GeodataPlacesEntity): PlacesResponseDto {
  return {
    name: place.name,
    latitude: place.latitude,
    longitude: place.longitude,
    admin1name: place.admin1Name,
    admin2name: place.admin2Name,
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
  @IsEnum(SearchSuggestionType)
  @IsNotEmpty()
  @ApiProperty({ enumName: 'SearchSuggestionType', enum: SearchSuggestionType })
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

class SearchExploreItem {
  value!: string;
  data!: AssetResponseDto;
}

export class SearchExploreResponseDto {
  fieldName!: string;
  items!: SearchExploreItem[];
}

export class MapMarkerDto {
  @ValidateBoolean({ optional: true })
  isArchived?: boolean;

  @ValidateBoolean({ optional: true })
  isFavorite?: boolean;

  @ValidateDate({ optional: true })
  fileCreatedAfter?: Date;

  @ValidateDate({ optional: true })
  fileCreatedBefore?: Date;

  @ValidateBoolean({ optional: true })
  withPartners?: boolean;

  @ValidateBoolean({ optional: true })
  withSharedAlbums?: boolean;
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
export class MapMarkerResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ format: 'double' })
  lat!: number;

  @ApiProperty({ format: 'double' })
  lon!: number;

  @ApiProperty()
  city!: string | null;

  @ApiProperty()
  state!: string | null;

  @ApiProperty()
  country!: string | null;
}
