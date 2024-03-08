import { IsString } from 'class-validator';
import { ValidateBoolean } from '../../domain.util';

export class SystemConfigMapDto {
  @ValidateBoolean()
  enabled!: boolean;

  @IsString()
  lightStyle!: string;

  @IsString()
  darkStyle!: string;
}
