import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { toBoolean } from '../../domain.util';

export class AlbumInfoDto {
  @IsOptional()
  @IsBoolean()
  @Transform(toBoolean)
  withoutAssets?: boolean;
}
