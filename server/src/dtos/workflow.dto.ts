import { IsNotEmpty, IsObject, IsString, IsUUID } from 'class-validator';
import { PluginTriggerType } from 'src/schema/tables/plugin.table';
import type { ActionConfig, FilterConfig, TriggerConfig } from 'src/types/plugin-schema.types';
import { Optional, ValidateBoolean, ValidateEnum } from 'src/validation';

export class WorkflowCreateDto {
  @ValidateEnum({ enum: PluginTriggerType, name: 'PluginTriggerType' })
  triggerType!: PluginTriggerType;

  @IsObject()
  @Optional()
  triggerConfig?: TriggerConfig;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  displayName!: string;

  @IsString()
  @Optional()
  description?: string;

  @ValidateBoolean({ optional: true })
  enabled?: boolean;
}

export class WorkflowUpdateDto {
  @IsString()
  @IsNotEmpty()
  @Optional()
  name?: string;

  @IsString()
  @IsNotEmpty()
  @Optional()
  displayName?: string;

  @IsString()
  @Optional()
  description?: string;

  @ValidateBoolean({ optional: true })
  enabled?: boolean;

  @IsObject()
  @Optional()
  triggerConfig?: TriggerConfig;
}

export class WorkflowResponseDto {
  id!: string;
  ownerId!: string;
  triggerType!: PluginTriggerType;
  triggerConfig!: TriggerConfig | null;
  name!: string;
  displayName!: string;
  description!: string;
  createdAt!: string;
  enabled!: boolean;
  filters!: WorkflowFilterResponseDto[];
  actions!: WorkflowActionResponseDto[];
}

export class WorkflowFilterResponseDto {
  id!: string;
  workflowId!: string;
  filterId!: string;
  filterConfig!: FilterConfig | null;
  order!: number;
}

export class WorkflowActionResponseDto {
  id!: string;
  workflowId!: string;
  actionId!: string;
  actionConfig!: ActionConfig | null;
  order!: number;
}

export class WorkflowFilterCreateDto {
  @IsUUID()
  filterId!: string;

  @IsObject()
  @Optional()
  filterConfig?: FilterConfig;
}

export class WorkflowActionCreateDto {
  @IsUUID()
  actionId!: string;

  @IsObject()
  @Optional()
  actionConfig?: ActionConfig;
}
