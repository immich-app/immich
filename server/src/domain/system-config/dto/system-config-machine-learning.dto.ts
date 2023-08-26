import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, IsUrl, Max, Min, ValidateIf } from 'class-validator';

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
  @Min(0)
  @Max(1)
  @Type(() => Number)
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
  clip!: ModelConfig;

  @ApiProperty({ type: ModelConfig })
  facialRecognition!: ModelConfig;
}
