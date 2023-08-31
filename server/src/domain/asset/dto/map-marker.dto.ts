import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsDate } from 'class-validator';
import { toBoolean, IsOptional } from '../../domain.util';

export class MapMarkerDto {
  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  @Transform(toBoolean)
  isFavorite?: boolean;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  fileCreatedAfter?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  fileCreatedBefore?: Date;
}
