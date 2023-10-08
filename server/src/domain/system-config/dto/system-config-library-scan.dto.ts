import { IsBoolean, IsNotEmpty, IsString, ValidateIf } from 'class-validator';

const isEnabled = (config: SystemConfigLibraryScanDto) => config.enabled;

export class SystemConfigLibraryScanDto {
  @IsBoolean()
  enabled!: boolean;

  @ValidateIf(isEnabled)
  @IsNotEmpty()
  @IsString()
  cronExpression!: string;
}
