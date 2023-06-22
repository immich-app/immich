import { toBoolean } from '@app/immich/utils/transform.util';
import { AssetType } from '@app/infra/entities';
import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SearchDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  q?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  query?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(toBoolean)
  clip?: boolean;

  @IsEnum(AssetType)
  @IsOptional()
  type?: AssetType;

  @IsBoolean()
  @IsOptional()
  @Transform(toBoolean)
  isFavorite?: boolean;

  @IsBoolean()
  @IsOptional()
  @Transform(toBoolean)
  isArchived?: boolean;

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
