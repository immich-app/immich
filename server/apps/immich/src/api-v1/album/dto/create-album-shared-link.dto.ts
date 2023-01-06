import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAlbumShareLinkDto {
  @IsString()
  @IsNotEmpty()
  albumId!: string;

  @IsString()
  @IsOptional()
  expiredAt?: string;

  @IsBoolean()
  @IsOptional()
  allowUpload?: boolean;

  @IsString()
  @IsOptional()
  description?: string;
}
