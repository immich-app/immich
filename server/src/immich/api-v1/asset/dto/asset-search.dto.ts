import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsUUID } from 'class-validator';
import { toBoolean } from '../../../utils/transform.util';

export class AssetSearchDto {
  @IsOptional()
  @IsNotEmpty()
  @IsBoolean()
  @Transform(toBoolean)
  isFavorite?: boolean;

  @IsOptional()
  @IsNotEmpty()
  @IsBoolean()
  @Transform(toBoolean)
  isArchived?: boolean;

  /**
   * Include assets without thumbnails
   */
  @IsOptional()
  @IsBoolean()
  @Transform(toBoolean)
  withoutThumbs?: boolean;

  @IsOptional()
  @IsNumber()
  skip?: number;

  @IsOptional()
  @IsUUID('4')
  @ApiProperty({ format: 'uuid' })
  userId?: string;
}
