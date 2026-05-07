/**
 * JSON Schema types for plugin configuration schemas
 * Based on JSON Schema Draft 7
 */

import z from 'zod';

const JSONSchemaTypeSchema = z
  .enum(['string', 'number', 'integer', 'boolean', 'object', 'array', 'null'])
  .meta({ id: 'PluginJsonSchemaType' });

const JSONSchemaPropertySchema = z
  .object({
    type: JSONSchemaTypeSchema.optional(),
    description: z.string().optional(),
    default: z.any().optional(),
    enum: z.array(z.string()).optional(),

    get items() {
      return JSONSchemaPropertySchema.optional();
    },

    get properties() {
      return z.record(z.string(), JSONSchemaPropertySchema).optional();
    },

    required: z.array(z.string()).optional(),

    get additionalProperties() {
      return z.union([z.boolean(), JSONSchemaPropertySchema]).optional();
    },
  })
  .meta({ id: 'PluginJsonSchemaProperty' });

export type JSONSchemaProperty = z.infer<typeof JSONSchemaPropertySchema>;

export const JSONSchemaSchema = z
  .object({
    type: JSONSchemaTypeSchema.optional(),
    properties: z.record(z.string(), JSONSchemaPropertySchema).optional(),
    required: z.array(z.string()).optional(),
    additionalProperties: z.boolean().optional(),
    description: z.string().optional(),
  })
  .meta({ id: 'PluginJsonSchema' });
export type JSONSchema = z.infer<typeof JSONSchemaSchema>;

type ConfigValue = string | number | boolean | null | ConfigValue[] | { [key: string]: ConfigValue };

const ConfigValueSchema: z.ZodType<ConfigValue> = z.any().meta({ id: 'PluginConfigValue' });

export const FilterConfigSchema = z.record(z.string(), ConfigValueSchema).meta({ id: 'WorkflowFilterConfig' });
export type FilterConfig = z.infer<typeof FilterConfigSchema>;

export const ActionConfigSchema = z.record(z.string(), ConfigValueSchema).meta({ id: 'WorkflowActionConfig' });
export type ActionConfig = z.infer<typeof ActionConfigSchema>;
