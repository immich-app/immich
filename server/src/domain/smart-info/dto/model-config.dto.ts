import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';
import { Optional } from '../../domain.util';
import { CLIPMode, ModelType } from '../machine-learning.interface';

export class ModelConfig {
  @IsBoolean()
  enabled!: boolean;

  @IsString()
  @IsNotEmpty()
  modelName!: string;

  @IsEnum(ModelType)
  @Optional()
  @ApiProperty({ enumName: 'ModelType', enum: ModelType })
  modelType?: ModelType;
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
  @Optional()
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

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @ApiProperty({ type: 'integer' })
  minFaces!: number;
}
