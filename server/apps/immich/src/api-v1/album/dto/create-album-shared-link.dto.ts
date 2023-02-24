import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAlbumShareLinkDto {
  @IsString()
  @IsNotEmpty()
  albumId!: string;

  @IsString()
  @IsOptional()
  expiresAt?: string;

  @IsBoolean()
  @IsOptional()
  allowUpload?: boolean;

  @IsBoolean()
  @IsOptional()
  allowDownload?: boolean;

  @IsBoolean()
  @IsOptional()
  showExif?: boolean;

  @IsString()
  @IsOptional()
  description?: string;
}
