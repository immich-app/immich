import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateAlbumDto {
  @IsNotEmpty()
  albumName!: string;

  @IsOptional()
  sharedWithUserIds?: string[];

  @IsOptional()
  assetIds?: string[];
}
