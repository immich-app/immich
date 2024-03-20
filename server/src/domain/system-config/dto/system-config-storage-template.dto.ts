import { IsNotEmpty, IsString } from 'class-validator';
import { ValidateBoolean } from 'src/validation';

export class SystemConfigStorageTemplateDto {
  @ValidateBoolean()
  enabled!: boolean;

  @ValidateBoolean()
  hashVerificationEnabled!: boolean;

  @IsNotEmpty()
  @IsString()
  template!: string;
}
