import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsPositive,
  IsString,
  ValidateIf,
} from 'class-validator';
import { Optional, ValidateUUID } from '../../domain.util';
import { BulkIdsDto } from '../response-dto';

export class DeviceIdDto {
  @IsNotEmpty()
  @IsString()
  deviceId!: string;
}

export enum AssetOrder {
  ASC = 'asc',
  DESC = 'desc',
}

const hasGPS = (o: { latitude: undefined; longitude: undefined }) =>
  o.latitude !== undefined || o.longitude !== undefined;
const ValidateGPS = () => ValidateIf(hasGPS);

export class AssetBulkUpdateDto extends BulkIdsDto {
  @Optional()
  @IsBoolean()
  isFavorite?: boolean;

  @Optional()
  @IsBoolean()
  isArchived?: boolean;

  @Optional()
  @ValidateUUID()
  stackParentId?: string;

  @Optional()
  @IsBoolean()
  removeParent?: boolean;

  @Optional()
  @IsDateString()
  dateTimeOriginal?: string;

  @ValidateGPS()
  @IsLatitude()
  @IsNotEmpty()
  latitude?: number;

  @ValidateGPS()
  @IsLongitude()
  @IsNotEmpty()
  longitude?: number;
}

export class UpdateAssetDto {
  @Optional()
  @IsBoolean()
  isFavorite?: boolean;

  @Optional()
  @IsBoolean()
  isArchived?: boolean;

  @Optional()
  @IsString()
  description?: string;

  @Optional()
  @IsDateString()
  dateTimeOriginal?: string;

  @ValidateGPS()
  @IsLatitude()
  @IsNotEmpty()
  latitude?: number;

  @ValidateGPS()
  @IsLongitude()
  @IsNotEmpty()
  longitude?: number;
}

export class RandomAssetsDto {
  @Optional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  count?: number;
}

export class AssetBulkDeleteDto extends BulkIdsDto {
  @Optional()
  @IsBoolean()
  force?: boolean;
}
