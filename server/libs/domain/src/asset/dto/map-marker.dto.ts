import { ApiProperty } from '@nestjs/swagger';
import { toBoolean } from 'apps/immich/src/utils/transform.util';
import { Transform } from 'class-transformer';
import { IsBoolean, IsISO8601, IsOptional } from 'class-validator';

export class MapMarkerDto {
  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  @Transform(toBoolean)
  isFavorite?: boolean;

  @ApiProperty({ format: 'date-time' })
  @IsOptional()
  @IsISO8601({ strict: true, strictSeparator: true })
  fileCreatedAfter?: string;

  @ApiProperty({ format: 'date-time' })
  @IsOptional()
  @IsISO8601({ strict: true, strictSeparator: true })
  fileCreatedBefore?: string;
}
