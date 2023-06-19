import { toBoolean } from '@app/immich/utils/transform.util';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsDate, IsOptional } from 'class-validator';

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
