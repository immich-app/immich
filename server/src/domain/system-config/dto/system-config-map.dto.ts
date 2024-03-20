import { IsString } from 'class-validator';
import { ValidateBoolean } from 'src/validation';

export class SystemConfigMapDto {
  @ValidateBoolean()
  enabled!: boolean;

  @IsString()
  lightStyle!: string;

  @IsString()
  darkStyle!: string;
}
