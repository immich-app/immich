import { createZodDto } from '@immich/nestjs-standard-schema/zod';
import z from 'zod';

const TrashResponseSchema = z
  .object({
    count: z.int().describe('Number of items in trash'),
  })
  .meta({ id: 'TrashResponseDto' });

export class TrashResponseDto extends createZodDto(TrashResponseSchema) {}
