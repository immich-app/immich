import { IsOptional, IsString } from 'class-validator';
import { ValidateUUID } from '../../domain.util';

export class UpdateAlbumDto {
  @IsOptional()
  @IsString()
  albumName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @ValidateUUID({ optional: true })
  albumThumbnailAssetId?: string;
}
