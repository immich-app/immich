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

export const CLIPConfigSchema = ModelConfigSchema.meta({ id: 'CLIPConfig' });

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

export const TranscriptionConfigSchema = ModelConfigSchema.extend({
  maxDuration: z
    .int()
    .min(1)
    .nullable()
    .describe(
      'Maximum duration in seconds of a video eligible for transcription, or null for no limit. A video that exceeds it is marked so it is never re-examined, and the reason is reported alongside its transcript, rather than being silently skipped on every queue run.',
    ),
  threads: z.int().min(1).describe('Maximum number of CPU threads to use for transcription'),
  chunkDuration: z
    .int()
    .min(5)
    .max(600)
    .describe('Target length in seconds of each audio chunk sent for transcription'),
  timeoutMultiplier: z
    .number()
    .min(1)
    .describe(
      'Transcription request timeout as a multiple of the chunk duration. The same chunk takes seconds on a GPU and minutes on a low-power CPU, so the timeout scales with the audio rather than being fixed.',
    ),
  language: z
    .string()
    .regex(/^[a-z]{2,3}$/)
    .nullable()
    .describe(
      'ISO 639-1 code of the only language spoken in the library, or null to detect the language automatically. Forcing a language turns misdetection from unlikely into impossible, which is worth having wherever only one language is ever spoken.',
    ),
  minLanguageConfidence: z
    .number()
    .meta({ format: 'double' })
    .min(0)
    .max(1)
    .describe(
      'Confidence at or above which a detected change of language is believed. Below it a segment keeps the language established so far, which stops music, silence and ambient noise from switching the transcript into a language nobody is speaking.',
    ),
  maxNoSpeechProbability: z
    .number()
    .meta({ format: 'double' })
    .min(0)
    .max(1)
    .describe(
      'Probability of there being no speech above which a segment is suspected of being a hallucination. Only suspected: it is discarded only if the average log-probability also falls below its own threshold, because quiet but genuine speech scores high here on its own.',
    ),
  minAvgLogProbability: z
    .number()
    .meta({ format: 'double' })
    .max(0)
    .describe(
      'Average log-probability below which a segment is suspected of being a hallucination. Paired with the no-speech probability for the same reason: a low score alone also describes speech the model found merely difficult.',
    ),
  maxCompressionRatio: z
    .number()
    .meta({ format: 'double' })
    .min(1)
    .describe(
      'Ratio of decoded text length to its compressed size above which a segment is discarded. Unlike the paired signals this one stands alone, because nothing but a repetition loop compresses that well.',
    ),
}).meta({ id: 'TranscriptionConfig' });

export class CLIPConfig extends createZodDto(CLIPConfigSchema) {}
