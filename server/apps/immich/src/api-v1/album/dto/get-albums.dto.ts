import { Transform } from 'class-transformer';
import { IsOptional, IsBoolean } from 'class-validator';

export class GetAlbumsDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value == 'true') {
      return true;
    } else if (value == 'false') {
      return false;
    }
    return value;
  })
  /**
   * true: only shared albums
   * false: only non-shared own albums
   * undefined: shared and owned albums
   */
  shared?: boolean;
}
