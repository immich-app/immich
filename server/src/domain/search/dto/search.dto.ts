import { AssetOrder } from '@app/domain/asset/dto/asset.dto';
import { AssetType, GeodataPlacesEntity } from '@app/infra/entities';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';
import { Optional, ValidateBoolean, ValidateDate, ValidateUUID } from '../../domain.util';

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
  isExternal?: boolean;

  @ValidateBoolean({ optional: true })
  isFavorite?: boolean;

  @ValidateBoolean({ optional: true })
  isMotion?: boolean;

  @ValidateBoolean({ optional: true })
  isOffline?: boolean;

  @ValidateBoolean({ optional: true })
  isReadOnly?: boolean;

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

  @Optional()
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
  resizePath?: string;

  @IsString()
  @IsNotEmpty()
  @Optional()
  webpPath?: string;

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

// TODO: remove after implementing new search filters
/** @deprecated */
export class SearchDto {
  @IsString()
  @IsNotEmpty()
  @Optional()
  q?: string;

  @IsString()
  @IsNotEmpty()
  @Optional()
  query?: string;

  @ValidateBoolean({ optional: true })
  smart?: boolean;

  /** @deprecated */
  @ValidateBoolean({ optional: true })
  clip?: boolean;

  @IsEnum(AssetType)
  @Optional()
  type?: AssetType;

  @ValidateBoolean({ optional: true })
  recent?: boolean;

  @ValidateBoolean({ optional: true })
  motion?: boolean;

  @ValidateBoolean({ optional: true })
  withArchived?: boolean;

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
