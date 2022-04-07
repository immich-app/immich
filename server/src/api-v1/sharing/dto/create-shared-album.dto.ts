import { IsOptional } from 'class-validator';

export class CreateSharedAlbumDto {
  @IsOptional()
  albumName: string;

  @IsOptional()
  sharedWithUserIds: string[];
}
