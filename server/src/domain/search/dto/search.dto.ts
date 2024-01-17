import { AssetType } from '@app/infra/entities';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsPositive, IsString, Min } from 'class-validator';
import { Optional, toBoolean } from '../../domain.util';

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

  @IsPositive()
  @Type(() => Number)
  @Optional()
  take?: number;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  @Optional()
  page?: number;
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
