import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { VideoSamplingStrategy } from 'src/enum';
import { ValidateBoolean } from 'src/validation';

export class TaskConfig {
  @ValidateBoolean({ description: 'Whether the task is enabled' })
  enabled!: boolean;
}

/** Positions along video duration used for multi-frame face detection and CLIP encoding. */
export class VideoSamplingConfig {
  @ApiProperty({ enum: VideoSamplingStrategy, enumName: 'VideoSamplingStrategy' })
  @IsEnum(VideoSamplingStrategy)
  strategy!: VideoSamplingStrategy;

  @ApiProperty({
    type: 'array',
    items: { type: 'number', format: 'double' },
    minItems: 1,
    maxItems: 24,
    description:
      'When strategy is fractions: ordered positions strictly between 0 and 1 along the video duration. Ignored for other strategies.',
  })
  @ValidateIf((o: VideoSamplingConfig) => o.strategy === VideoSamplingStrategy.Fractions)
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(24)
  @IsNumber({}, { each: true })
  @Min(0.000001, { each: true })
  @Max(0.999999, { each: true })
  samplingFractions!: number[];

  @ApiProperty({
    type: 'integer',
    minimum: 1,
    maximum: 32,
    description: 'When strategy is uniformCount: number of evenly spaced samples along (0, 1), e.g. 8 → i/9 for i = 1..8.',
  })
  @ValidateIf((o: VideoSamplingConfig) => o.strategy === VideoSamplingStrategy.UniformCount)
  @IsInt()
  @Min(1)
  @Max(32)
  @Type(() => Number)
  uniformFrameCount!: number;

  @ApiProperty({
    type: 'number',
    format: 'double',
    description:
      'When strategy is fixedStep: sample at step, 2×step, … while less than 1 (e.g. 0.1 → 0.1 … 0.9).',
  })
  @ValidateIf((o: VideoSamplingConfig) => o.strategy === VideoSamplingStrategy.FixedStep)
  @IsNumber()
  @Min(0.01)
  @Max(0.5)
  @Type(() => Number)
  fractionStep!: number;

  @ValidateBoolean({
    description:
      'When true, also run face detection / CLIP on the asset preview image (the video tile thumbnail) in addition to extracted frames.',
  })
  includeAssetPreviewFrame!: boolean;
}

export class ModelConfig extends TaskConfig {
  @ApiProperty({ description: 'Name of the model to use' })
  @IsString()
  @IsNotEmpty()
  modelName!: string;
}

export class CLIPConfig extends ModelConfig {
  @ValidateBoolean({
    description:
      'When enabled, CLIP smart search encodes multiple frames per video at configured sampling fractions and pools embeddings; when disabled, only the preview image is used',
  })
  @ApiProperty({
    description:
      'When enabled, CLIP encodes multiple sampled frames per video and averages them into one embedding. When disabled, only the preview image is used.',
  })
  videoMultiFrameEncodingEnabled!: boolean;
}

export class DuplicateDetectionConfig extends TaskConfig {
  @IsNumber()
  @Min(0.001)
  @Max(0.1)
  @Type(() => Number)
  @ApiProperty({
    type: 'number',
    format: 'double',
    description: 'Maximum distance threshold for duplicate detection',
  })
  maxDistance!: number;
}

export class FacialRecognitionConfig extends ModelConfig {
  @IsNumber()
  @Min(0.1)
  @Max(1)
  @Type(() => Number)
  @ApiProperty({ type: 'number', format: 'double', description: 'Minimum confidence score for face detection' })
  minScore!: number;

  @IsNumber()
  @Min(0.1)
  @Max(2)
  @Type(() => Number)
  @ApiProperty({
    type: 'number',
    format: 'double',
    description: 'Maximum distance threshold for face recognition',
  })
  maxDistance!: number;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @ApiProperty({ type: 'integer', description: 'Minimum number of faces required for recognition' })
  minFaces!: number;

  @ValidateBoolean({
    description: 'When enabled, sample multiple timestamps in each video for face detection (preview-only when disabled)',
  })
  @ApiProperty({
    description:
      'When enabled, face detection runs on multiple frames per video at the fractions configured under machine learning video sampling. When disabled, only the preview image is used.',
  })
  videoMultiFrameDetectionEnabled!: boolean;

  @IsNumber()
  @Min(32)
  @Max(2048)
  @Type(() => Number)
  @ApiProperty({ type: 'integer', description: 'Output size in pixels for square People face thumbnails' })
  personThumbnailSize!: number;

  @IsNumber()
  @Min(1)
  @Max(2)
  @Type(() => Number)
  @ApiProperty({
    type: 'number',
    format: 'double',
    description: 'Padding factor around the detected face box when building People thumbnails (1.1 ≈ 10% zoom-out)',
  })
  personThumbnailCropPaddingFactor!: number;
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
  @ApiProperty({ type: 'number', format: 'double', description: 'Minimum confidence score for text detection' })
  minDetectionScore!: number;

  @IsNumber()
  @Min(0.1)
  @Max(1)
  @Type(() => Number)
  @ApiProperty({
    type: 'number',
    format: 'double',
    description: 'Minimum confidence score for text recognition',
  })
  minRecognitionScore!: number;
}
