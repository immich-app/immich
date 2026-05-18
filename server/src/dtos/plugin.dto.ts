import { createZodDto } from 'nestjs-zod';
import { JsonSchemaDto } from 'src/dtos/json-schema.dto';
import { WorkflowTriggerSchema, WorkflowType, WorkflowTypeSchema } from 'src/enum';
import { asMethodString } from 'src/utils/workflow';
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
    id: z.string().describe('Plugin ID'),
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
    key: asMethodString({ pluginName: method.pluginName, methodName: method.name }),
    name: method.name,
    title: method.title,
    hostFunctions: method.hostFunctions,
    uiHints: method.uiHints,
    description: method.description,
    types: method.types,
    schema: method.schema as any,
  };
};
