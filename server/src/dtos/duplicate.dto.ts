import { createZodDto } from 'nestjs-zod';
import { AssetResponseSchema } from 'src/dtos/asset-response.dto';
import { z } from 'zod';

export const DuplicateResponseSchema = z
  .object({
    duplicateId: z.string().describe('Duplicate group ID'),
    assets: z.array(AssetResponseSchema),
  })
  .meta({ id: 'DuplicateResponseDto' });

export class DuplicateResponseDto extends createZodDto(DuplicateResponseSchema) {}
