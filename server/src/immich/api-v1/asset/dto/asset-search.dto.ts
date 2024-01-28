import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsDate, IsInt, IsNotEmpty, IsUUID } from 'class-validator';
import { Optional, toBoolean } from 'src/domain';

export class AssetSearchDto {
  @Optional()
  @IsNotEmpty()
  @IsBoolean()
  @Transform(toBoolean)
  isFavorite?: boolean;

  @Optional()
  @IsNotEmpty()
  @IsBoolean()
  @Transform(toBoolean)
  isArchived?: boolean;

  @Optional()
  @IsInt()
  @Type(() => Number)
  @ApiProperty({ type: 'integer' })
  skip?: number;

  @Optional()
  @IsInt()
  @Type(() => Number)
  @ApiProperty({ type: 'integer' })
  take?: number;

  @Optional()
  @IsUUID('4')
  @ApiProperty({ format: 'uuid' })
  userId?: string;

  @Optional()
  @IsDate()
  @Type(() => Date)
  updatedAfter?: Date;

  @Optional()
  @IsDate()
  @Type(() => Date)
  updatedBefore?: Date;
}
