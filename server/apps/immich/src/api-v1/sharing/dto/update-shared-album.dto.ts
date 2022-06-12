import { IsNotEmpty } from 'class-validator';

export class UpdateShareAlbumDto {
  @IsNotEmpty()
  albumId: string;

  @IsNotEmpty()
  albumName: string;

  @IsNotEmpty()
  ownerId: string;
}
