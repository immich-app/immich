import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';
import { Optional } from '../../domain.util';
import { CLIPMode, ModelType } from '../../repositories';

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
  @ApiProperty({ type: 'float' })
  minScore!: number;

  @IsNumber()
  @Min(0)
  @Max(2)
  @Type(() => Number)
  @ApiProperty({ type: 'float' })
  maxDistance!: number;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @ApiProperty({ type: 'integer' })
  minFaces!: number;
}

export class ClusterConfig {
  embeddings!: number[][];

  @IsNumber()
  @Min(2)
  @Type(() => Number)
  @Optional()
  @ApiProperty({ type: 'integer' })
  min_cluster_size?: number;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @Optional()
  @ApiProperty({ type: 'integer' })
  min_samples?: number;

  @IsNumber()
  @Min(0)
  @Max(2)
  @Type(() => Number)
  @Optional()
  @ApiProperty({ type: 'float' })
  cluster_selection_epsilon?: number;
  
  @IsNumber()
  @Min(2)
  @Type(() => Number)
  @Optional()
  @ApiProperty({ type: 'integer' })
  max_cluster_size?: number;

  @IsString()
  @IsNotEmpty()
  @Optional()
  metric?: string;

  @IsNumber()
  @Min(2)
  @Type(() => Number)
  @Optional()
  @ApiProperty({ type: 'float' })
  alpha?: number;

  @IsString()
  @IsNotEmpty()
  @Optional()
  algorithm?: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @Optional()
  @ApiProperty({ type: 'integer' })
  leaf_size?: number;

  @IsBoolean()
  @Optional()
  approx_min_span_tree?: boolean;

  @IsString()
  @IsNotEmpty()
  @Optional()
  cluster_selection_method?: string;
}