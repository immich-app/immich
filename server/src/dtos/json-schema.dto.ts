import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const JsonSchemaTypeSchema = z
  .enum(['string', 'number', 'integer', 'boolean', 'object'])
  .meta({ id: 'JsonSchemaType' });

const JsonSchemaPropertySchema = z
  .object({
    type: JsonSchemaTypeSchema.optional().default('object').describe('Type'),
    title: z.string().describe('Title'),
    description: z.string().describe('Description'),
    default: z.any().optional().describe('Default value'),
    enum: z.array(z.string()).optional().describe('Valid choices for enum types'),
    minimum: z.number().optional().describe('Minimum value for number types'),
    maximum: z.number().optional().describe('Maximum value for number types'),
    precision: z.number().default(1).optional().describe('Smallest interval (granularity) for number types'),
    array: z.boolean().optional().describe('Type is an array type'),
    required: z.array(z.string()).optional().describe('A list of required properties'),
    uiHint: z
      .object({
        type: z.string().optional(),
        order: z.int().optional(),
      })
      .optional(),
    get properties() {
      return z.record(z.string(), JsonSchemaPropertySchema).optional();
    },
  })
  .meta({ id: 'JsonSchemaPropertyDto' });

export const JsonSchemaSchema = z
  .object({
    ...JsonSchemaPropertySchema.shape,
    title: z.string().optional().describe('Title'),
    description: z.string().optional().describe('Description'),
  })
  .meta({ id: 'JsonSchemaDto' });

export class JsonSchemaDto extends createZodDto(JsonSchemaSchema) {}
