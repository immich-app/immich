import { ClassificationConfig, CLIPConfig, RecognitionConfig } from '@app/domain';
import { Type } from 'class-transformer';
import { IsBoolean, IsObject, IsUrl, ValidateIf, ValidateNested, IsArray, ArrayMinSize, ArrayMaxSize, ArrayUnique } from 'class-validator';

export class SystemConfigMachineLearningDto {
  @IsBoolean()
  enabled!: boolean;

  @IsUrl({ require_tld: false, allow_underscores: true })
  @ValidateIf((dto) => dto.enabled)
  url!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @ArrayUnique()
  @IsUrl({ require_tld: false, allow_underscores: true }, { each: true })
  urls!: Array<string>;

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
