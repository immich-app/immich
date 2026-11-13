import z from 'zod';
import { createZodDto } from 'src/zod.js';

const TrashResponseSchema = z
  .object({
    count: z.int().describe('Number of items in trash'),
  })
  .meta({ id: 'TrashResponseDto' });

export class TrashResponseDto extends createZodDto(TrashResponseSchema) {}
