import { createZodDto } from '@immich/nestjs-standard-schema/zod';
import z from 'zod';

export const StitchModeSchema = z.enum(['scroll', 'panorama']).describe('StitchMode');

export class StitchRequestDto extends createZodDto({
  assetIds: z.array(z.uuidv4()).min(2).max(50).describe('Image asset IDs to stitch, in order'),
  mode: StitchModeSchema.default('scroll').describe('scroll = vertical screenshots, panorama = horizontal sweep'),
}) {}
