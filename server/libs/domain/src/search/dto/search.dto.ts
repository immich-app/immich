import { AssetType } from '@app/infra/db/entities';
import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { toBoolean } from '../../../../../apps/immich/src/utils/transform.util';

export class SearchDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  query?: string;

  @IsEnum(AssetType)
  @IsOptional()
  type?: AssetType;

  @IsBoolean()
  @IsOptional()
  @Transform(toBoolean)
  isFavorite?: boolean;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  'exifInfo.city'?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  'exifInfo.state'?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  'exifInfo.country'?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  'exifInfo.make'?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  'exifInfo.model'?: string;

  @IsString({ each: true })
  @IsArray()
  @IsOptional()
  @Transform(({ value }) => value.split(','))
  'smartInfo.objects'?: string[];

  @IsString({ each: true })
  @IsArray()
  @IsOptional()
  @Transform(({ value }) => value.split(','))
  'smartInfo.tags'?: string[];

  @IsBoolean()
  @IsOptional()
  @Transform(toBoolean)
  recent?: boolean;

  @IsBoolean()
  @IsOptional()
  @Transform(toBoolean)
  motion?: boolean;
}
