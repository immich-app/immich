import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class SystemConfigStorageTemplateDto {
  @IsBoolean()
  enabled!: boolean;
  @IsNotEmpty()
  @IsString()
  template!: string;
}
