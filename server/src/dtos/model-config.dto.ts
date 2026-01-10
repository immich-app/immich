import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';
import { ValidateBoolean } from 'src/validation';

export class TaskConfig {
  @ApiProperty({ description: 'Whether the task is enabled', type: Boolean })
  @ValidateBoolean()
  enabled!: boolean;
}

export class ModelConfig extends TaskConfig {
  @ApiProperty({ description: 'Name of the model to use', type: String })
  @IsString()
  @IsNotEmpty()
  modelName!: string;
}

export class CLIPConfig extends ModelConfig {}

export class DuplicateDetectionConfig extends TaskConfig {
  @IsNumber()
  @Min(0.001)
  @Max(0.1)
  @Type(() => Number)
  @ApiProperty({ type: 'number', format: 'double', description: 'Maximum distance threshold for duplicate detection (0.001-0.1)' })
  maxDistance!: number;
}

export class FacialRecognitionConfig extends ModelConfig {
  @IsNumber()
  @Min(0.1)
  @Max(1)
  @Type(() => Number)
  @ApiProperty({ type: 'number', format: 'double', description: 'Minimum confidence score for face detection (0.1-1)' })
  minScore!: number;

  @IsNumber()
  @Min(0.1)
  @Max(2)
  @Type(() => Number)
  @ApiProperty({ type: 'number', format: 'double', description: 'Maximum distance threshold for face recognition (0.1-2)' })
  maxDistance!: number;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @ApiProperty({ type: 'integer', description: 'Minimum number of faces required for recognition' })
  minFaces!: number;
}

export class OcrConfig extends ModelConfig {
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @ApiProperty({ type: 'integer', description: 'Maximum resolution for OCR processing' })
  maxResolution!: number;

  @IsNumber()
  @Min(0.1)
  @Max(1)
  @Type(() => Number)
  @ApiProperty({ type: 'number', format: 'double', description: 'Minimum confidence score for text detection (0.1-1)' })
  minDetectionScore!: number;

  @IsNumber()
  @Min(0.1)
  @Max(1)
  @Type(() => Number)
  @ApiProperty({ type: 'number', format: 'double', description: 'Minimum confidence score for text recognition (0.1-1)' })
  minRecognitionScore!: number;
}
