import { IsBoolean, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';

const isEnabled = (config: SystemConfigUpdateOAuthDto) => config.enabled;

export class SystemConfigUpdateOAuthDto {
  @IsOptional()
  @IsBoolean()
  enabled!: boolean;

  @ValidateIf(isEnabled)
  @IsNotEmpty()
  @IsString()
  issuerUrl!: string;

  @ValidateIf(isEnabled)
  @IsNotEmpty()
  @IsString()
  clientId?: string;

  @ValidateIf(isEnabled)
  @IsNotEmpty()
  @IsString()
  clientSecret!: string;

  @IsOptional()
  @IsString()
  scope?: string;

  @IsOptional()
  @IsString()
  buttonText!: string;

  @IsOptional()
  @IsBoolean()
  autoRegister?: boolean;
}
