import z from 'zod';
import { PersonResponseDto, PersonResponseSchema } from 'src/dtos/person.dto.js';
import { Face } from 'src/repositories/machine-learning.repository.js';
import { createZodDto } from 'src/zod.js';

const FaceRecognitionSchema = z
  .object({
    file: z.file().describe('JPEG, PNG or WebP image, up to 20 MiB'),
  })
  .meta({ id: 'FaceRecognitionDto' });

const FaceRecognitionResultSchema = z
  .object({
    boundingBox: z
      .object({
        x1: z.number().meta({ format: 'double' }),
        y1: z.number().meta({ format: 'double' }),
        x2: z.number().meta({ format: 'double' }),
        y2: z.number().meta({ format: 'double' }),
      })
      .describe('Face coordinates in the decoded image'),
    score: z.number().meta({ format: 'double' }).describe('Face detection score, not identity confidence'),
    matched: z.boolean().describe('Whether a sufficiently similar face belongs to an existing person'),
    distance: z
      .number()
      .meta({ format: 'double' })
      .nullable()
      .describe('Cosine distance to the matching face; lower is more similar'),
    person: PersonResponseSchema.nullable().describe('Matching person, or null when no match was found'),
  })
  .meta({ id: 'FaceRecognitionResultDto' });

const FaceRecognitionResponseSchema = z
  .object({
    imageWidth: z.int().describe('Width of the decoded image'),
    imageHeight: z.int().describe('Height of the decoded image'),
    faces: z
      .array(FaceRecognitionResultSchema)
      .describe('One result per detected face, or an empty array if none were detected'),
  })
  .meta({ id: 'FaceRecognitionResponseDto' });

export class FaceRecognitionDto extends createZodDto(FaceRecognitionSchema) {}
export class FaceRecognitionResultDto extends createZodDto(FaceRecognitionResultSchema) {}
export class FaceRecognitionResponseDto extends createZodDto(FaceRecognitionResponseSchema) {}

export const mapFaceRecognition = (
  face: Face,
  person: PersonResponseDto | null,
  distance: number | null,
): FaceRecognitionResultDto => ({
  boundingBox: face.boundingBox,
  score: face.score,
  matched: person !== null,
  distance: person ? distance : null,
  person,
});
