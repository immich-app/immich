import { IsNotEmpty, IsNumber, IsString, IsUrl, Min, ValidateIf } from 'class-validator';
import { ValidateBoolean } from '../../domain.util';

const isEnabled = (config: SystemConfigOAuthDto) => config.enabled;
const isOverrideEnabled = (config: SystemConfigOAuthDto) => config.mobileOverrideEnabled;

export class SystemConfigOAuthDto {
  @ValidateBoolean()
  autoLaunch!: boolean;

  @ValidateBoolean()
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

  @ValidateBoolean()
  enabled!: boolean;

  @ValidateIf(isEnabled)
  @IsNotEmpty()
  @IsString()
  issuerUrl!: string;

  @ValidateBoolean()
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
