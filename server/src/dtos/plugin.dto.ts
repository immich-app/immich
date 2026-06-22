import { WorkflowTrigger } from '@immich/plugin-sdk';
import { createZodDto } from 'nestjs-zod';
import { JsonSchemaDto } from 'src/dtos/json-schema.dto';
import { WorkflowTriggerSchema, WorkflowType, WorkflowTypeSchema } from 'src/enum';
import { asPluginKey } from 'src/utils/workflow';
import z from 'zod';

const PluginSearchSchema = z
  .object({
    id: z.uuidv4().optional().describe('Plugin ID'),
    enabled: z.boolean().optional().describe('Whether the plugin is enabled'),
    name: z.string().optional(),
    version: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
  })
  .meta({ id: 'PluginSearchDto' });

const PluginMethodResponseSchema = z
  .object({
    key: z.string().describe('Key'),
    name: z.string().describe('Name'),
    title: z.string().describe('Title'),
    description: z.string().describe('Description'),
    types: z.array(WorkflowTypeSchema).describe('Workflow types'),
    uiHints: z.array(z.string()).describe('Ui hints'),
    // TODO fix this
    schema: z.object().optional(),
    hostFunctions: z.boolean(),
  })
  .meta({ id: 'PluginMethodResponseDto' });

const PluginResponseSchema = z
  .object({
    id: z.uuidv4().describe('Plugin ID'),
    name: z.string().describe('Plugin name'),
    title: z.string().describe('Plugin title'),
    description: z.string().describe('Plugin description'),
    author: z.string().describe('Plugin author'),
    version: z.string().describe('Plugin version'),
    createdAt: z.string().describe('Creation date'),
    updatedAt: z.string().describe('Last update date'),
    methods: z.array(PluginMethodResponseSchema).describe('Plugin methods'),
  })
  .meta({ id: 'PluginResponseDto' });

const PluginTemplateStepResponseSchema = z
  .object({
    method: z.string().describe('Step plugin method'),
    config: z.record(z.string(), z.unknown()).nullable().describe('Step configuration'),
    enabled: z.boolean().optional().describe('Whether the step is enabled'),
  })
  .meta({ id: 'PluginTemplateStepResponseDto' });

const PluginTemplateResponseSchema = z
  .object({
    key: z.string().describe('Template key (unique across all templates)'),
    title: z.string().describe('Template title'),
    description: z.string().describe('Template description'),
    trigger: WorkflowTriggerSchema.describe('Workflow trigger'),
    steps: z.array(PluginTemplateStepResponseSchema).describe('Workflow steps'),
    uiHints: z.array(z.string()).describe('Ui hints, for example "smart-album"'),
  })
  .meta({ id: 'PluginTemplateResponseDto' });

const PluginMethodSearchSchema = z
  .object({
    id: z.uuidv4().optional().describe('Plugin method ID'),
    enabled: z.boolean().optional().describe('Whether the plugin method is enabled'),
    name: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    type: WorkflowTypeSchema.optional().describe('Workflow types'),
    trigger: WorkflowTriggerSchema.optional().describe('Workflow trigger'),
    pluginName: z.string().optional().describe('Plugin name'),
    pluginVersion: z.string().optional().describe('Plugin version'),
  })
  .meta({ id: 'PluginMethodSearchDto' });

export class PluginSearchDto extends createZodDto(PluginSearchSchema) {}
export class PluginResponseDto extends createZodDto(PluginResponseSchema) {}
export class PluginMethodSearchDto extends createZodDto(PluginMethodSearchSchema) {}
export class PluginMethodResponseDto extends createZodDto(PluginMethodResponseSchema) {}
export class PluginTemplateResponseDto extends createZodDto(PluginTemplateResponseSchema) {}

export type PluginTemplate = {
  name: string;
  title: string;
  description: string;
  trigger: WorkflowTrigger;
  steps: Array<{
    method: string;
    config?: Record<string, unknown> | null;
    enabled?: boolean;
  }>;
  uiHints: string[];
};

export const mapTemplate = (plugin: { name: string }, template: PluginTemplate): PluginTemplateResponseDto => {
  return {
    key: asPluginKey({ pluginName: plugin.name, name: template.name }),
    title: template.title,
    description: template.description,
    trigger: template.trigger,
    steps: template.steps.map((step) => ({
      method: step.method,
      config: step.config ?? null,
      enabled: step.enabled,
    })),
    uiHints: template.uiHints ?? [],
  };
};

type Plugin = {
  id: string;
  name: string;
  title: string;
  description: string;
  author: string;
  version: string;
  createdAt: Date;
  updatedAt: Date;
  methods: PluginMethod[];
};

type PluginMethod = {
  pluginName: string;
  name: string;
  title: string;
  description: string;
  types: WorkflowType[];
  schema: JsonSchemaDto | null;
  hostFunctions: boolean;
  uiHints: string[];
};

export function mapPlugin(plugin: Plugin): PluginResponseDto {
  return {
    id: plugin.id,
    name: plugin.name,
    title: plugin.title,
    description: plugin.description,
    author: plugin.author,
    version: plugin.version,
    createdAt: plugin.createdAt.toISOString(),
    updatedAt: plugin.updatedAt.toISOString(),
    methods: plugin.methods.map((method) => mapMethod(method)),
  };
}

export const mapMethod = (method: PluginMethod): PluginMethodResponseDto => {
  return {
    key: asPluginKey({ pluginName: method.pluginName, name: method.name }),
    name: method.name,
    title: method.title,
    hostFunctions: method.hostFunctions,
    uiHints: method.uiHints,
    description: method.description,
    types: method.types,
    schema: method.schema as any,
  };
};
