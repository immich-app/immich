import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class SystemConfigStorageTemplateDto {
  @IsBoolean()
  enabled!: boolean;
  @IsBoolean()
  hashVerificationEnabled!: boolean;
  @IsNotEmpty()
  @IsString()
  template!: string;
}
