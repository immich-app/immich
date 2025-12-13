import { Type } from 'class-transformer';
import { IsNotEmpty, IsObject, IsString, IsUUID, ValidateNested } from 'class-validator';
import { WorkflowAction, WorkflowFilter } from 'src/database';
import { PluginTriggerType } from 'src/enum';
import type { ActionConfig, FilterConfig } from 'src/types/plugin-schema.types';
import { Optional, ValidateBoolean, ValidateEnum } from 'src/validation';

export class WorkflowFilterItemDto {
  @IsUUID()
  pluginFilterId!: string;

  @IsObject()
  @Optional()
  filterConfig?: FilterConfig;
}

export class WorkflowActionItemDto {
  @IsUUID()
  pluginActionId!: string;

  @IsObject()
  @Optional()
  actionConfig?: ActionConfig;
}

export class WorkflowCreateDto {
  @ValidateEnum({ enum: PluginTriggerType, name: 'PluginTriggerType' })
  triggerType!: PluginTriggerType;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @Optional()
  description?: string;

  @ValidateBoolean({ optional: true })
  enabled?: boolean;

  @ValidateNested({ each: true })
  @Type(() => WorkflowFilterItemDto)
  filters!: WorkflowFilterItemDto[];

  @ValidateNested({ each: true })
  @Type(() => WorkflowActionItemDto)
  actions!: WorkflowActionItemDto[];
}

export class WorkflowUpdateDto {
  @IsString()
  @IsNotEmpty()
  @Optional()
  name?: string;

  @IsString()
  @Optional()
  description?: string;

  @ValidateBoolean({ optional: true })
  enabled?: boolean;

  @ValidateNested({ each: true })
  @Type(() => WorkflowFilterItemDto)
  @Optional()
  filters?: WorkflowFilterItemDto[];

  @ValidateNested({ each: true })
  @Type(() => WorkflowActionItemDto)
  @Optional()
  actions?: WorkflowActionItemDto[];
}

export class WorkflowResponseDto {
  id!: string;
  ownerId!: string;
  triggerType!: PluginTriggerType;
  name!: string | null;
  description!: string;
  createdAt!: string;
  enabled!: boolean;
  filters!: WorkflowFilterResponseDto[];
  actions!: WorkflowActionResponseDto[];
}

export class WorkflowFilterResponseDto {
  id!: string;
  workflowId!: string;
  pluginFilterId!: string;
  filterConfig!: FilterConfig | null;
  order!: number;
}

export class WorkflowActionResponseDto {
  id!: string;
  workflowId!: string;
  pluginActionId!: string;
  actionConfig!: ActionConfig | null;
  order!: number;
}

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
