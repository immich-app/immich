import { AssetType } from '@app/infra/entities';
import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { toBoolean, Optional } from '../../domain.util';

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
  clip?: boolean;

  @IsEnum(AssetType)
  @Optional()
  type?: AssetType;

  @IsBoolean()
  @Optional()
  @Transform(toBoolean)
  isFavorite?: boolean;

  @IsBoolean()
  @Optional()
  @Transform(toBoolean)
  isArchived?: boolean;

  @IsString()
  @IsNotEmpty()
  @Optional()
  'exifInfo.city'?: string;

  @IsString()
  @IsNotEmpty()
  @Optional()
  'exifInfo.state'?: string;

  @IsString()
  @IsNotEmpty()
  @Optional()
  'exifInfo.country'?: string;

  @IsString()
  @IsNotEmpty()
  @Optional()
  'exifInfo.make'?: string;

  @IsString()
  @IsNotEmpty()
  @Optional()
  'exifInfo.model'?: string;

  @IsString()
  @IsNotEmpty()
  @Optional()
  'exifInfo.projectionType'?: string;

  @IsString({ each: true })
  @IsArray()
  @Optional()
  @Transform(({ value }) => value.split(','))
  'smartInfo.objects'?: string[];

  @IsString({ each: true })
  @IsArray()
  @Optional()
  @Transform(({ value }) => value.split(','))
  'smartInfo.tags'?: string[];

  @IsBoolean()
  @Optional()
  @Transform(toBoolean)
  recent?: boolean;

  @IsBoolean()
  @Optional()
  @Transform(toBoolean)
  motion?: boolean;
}
