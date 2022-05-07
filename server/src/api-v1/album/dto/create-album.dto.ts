import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateAlbumDto {
  @IsNotEmpty()
  albumName: string;

  @IsNotEmpty()
  sharedWithUserIds: string[];

  @IsOptional()
  assetIds: string[];
}
