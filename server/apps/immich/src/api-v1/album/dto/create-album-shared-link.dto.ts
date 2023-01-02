import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAlbumShareLinkDto {
  @IsString()
  @IsNotEmpty()
  albumId!: string;
}
