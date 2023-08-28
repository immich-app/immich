import { ClassificationConfig, CLIPConfig, RecognitionConfig } from '@app/domain';
import { Type } from 'class-transformer';
import { IsBoolean, IsObject, IsUrl, ValidateIf, ValidateNested } from 'class-validator';

export class SystemConfigMachineLearningDto {
  @IsBoolean()
  enabled!: boolean;

  @IsUrl({ require_tld: false })
  @ValidateIf((dto) => dto.enabled)
  url!: string;

  @Type(() => ClassificationConfig)
  @ValidateNested()
  @IsObject()
  classification!: ClassificationConfig;

  @Type(() => CLIPConfig)
  @ValidateNested()
  @IsObject()
  clip!: CLIPConfig;

  @Type(() => RecognitionConfig)
  @ValidateNested()
  @IsObject()
  facialRecognition!: RecognitionConfig;
}
