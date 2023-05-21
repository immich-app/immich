import { toBoolean } from 'apps/immich/src/utils/transform.util';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class MapMarkerDto {
  @IsOptional()
  @IsBoolean()
  @Transform(toBoolean)
  isFavorite?: boolean;
}
