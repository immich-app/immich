import { createZodDto } from 'nestjs-zod';
import type { WorkflowAction, WorkflowFilter } from 'src/database';
import { PluginTriggerTypeSchema } from 'src/enum';
import { ActionConfigSchema, FilterConfigSchema } from 'src/types/plugin-schema.types';
import z from 'zod';

const WorkflowFilterItemSchema = z
  .object({
    pluginFilterId: z.uuidv4().describe('Plugin filter ID'),
    filterConfig: FilterConfigSchema.optional(),
  })
  .meta({ id: 'WorkflowFilterItemDto' });

const WorkflowActionItemSchema = z
  .object({
    pluginActionId: z.uuidv4().describe('Plugin action ID'),
    actionConfig: ActionConfigSchema.optional(),
  })
  .meta({ id: 'WorkflowActionItemDto' });

const WorkflowCreateSchema = z
  .object({
    triggerType: PluginTriggerTypeSchema,
    name: z.string().describe('Workflow name'),
    description: z.string().optional().describe('Workflow description'),
    enabled: z.boolean().optional().describe('Workflow enabled'),
    filters: z.array(WorkflowFilterItemSchema).describe('Workflow filters'),
    actions: z.array(WorkflowActionItemSchema).describe('Workflow actions'),
  })
  .meta({ id: 'WorkflowCreateDto' });

const WorkflowUpdateSchema = z
  .object({
    triggerType: PluginTriggerTypeSchema.optional(),
    name: z.string().optional().describe('Workflow name'),
    description: z.string().optional().describe('Workflow description'),
    enabled: z.boolean().optional().describe('Workflow enabled'),
    filters: z.array(WorkflowFilterItemSchema).optional().describe('Workflow filters'),
    actions: z.array(WorkflowActionItemSchema).optional().describe('Workflow actions'),
  })
  .meta({ id: 'WorkflowUpdateDto' });

const WorkflowFilterResponseSchema = z
  .object({
    id: z.string().describe('Filter ID'),
    workflowId: z.string().describe('Workflow ID'),
    pluginFilterId: z.string().describe('Plugin filter ID'),
    filterConfig: FilterConfigSchema.nullable(),
    order: z.number().describe('Filter order'),
  })
  .meta({ id: 'WorkflowFilterResponseDto' });

const WorkflowActionResponseSchema = z
  .object({
    id: z.string().describe('Action ID'),
    workflowId: z.string().describe('Workflow ID'),
    pluginActionId: z.string().describe('Plugin action ID'),
    actionConfig: ActionConfigSchema.nullable(),
    order: z.number().describe('Action order'),
  })
  .meta({ id: 'WorkflowActionResponseDto' });

const WorkflowResponseSchema = z
  .object({
    id: z.string().describe('Workflow ID'),
    ownerId: z.string().describe('Owner user ID'),
    triggerType: PluginTriggerTypeSchema,
    name: z.string().nullable().describe('Workflow name'),
    description: z.string().describe('Workflow description'),
    createdAt: z.string().describe('Creation date'),
    enabled: z.boolean().describe('Workflow enabled'),
    filters: z.array(WorkflowFilterResponseSchema).describe('Workflow filters'),
    actions: z.array(WorkflowActionResponseSchema).describe('Workflow actions'),
  })
  .meta({ id: 'WorkflowResponseDto' });

export class WorkflowCreateDto extends createZodDto(WorkflowCreateSchema) {}
export class WorkflowUpdateDto extends createZodDto(WorkflowUpdateSchema) {}
export class WorkflowResponseDto extends createZodDto(WorkflowResponseSchema) {}
class WorkflowFilterResponseDto extends createZodDto(WorkflowFilterResponseSchema) {}
class WorkflowActionResponseDto extends createZodDto(WorkflowActionResponseSchema) {}

export function mapWorkflowFilter(filter: WorkflowFilter): WorkflowFilterResponseDto {
  return {
    id: filter.id,
    workflowId: filter.workflowId,
    pluginFilterId: filter.pluginFilterId,
    filterConfig: filter.filterConfig,
    order: filter.order,
  };
}

export function mapWorkflowAction(action: WorkflowAction): WorkflowActionResponseDto {
  return {
    id: action.id,
    workflowId: action.workflowId,
    pluginActionId: action.pluginActionId,
    actionConfig: action.actionConfig,
    order: action.order,
  };
}
