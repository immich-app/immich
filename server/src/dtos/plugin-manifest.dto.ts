import { createZodDto } from 'nestjs-zod';
import { PluginContextSchema } from 'src/enum';
import { JSONSchemaSchema } from 'src/types/plugin-schema.types';
import z from 'zod';

const pluginNameRegex = /^[a-z0-9-]+[a-z0-9]$/;
const semverRegex =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

const PluginManifestWasmSchema = z
  .object({
    path: z.string().describe('WASM file path'),
  })
  .meta({ id: 'PluginManifestWasmDto' });

const PluginManifestFilterSchema = z
  .object({
    methodName: z.string().describe('Filter method name'),
    title: z.string().describe('Filter title'),
    description: z.string().describe('Filter description'),
    supportedContexts: z.array(PluginContextSchema).min(1).describe('Supported contexts'),
    schema: JSONSchemaSchema.optional(),
  })
  .meta({ id: 'PluginManifestFilterDto' });

const PluginManifestActionSchema = z
  .object({
    methodName: z.string().describe('Action method name'),
    title: z.string().describe('Action title'),
    description: z.string().describe('Action description'),
    supportedContexts: z.array(PluginContextSchema).min(1).describe('Supported contexts'),
    schema: JSONSchemaSchema.optional(),
  })
  .meta({ id: 'PluginManifestActionDto' });

export const PluginManifestSchema = z
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
    title: z.string().describe('Plugin title'),
    description: z.string().describe('Plugin description'),
    author: z.string().describe('Plugin author'),
    wasm: PluginManifestWasmSchema,
    filters: z.array(PluginManifestFilterSchema).optional().describe('Plugin filters'),
    actions: z.array(PluginManifestActionSchema).optional().describe('Plugin actions'),
  })
  .meta({ id: 'PluginManifestDto' });

export class PluginManifestDto extends createZodDto(PluginManifestSchema) {}
