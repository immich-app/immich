import { Optional, toBoolean } from '@app/domain';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsDate, IsNotEmpty, IsNumber, IsUUID } from 'class-validator';

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
  @IsNumber()
  skip?: number;

  @Optional()
  @IsUUID('4')
  @ApiProperty({ format: 'uuid' })
  userId?: string;

  @Optional()
  @IsDate()
  @Type(() => Date)
  updatedAfter?: Date;
}
