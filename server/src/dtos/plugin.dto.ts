import { createZodDto } from 'nestjs-zod';
import { PluginAction, PluginFilter } from 'src/database';
import { PluginContextSchema, PluginTriggerTypeSchema } from 'src/enum';
import { JSONSchemaSchema } from 'src/types/plugin-schema.types';
import z from 'zod';

const PluginTriggerResponseSchema = z
  .object({
    type: PluginTriggerTypeSchema,
    contextType: PluginContextSchema,
  })
  .meta({ id: 'PluginTriggerResponseDto' });

const PluginFilterResponseSchema = z
  .object({
    id: z.string().describe('Filter ID'),
    pluginId: z.string().describe('Plugin ID'),
    methodName: z.string().describe('Method name'),
    title: z.string().describe('Filter title'),
    description: z.string().describe('Filter description'),
    supportedContexts: z.array(PluginContextSchema).describe('Supported contexts'),
    schema: JSONSchemaSchema.nullable().describe('Filter schema'),
  })
  .meta({ id: 'PluginFilterResponseDto' });

const PluginActionResponseSchema = z
  .object({
    id: z.string().describe('Action ID'),
    pluginId: z.string().describe('Plugin ID'),
    methodName: z.string().describe('Method name'),
    title: z.string().describe('Action title'),
    description: z.string().describe('Action description'),
    supportedContexts: z.array(PluginContextSchema).describe('Supported contexts'),
    schema: JSONSchemaSchema.nullable().describe('Action schema'),
  })
  .meta({ id: 'PluginActionResponseDto' });

const PluginResponseSchema = z
  .object({
    id: z.string().describe('Plugin ID'),
    name: z.string().describe('Plugin name'),
    title: z.string().describe('Plugin title'),
    description: z.string().describe('Plugin description'),
    author: z.string().describe('Plugin author'),
    version: z.string().describe('Plugin version'),
    createdAt: z.string().describe('Creation date'),
    updatedAt: z.string().describe('Last update date'),
    filters: z.array(PluginFilterResponseSchema).describe('Plugin filters'),
    actions: z.array(PluginActionResponseSchema).describe('Plugin actions'),
  })
  .meta({ id: 'PluginResponseDto' });

export class PluginTriggerResponseDto extends createZodDto(PluginTriggerResponseSchema) {}
export class PluginResponseDto extends createZodDto(PluginResponseSchema) {}

type MapPlugin = {
  id: string;
  name: string;
  title: string;
  description: string;
  author: string;
  version: string;
  wasmPath: string;
  createdAt: Date;
  updatedAt: Date;
  filters: PluginFilter[];
  actions: PluginAction[];
};

export function mapPlugin(plugin: MapPlugin): PluginResponseDto {
  return {
    id: plugin.id,
    name: plugin.name,
    title: plugin.title,
    description: plugin.description,
    author: plugin.author,
    version: plugin.version,
    createdAt: plugin.createdAt.toISOString(),
    updatedAt: plugin.updatedAt.toISOString(),
    filters: plugin.filters,
    actions: plugin.actions,
  };
}
