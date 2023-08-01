import { IsBoolean, IsUrl, ValidateIf, IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';


export class ModelConfig {
  @IsBoolean()
  enabled!: boolean;

  @IsString()
  @ApiProperty({ type: 'string' })
  modelName!: string;
}


export class ClassificationConfig extends ModelConfig {
  @IsNumber()
  @ApiProperty({ type: 'integer' })
  minScore!: number;
}


export class CLIPVisionConfig extends ModelConfig { }


export class CLIPTextConfig extends ModelConfig { }


export class FacialRecognitionConfig extends ModelConfig {
  @IsNumber()
  @ApiProperty({ type: 'integer' })
  minScore!: number;
}


export class SystemConfigMachineLearningDto {
  @IsBoolean()
  enabled!: boolean;

  @IsUrl({ require_tld: false })
  @ValidateIf((dto) => dto.enabled)
  url!: string;

  @ApiProperty({ type: ClassificationConfig })
  classification!: ClassificationConfig;

  @ApiProperty({ type: CLIPVisionConfig })
  clipVision!: CLIPVisionConfig;

  @ApiProperty({ type: CLIPTextConfig })
  clipText!: CLIPTextConfig;

  @ApiProperty({ type: FacialRecognitionConfig })
  facialRecognition!: FacialRecognitionConfig;
}
