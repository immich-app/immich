import { Transform } from 'class-transformer';
import { IsBoolean } from 'class-validator';
import { toBoolean, IsOptional } from '../../domain.util';

export class AlbumInfoDto {
  @IsOptional()
  @IsBoolean()
  @Transform(toBoolean)
  withoutAssets?: boolean;
}
