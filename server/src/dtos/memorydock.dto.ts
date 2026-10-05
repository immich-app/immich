import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const MemoryDockStyleTransformSchema = z
  .object({
    assetId: z.uuidv4().describe('Asset ID to transform'),
    style: z.literal('ghibli').describe('Style transform preset'),
  })
  .meta({ id: 'MemoryDockStyleTransformDto' });

export class MemoryDockStyleTransformDto extends createZodDto(MemoryDockStyleTransformSchema) {}
