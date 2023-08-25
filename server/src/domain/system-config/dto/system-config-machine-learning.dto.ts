import { IsBoolean, IsUrl, ValidateIf } from 'class-validator';

export class SystemConfigMachineLearningDto {
  @IsBoolean()
  enabled!: boolean;

  @IsUrl({ require_tld: false })
  @ValidateIf((dto) => dto.enabled)
  url!: string;

  @IsBoolean()
  clipEncodeEnabled!: boolean;

  @IsBoolean()
  facialRecognitionEnabled!: boolean;

  @IsBoolean()
  tagImageEnabled!: boolean;
}
