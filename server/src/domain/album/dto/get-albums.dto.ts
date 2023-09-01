import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean } from 'class-validator';
import { toBoolean, ValidateUUID, Optional } from '../../domain.util';

export class GetAlbumsDto {
  @Optional()
  @IsBoolean()
  @Transform(toBoolean)
  @ApiProperty()
  /**
   * true: only shared albums
   * false: only non-shared own albums
   * undefined: shared and owned albums
   */
  shared?: boolean;

  /**
   * Only returns albums that contain the asset
   * Ignores the shared parameter
   * undefined: get all albums
   */
  @ValidateUUID({ optional: true })
  assetId?: string;
}
