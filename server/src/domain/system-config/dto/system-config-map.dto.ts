import { IsString } from 'class-validator';
import { ValidateBoolean } from 'src/domain/domain.util';

export class SystemConfigMapDto {
  @ValidateBoolean()
  enabled!: boolean;

  @IsString()
  lightStyle!: string;

  @IsString()
  darkStyle!: string;
}
