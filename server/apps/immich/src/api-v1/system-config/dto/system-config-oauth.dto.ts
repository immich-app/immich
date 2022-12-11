import { IsBoolean, IsNotEmpty, IsString, ValidateIf } from 'class-validator';

const isEnabled = (config: SystemConfigOAuthDto) => config.enabled;

export class SystemConfigOAuthDto {
  @IsBoolean()
  enabled!: boolean;

  @ValidateIf(isEnabled)
  @IsNotEmpty()
  @IsString()
  issuerUrl!: string;

  @ValidateIf(isEnabled)
  @IsNotEmpty()
  @IsString()
  clientId!: string;

  @ValidateIf(isEnabled)
  @IsNotEmpty()
  @IsString()
  clientSecret!: string;

  @IsString()
  scope!: string;

  @IsString()
  buttonText!: string;

  @IsBoolean()
  autoRegister!: boolean;
}
