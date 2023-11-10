import { IsBoolean, IsString } from 'class-validator';

export class SystemConfigMapDto {
  @IsBoolean()
  enabled!: boolean;

  @IsString()
  lightStyle!: string;

  @IsString()
  darkStyle!: string;
}
