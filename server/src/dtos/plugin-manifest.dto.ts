import { createZodDto } from 'nestjs-zod';
import { JsonSchemaSchema } from 'src/dtos/json-schema.dto';
import { WorkflowTriggerSchema, WorkflowTypeSchema } from 'src/enum';
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

const PluginManifestTemplateStepSchema = z
  .object({
    method: z.string().min(1).describe('Step plugin method (pluginName#methodName)'),
    config: z.record(z.string(), z.unknown()).nullable().optional().describe('Step configuration'),
    enabled: z.boolean().optional().describe('Whether the step is enabled'),
  })
  .meta({ id: 'PluginManifestTemplateStepDto' });

const PluginManifestTemplateSchema = z
  .object({
    name: z.string().min(1).describe('Template name (must be unique within the manifest)'),
    title: z.string().min(1).describe('Template title'),
    description: z.string().min(1).describe('Template description'),
    trigger: WorkflowTriggerSchema.describe('Workflow trigger'),
    steps: z.array(PluginManifestTemplateStepSchema).describe('Workflow steps'),
    uiHints: z.array(z.string()).optional().default([]).describe('Ui hints, for example "smart-album"'),
  })
  .meta({ id: 'PluginManifestTemplateDto' });

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
    allowedHosts: z.array(z.string()).optional().default([]).describe('Hostnames the plugin can access'),
    templates: z
      .array(PluginManifestTemplateSchema)
      .optional()
      .default([])
      .refine((templates) => new Set(templates.map((t) => t.name)).size === templates.length, {
        error: 'Template names must be unique within the manifest',
      })
      .describe('Workflow templates'),
  })
  .meta({ id: 'PluginManifestDto' });

export class PluginManifestDto extends createZodDto(PluginManifestSchema) {}
