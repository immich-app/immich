import { Transform } from 'class-transformer';
import { IsBoolean, IsString } from 'class-validator';
import { Optional, ValidateUUID, toBoolean } from '../../domain.util';

export class UpdateAlbumDto {
  @Optional()
  @IsString()
  albumName?: string;

  @Optional()
  @IsString()
  description?: string;

  @ValidateUUID({ optional: true })
  albumThumbnailAssetId?: string;

  @Optional()
  @IsBoolean()
  @Transform(toBoolean)
  isActivityEnabled?: boolean;
}
