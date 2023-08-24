import { toBoolean } from '@app/domain';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsDate, IsNotEmpty, IsNumber, IsOptional, IsUUID } from 'class-validator';

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

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  updatedAfter?: Date;
}
