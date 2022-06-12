import { IsNotEmpty } from 'class-validator';

export class UpdateAlbumDto {
  @IsNotEmpty()
  albumName: string;

  @IsNotEmpty()
  ownerId: string;
}
