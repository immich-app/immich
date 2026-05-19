import { createZodDto } from 'nestjs-zod';
import { JsonSchemaSchema } from 'src/dtos/json-schema.dto';
import { WorkflowTypeSchema } from 'src/enum';
import z from 'zod';

const pluginNameRegex = /^[a-z0-9-]+[a-z0-9]$/;
const semverRegex =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

export const PluginManifestMethodSchemaSchema = JsonSchemaSchema.nullable()
  .optional()
  .transform((value) => (value && Object.keys(value).length === 0 ? null : value));

const PluginManifestMethodSchema = z
  .object({
    name: z.string().min(1).describe('Method name'),
    title: z.string().min(1).describe('Method title'),
    description: z.string().min(1).describe('Method description'),
    types: z.array(WorkflowTypeSchema).min(1).describe('Workflow type'),
    hostFunctions: z.boolean().optional().default(false).describe('Method uses host functions'),
    schema: PluginManifestMethodSchemaSchema.describe('Schema'),
    uiHints: z.array(z.string()).optional().describe('Ui hints, for example "filter"'),
  })
  .meta({ id: 'PluginManifestMethodDto' });

const PluginManifestSchema = z
  .object({
    name: z
      .string()
      .min(1)
      .regex(
        pluginNameRegex,
        'Plugin name must contain only lowercase letters, numbers, and hyphens, and cannot end with a hyphen',
      )
      .describe('Plugin name (lowercase, numbers, hyphens only)'),
    version: z.string().regex(semverRegex).describe('Plugin version (semver)'),
    title: z.string().min(1).describe('Plugin title'),
    description: z.string().min(1).describe('Plugin description'),
    wasmPath: z.string().min(1).describe('WASM file path'),
    author: z.string().min(1).describe('Plugin author'),
    methods: z.array(PluginManifestMethodSchema).optional().default([]).describe('Plugin methods'),
  })
  .meta({ id: 'PluginManifestDto' });

export class PluginManifestDto extends createZodDto(PluginManifestSchema) {}
