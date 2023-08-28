import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CLIPMode, ModelType } from '../machine-learning.interface';

export class ModelConfig {
  @IsBoolean()
  enabled!: boolean;

  @IsString()
  @IsNotEmpty()
  modelName!: string;

  @IsEnum(ModelType)
  modelType!: ModelType;
}

export class ClassificationConfig extends ModelConfig {
  readonly modelType = ModelType.IMAGE_CLASSIFICATION;

  @IsNumber()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  @ApiProperty({ type: 'integer' })
  minScore!: number;
}

export class CLIPConfig extends ModelConfig {
  readonly modelType = ModelType.CLIP;

  @IsEnum(CLIPMode)
  @IsOptional()
  @ApiProperty({ enumName: 'CLIPMode', enum: CLIPMode })
  mode?: CLIPMode;
}

export class RecognitionConfig extends ModelConfig {
  readonly modelType = ModelType.FACIAL_RECOGNITION;

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