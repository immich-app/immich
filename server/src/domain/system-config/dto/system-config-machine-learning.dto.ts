import { IsBoolean, IsUrl, ValidateIf, IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';


export enum ModelType {
  IMAGE_CLASSIFICATION = 'image-classification',
  FACIAL_RECOGNITION = 'facial-recognition',
  CLIP = 'clip',
}

export class ModelConfig {
  @IsBoolean()
  enabled!: boolean;

  @IsString()
  @ApiProperty({ type: 'string' })
  modelName!: string;

  @IsEnum(ModelType)
  @ApiProperty({ type: 'string', enum: ModelType, enumName: 'ModelType' })
  modelType!: ModelType;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ type: 'integer' })
  minScore?: number;
}

export class SystemConfigMachineLearningDto {
  @IsBoolean()
  enabled!: boolean;

  @IsUrl({ require_tld: false })
  @ValidateIf((dto) => dto.enabled)
  url!: string;

  @ApiProperty({ type: ModelConfig })
  classification!: ModelConfig;

  @ApiProperty({ type: ModelConfig })
  clipVision!: ModelConfig;

  @ApiProperty({ type: ModelConfig })
  clipText!: ModelConfig;

  @ApiProperty({ type: ModelConfig })
  facialRecognition!: ModelConfig;
}
