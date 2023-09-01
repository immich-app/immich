import { IsString } from 'class-validator';
import { ValidateUUID, Optional } from '../../domain.util';

export class UpdateAlbumDto {
  @Optional()
  @IsString()
  albumName?: string;

  @Optional()
  @IsString()
  description?: string;

  @ValidateUUID({ optional: true })
  albumThumbnailAssetId?: string;
}
