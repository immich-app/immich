import { IsOptional } from 'class-validator';

export class UpdateAlbumDto {
  @IsOptional()
  albumName?: string;

  @IsOptional()
  albumThumbnailAssetId?: string;
}
