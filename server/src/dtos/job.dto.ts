import z from 'zod';
import { ManualJobNameSchema } from 'src/enum.js';
import { createZodDto } from 'src/zod.js';

const JobCreateSchema = z
  .object({
    name: ManualJobNameSchema,
  })
  .meta({ id: 'JobCreateDto' });

export class JobCreateDto extends createZodDto(JobCreateSchema) {}
