import { Transform } from 'class-transformer';
import { IsBoolean } from 'class-validator';
import { Optional, toBoolean } from '../../domain.util';

export class AlbumInfoDto {
  @Optional()
  @IsBoolean()
  @Transform(toBoolean)
  withoutAssets?: boolean;
}
