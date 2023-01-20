import { IsNotEmpty, IsOptional } from 'class-validator';

export class EditSharedLinkDto {
  @IsOptional()
  description?: string;

  @IsOptional()
  expiredAt?: string;

  @IsOptional()
  allowUpload?: boolean;

  @IsNotEmpty()
  isEditExpireTime?: boolean;
}
