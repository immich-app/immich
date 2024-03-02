import { AssetOrder } from '@app/domain/asset/dto/asset.dto';
import { AssetType, GeodataPlacesEntity } from '@app/infra/entities';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';
import { Optional, QueryBoolean, QueryDate, ValidateUUID, toBoolean } from '../../domain.util';

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

  @QueryBoolean({ optional: true })
  isArchived?: boolean;

  @QueryBoolean({ optional: true })
  @ApiProperty({ default: false })
  withArchived?: boolean;

  @QueryBoolean({ optional: true })
  isEncoded?: boolean;

  @QueryBoolean({ optional: true })
  isExternal?: boolean;

  @QueryBoolean({ optional: true })
  isFavorite?: boolean;

  @QueryBoolean({ optional: true })
  isMotion?: boolean;

  @QueryBoolean({ optional: true })
  isOffline?: boolean;

  @QueryBoolean({ optional: true })
  isReadOnly?: boolean;

  @QueryBoolean({ optional: true })
  isVisible?: boolean;

  @QueryBoolean({ optional: true })
  withDeleted?: boolean;

  @QueryBoolean({ optional: true })
  withExif?: boolean;

  @QueryDate({ optional: true })
  createdBefore?: Date;

  @QueryDate({ optional: true })
  createdAfter?: Date;

  @QueryDate({ optional: true })
  updatedBefore?: Date;

  @QueryDate({ optional: true })
  updatedAfter?: Date;

  @QueryDate({ optional: true })
  trashedBefore?: Date;

  @QueryDate({ optional: true })
  trashedAfter?: Date;

  @QueryDate({ optional: true })
  takenBefore?: Date;

  @QueryDate({ optional: true })
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

  @QueryBoolean({ optional: true })
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

  @QueryBoolean({ optional: true })
  withStacked?: boolean;

  @QueryBoolean({ optional: true })
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

  @IsBoolean()
  @Optional()
  @Transform(toBoolean)
  smart?: boolean;

  /** @deprecated */
  @IsBoolean()
  @Optional()
  @Transform(toBoolean)
  clip?: boolean;

  @IsEnum(AssetType)
  @Optional()
  type?: AssetType;

  @IsBoolean()
  @Optional()
  @Transform(toBoolean)
  recent?: boolean;

  @IsBoolean()
  @Optional()
  @Transform(toBoolean)
  motion?: boolean;

  @IsBoolean()
  @Optional()
  @Transform(toBoolean)
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

  @IsBoolean()
  @Transform(toBoolean)
  @Optional()
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
