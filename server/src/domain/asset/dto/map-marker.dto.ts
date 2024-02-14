import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsDate } from 'class-validator';
import { Optional, toBoolean } from '../../domain.util';

export class MapMarkerDto {
  @ApiProperty()
  @Optional()
  @IsBoolean()
  @Transform(toBoolean)
  isArchived?: boolean;

  @ApiProperty()
  @Optional()
  @IsBoolean()
  @Transform(toBoolean)
  isFavorite?: boolean;

  @Optional()
  @IsDate()
  @Type(() => Date)
  fileCreatedAfter?: Date;

  @Optional()
  @IsDate()
  @Type(() => Date)
  fileCreatedBefore?: Date;

  @ApiProperty()
  @Optional()
  @IsBoolean()
  @Transform(toBoolean)
  withPartners?: boolean;
}
