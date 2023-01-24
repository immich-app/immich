import { IsNotEmpty, IsOptional } from 'class-validator';

export class EditSharedLinkDto {
  @IsOptional()
  description?: string;

  @IsOptional()
  expiredAt?: string;

  @IsOptional()
  allowUpload?: boolean;

  @IsOptional()
  allowDownload?: boolean;

  @IsOptional()
  showExif?: boolean;

  @IsNotEmpty()
  isEditExpireTime?: boolean;
}
