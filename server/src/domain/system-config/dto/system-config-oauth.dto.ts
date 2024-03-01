import { IsBoolean, IsNotEmpty, IsNumber, IsString, IsUrl, Min, ValidateIf } from 'class-validator';

const isEnabled = (config: SystemConfigOAuthDto) => config.enabled;
const isOverrideEnabled = (config: SystemConfigOAuthDto) => config.mobileOverrideEnabled;

export class SystemConfigOAuthDto {
  @IsBoolean()
  autoLaunch!: boolean;

  @IsBoolean()
  autoRegister!: boolean;

  @IsString()
  buttonText!: string;

  @ValidateIf(isEnabled)
  @IsNotEmpty()
  @IsString()
  clientId!: string;

  @ValidateIf(isEnabled)
  @IsNotEmpty()
  @IsString()
  clientSecret!: string;

  @IsNumber()
  @Min(0)
  defaultStorageQuota!: number;

  @IsBoolean()
  enabled!: boolean;

  @ValidateIf(isEnabled)
  @IsNotEmpty()
  @IsString()
  issuerUrl!: string;

  @IsBoolean()
  mobileOverrideEnabled!: boolean;

  @ValidateIf(isOverrideEnabled)
  @IsUrl()
  mobileRedirectUri!: string;

  @IsString()
  scope!: string;

  @IsString()
  @IsNotEmpty()
  signingAlgorithm!: string;

  @IsString()
  storageLabelClaim!: string;

  @IsString()
  storageQuotaClaim!: string;
}
