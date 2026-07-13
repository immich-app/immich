import type { WorkflowStepConfig, WorkflowTrigger } from '@immich/plugin-sdk';
import { createZodDto } from 'nestjs-zod';
import { WorkflowResultSchema, WorkflowTriggerSchema, WorkflowTypeSchema } from 'src/enum';
import { isoDatetimeToDate } from 'src/validation';
import z from 'zod';

const WorkflowTriggerResponseSchema = z
  .object({
    trigger: WorkflowTriggerSchema.describe('Trigger type'),
    types: z.array(WorkflowTypeSchema).describe('Workflow types'),
  })
  .meta({ id: 'WorkflowTriggerResponseDto' });

const WorkflowSearchSchema = z
  .object({
    id: z.uuidv4().optional().describe('Workflow ID'),
    trigger: WorkflowTriggerSchema.optional().describe('Workflow trigger type'),
    name: z.string().optional().describe('Workflow name'),
    description: z.string().optional().describe('Workflow description'),
    enabled: z.boolean().optional().describe('Workflow enabled'),
    logging: z.boolean().optional().describe('Workflow logs run results'),
  })
  .meta({ id: 'WorkflowSearchDto' });

const WorkflowStepSchema = z
  .object({
    method: z.string().describe('Step plugin method'),
    config: z.record(z.string(), z.unknown()).nullable().describe('Step configuration'),
    enabled: z.boolean().optional().describe('Step is enabled'),
  })
  .meta({ id: 'WorkflowStepDto' });

const WorkflowShareStepSchema = z
  .object({
    method: z.string().describe('Step plugin method'),
    config: z.record(z.string(), z.unknown()).nullable().describe('Step configuration'),
    enabled: z.boolean().optional().describe('Step is enabled'),
  })
  .meta({ id: 'WorkflowShareStepDto' });

const WorkflowCreateSchema = z
  .object({
    trigger: WorkflowTriggerSchema.describe('Workflow trigger type'),
    name: z.string().nullable().optional().describe('Workflow name'),
    description: z.string().nullable().optional().describe('Workflow description'),
    enabled: z.boolean().optional().describe('Workflow enabled'),
    logging: z.boolean().optional().describe('Workflow logs run results'),
    steps: z.array(WorkflowStepSchema).optional(),
  })
  .meta({ id: 'WorkflowCreateDto' });

const WorkflowUpdateSchema = z
  .object({
    trigger: WorkflowTriggerSchema.optional().describe('Workflow trigger type'),
    name: z.string().nullable().optional().describe('Workflow name'),
    description: z.string().nullable().optional().describe('Workflow description'),
    enabled: z.boolean().optional().describe('Workflow enabled'),
    logging: z.boolean().optional().describe('Workflow logs run results'),
    steps: z.array(WorkflowStepSchema).optional(),
  })
  .meta({ id: 'WorkflowUpdateDto' });

const WorkflowResponseSchema = z
  .object({
    id: z.uuidv4().describe('Workflow ID'),
    trigger: WorkflowTriggerSchema.describe('Workflow trigger type'),
    name: z.string().nullable().describe('Workflow name'),
    description: z.string().nullable().describe('Workflow description'),
    createdAt: z.string().describe('Creation date'),
    updatedAt: z.string().describe('Update date'),
    enabled: z.boolean().describe('Workflow enabled'),
    logging: z.boolean().describe('Workflow logs run results'),
    steps: z.array(WorkflowStepSchema).describe('Workflow steps'),
  })
  .meta({ id: 'WorkflowResponseDto' });

const WorkflowShareResponseSchema = z
  .object({
    trigger: WorkflowTriggerSchema.describe('Workflow trigger type'),
    name: z.string().nullable().describe('Workflow name'),
    description: z.string().nullable().describe('Workflow description'),
    steps: z.array(WorkflowShareStepSchema).describe('Workflow steps'),
  })
  .meta({ id: 'WorkflowShareResponseDto' });

const WorkflowLogEntrySchema = z
  .object({
    at: z.string().describe('Workflow run date/time'),
    result: WorkflowResultSchema.describe('Workflow run result'),
    triggerDataId: z.uuid().optional().describe('Workflow trigger data ID'),
    lastStep: z
      .object({
        method: z.string().describe('Method of the step'),
        index: z.int().positive().describe('Index of the step in the workflow'),
      })
      .optional()
      .describe('Last step ran, if the workflow ended early'),
  })
  .meta({ id: 'WorkflowLogEntryDto' });

const WorkflowGetLogsSchema = z.object({
  result: WorkflowResultSchema.optional().describe('Filter by run result'),
  before: isoDatetimeToDate.optional().describe('Filter by runs before a date/time'),
  limit: z.coerce.number().int().positive().default(50).describe('Maximum number of logs'),
});

export class WorkflowTriggerResponseDto extends createZodDto(WorkflowTriggerResponseSchema) {}
export class WorkflowSearchDto extends createZodDto(WorkflowSearchSchema) {}
export class WorkflowCreateDto extends createZodDto(WorkflowCreateSchema) {}
export class WorkflowUpdateDto extends createZodDto(WorkflowUpdateSchema) {}
export class WorkflowResponseDto extends createZodDto(WorkflowResponseSchema) {}
export class WorkflowShareResponseDto extends createZodDto(WorkflowShareResponseSchema) {}
export class WorkflowLogEntryDto extends createZodDto(WorkflowLogEntrySchema) {}
export class WorkflowGetLogsDto extends createZodDto(WorkflowGetLogsSchema) {}

type Workflow = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  trigger: WorkflowTrigger;
  name: string | null;
  description: string | null;
  enabled: boolean;
  logging: boolean;
};

type WorkflowStep = {
  enabled: boolean;
  methodName: string;
  config: WorkflowStepConfig | null;
  pluginName: string;
};

export const mapWorkflow = (workflow: Workflow & { steps: WorkflowStep[] }): WorkflowResponseDto => {
  return {
    id: workflow.id,
    enabled: workflow.enabled,
    trigger: workflow.trigger,
    logging: workflow.logging,
    name: workflow.name,
    description: workflow.description,
    createdAt: workflow.createdAt.toISOString(),
    updatedAt: workflow.updatedAt.toISOString(),
    steps: workflow.steps.map((step) => ({
      method: `${step.pluginName}#${step.methodName}`,
      // TODO fix this
      config: step.config as any,
      enabled: step.enabled,
    })),
  };
};

export const mapWorkflowShare = (workflow: Workflow & { steps: WorkflowStep[] }): WorkflowShareResponseDto => {
  return {
    trigger: workflow.trigger,
    name: workflow.name,
    description: workflow.description,
    steps: workflow.steps.map((step) => ({
      method: `${step.pluginName}#${step.methodName}`,
      // TODO fix this
      config: step.config as any,
      enabled: step.enabled ? undefined : false,
    })),
  };
};
