import { IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateAlbumDto {
  @IsNotEmpty()
  albumName!: string;

  @IsNotEmpty()
  ownerId!: string;

  @IsOptional()
  albumThumbnailAssetId?: string;
}
