import { IsNotEmpty, IsString } from 'class-validator';
import { ValidateBoolean } from '../../domain.util';

export class SystemConfigStorageTemplateDto {
  @ValidateBoolean()
  enabled!: boolean;

  @ValidateBoolean()
  hashVerificationEnabled!: boolean;

  @IsNotEmpty()
  @IsString()
  template!: string;
}
