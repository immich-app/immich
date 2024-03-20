import { Type } from 'class-transformer';
import { IsObject, IsUrl, ValidateIf, ValidateNested } from 'class-validator';
import { ValidateBoolean } from 'src/domain/domain.util';
import { CLIPConfig, RecognitionConfig } from 'src/domain/smart-info/dto/model-config.dto';

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
