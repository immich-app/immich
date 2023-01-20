import { IsBoolean, IsNotEmpty, IsString, IsUrl, ValidateIf } from 'class-validator';

const isEnabled = (config: SystemConfigOAuthDto) => config.enabled;
const isOverrideEnabled = (config: SystemConfigOAuthDto) => config.mobileOverrideEnabled;

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

  @IsBoolean()
  autoLaunch!: boolean;

  @IsBoolean()
  mobileOverrideEnabled!: boolean;

  @ValidateIf(isOverrideEnabled)
  @IsUrl()
  mobileRedirectUri!: string;
}
