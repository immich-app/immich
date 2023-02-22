import { IsNotEmpty, IsString } from 'class-validator';

export class SystemConfigStorageTemplateDto {
  @IsNotEmpty()
  @IsString()
  template!: string;
}
