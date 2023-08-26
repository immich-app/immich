import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsObject, IsOptional, IsString, IsUrl, Max, Min, ValidateIf, ValidateNested } from 'class-validator';

export enum ModelType {
  IMAGE_CLASSIFICATION = 'image-classification',
  FACIAL_RECOGNITION = 'facial-recognition',
  CLIP = 'clip',
}

export enum CLIPMode {
  VISION = 'vision',
  TEXT = 'text',
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
}

export class ClassificationConfig extends ModelConfig {
  @IsNumber()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  @ApiProperty({ type: 'integer' })
  minScore!: number;
}

export class CLIPConfig extends ModelConfig {
  @IsEnum(CLIPMode)
  @IsOptional()
  @ApiProperty({ enumName: 'CLIPMode', enum: CLIPMode })
  mode?: CLIPMode;
}


export class RecognitionConfig extends ModelConfig {
  @IsNumber()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  @ApiProperty({ type: 'integer' })
  minScore!: number;

  @IsNumber()
  @Min(0)
  @Max(2)
  @Type(() => Number)
  @ApiProperty({ type: 'integer' })
  maxDistance!: number;
}


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
