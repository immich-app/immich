import { createZodDto } from 'nestjs-zod';
import { ManualJobNameSchema } from 'src/enum';
import z from 'zod';

const JobCreateSchema = z
  .object({
    name: ManualJobNameSchema,
  })
  .meta({ id: 'JobCreateDto' });

export class JobCreateDto extends createZodDto(JobCreateSchema) {}
