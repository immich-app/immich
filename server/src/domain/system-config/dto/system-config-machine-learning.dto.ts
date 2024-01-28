import { Type } from 'class-transformer';
import { IsBoolean, IsObject, IsUrl, ValidateIf, ValidateNested } from 'class-validator';
import { CLIPConfig, RecognitionConfig } from 'src/domain';

export class SystemConfigMachineLearningDto {
  @IsBoolean()
  enabled!: boolean;

  @IsUrl({ require_tld: false, allow_underscores: true })
  @ValidateIf((dto) => dto.enabled)
  url!: string;

  @Type(() => CLIPConfig)
  @ValidateNested()
  @IsObject()
  clip!: CLIPConfig;

  @Type(() => RecognitionConfig)
  @ValidateNested()
  @IsObject()
  facialRecognition!: RecognitionConfig;
}
