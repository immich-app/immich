import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const TaskConfigSchema = z
  .object({
    enabled: z.boolean().describe('Whether the task is enabled'),
  })
  .meta({ id: 'TaskConfig' });

const ModelConfigSchema = TaskConfigSchema.extend({
  modelName: z.string().describe('Name of the model to use'),
});

export const CLIPConfigSchema = ModelConfigSchema.extend({
  videoFrameStrategy: z
    .enum(['time', 'scene'])
    .describe('Strategy for extracting frames from videos: time-based intervals or scene-change detection'),
  videoFrameInterval: z.int().min(1).describe('Interval in seconds between extracted frames (time-based strategy)'),
  videoMaxFrames: z.int().min(1).describe('Maximum number of frames to extract per video'),
  videoSceneThreshold: z
    .number()
    .meta({ format: 'double' })
    .min(0.01)
    .max(1)
    .describe('Scene change detection threshold (scene-based strategy, lower = more sensitive)'),
}).meta({ id: 'CLIPConfig' });

export const DuplicateDetectionConfigSchema = TaskConfigSchema.extend({
  maxDistance: z
    .number()
    .meta({ format: 'double' })
    .min(0.001)
    .max(0.1)
    .describe('Maximum distance threshold for duplicate detection'),
}).meta({ id: 'DuplicateDetectionConfig' });

export const FacialRecognitionConfigSchema = ModelConfigSchema.extend({
  minScore: z
    .number()
    .meta({ format: 'double' })
    .min(0.1)
    .max(1)
    .describe('Minimum confidence score for face detection'),
  maxDistance: z
    .number()
    .meta({ format: 'double' })
    .min(0.1)
    .max(2)
    .describe('Maximum distance threshold for face recognition'),
  minFaces: z.int().min(1).describe('Minimum number of faces required for recognition'),
}).meta({ id: 'FacialRecognitionConfig' });

export const OcrConfigSchema = ModelConfigSchema.extend({
  maxResolution: z.int().min(1).describe('Maximum resolution for OCR processing'),
  minDetectionScore: z
    .number()
    .meta({ format: 'double' })
    .min(0.1)
    .max(1)
    .describe('Minimum confidence score for text detection'),
  minRecognitionScore: z
    .number()
    .meta({ format: 'double' })
    .min(0.1)
    .max(1)
    .describe('Minimum confidence score for text recognition'),
}).meta({ id: 'OcrConfig' });

export class CLIPConfig extends createZodDto(CLIPConfigSchema) {}
