import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const AssetOcrResponseSchema = z
  .object({
    assetId: z.uuidv4(),
    boxScore: z.number().meta({ format: 'double' }).describe('Confidence score for text detection box'),
    id: z.uuidv4(),
    text: z.string().describe('Recognized text'),
    textScore: z.number().meta({ format: 'double' }).describe('Confidence score for text recognition'),
    x1: z.number().meta({ format: 'double' }).describe('Normalized x coordinate of box corner 1 (0-1)'),
    x2: z.number().meta({ format: 'double' }).describe('Normalized x coordinate of box corner 2 (0-1)'),
    x3: z.number().meta({ format: 'double' }).describe('Normalized x coordinate of box corner 3 (0-1)'),
    x4: z.number().meta({ format: 'double' }).describe('Normalized x coordinate of box corner 4 (0-1)'),
    y1: z.number().meta({ format: 'double' }).describe('Normalized y coordinate of box corner 1 (0-1)'),
    y2: z.number().meta({ format: 'double' }).describe('Normalized y coordinate of box corner 2 (0-1)'),
    y3: z.number().meta({ format: 'double' }).describe('Normalized y coordinate of box corner 3 (0-1)'),
    y4: z.number().meta({ format: 'double' }).describe('Normalized y coordinate of box corner 4 (0-1)'),
  })
  .meta({ id: 'AssetOcrResponseDto' });

export class AssetOcrResponseDto extends createZodDto(AssetOcrResponseSchema) {}
