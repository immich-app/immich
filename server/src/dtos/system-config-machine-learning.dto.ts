import { Type } from 'class-transformer';
import { IsObject, IsUrl, ValidateIf, ValidateNested } from 'class-validator';
import { CLIPConfig, RecognitionConfig } from 'src/dtos/model-config.dto';
import { ValidateBoolean } from 'src/validation';

export class SystemConfigMachineLearningDto {
  @ValidateBoolean()
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
