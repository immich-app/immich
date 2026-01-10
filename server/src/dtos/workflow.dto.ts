import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsObject, IsString, IsUUID, ValidateNested } from 'class-validator';
import { WorkflowAction, WorkflowFilter } from 'src/database';
import { PluginTriggerType } from 'src/enum';
import type { ActionConfig, FilterConfig } from 'src/types/plugin-schema.types';
import { Optional, ValidateBoolean, ValidateEnum } from 'src/validation';

export class WorkflowFilterItemDto {
  @ApiProperty({ description: 'Plugin filter ID' })
  @IsUUID()
  pluginFilterId!: string;

  @ApiPropertyOptional({ description: 'Filter configuration' })
  @IsObject()
  @Optional()
  filterConfig?: FilterConfig;
}

export class WorkflowActionItemDto {
  @ApiProperty({ description: 'Plugin action ID' })
  @IsUUID()
  pluginActionId!: string;

  @ApiPropertyOptional({ description: 'Action configuration' })
  @IsObject()
  @Optional()
  actionConfig?: ActionConfig;
}

export class WorkflowCreateDto {
  @ApiProperty({ description: 'Workflow trigger type', enum: PluginTriggerType })
  @ValidateEnum({ enum: PluginTriggerType, name: 'PluginTriggerType' })
  triggerType!: PluginTriggerType;

  @ApiProperty({ description: 'Workflow name' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ description: 'Workflow description' })
  @IsString()
  @Optional()
  description?: string;

  @ApiPropertyOptional({ description: 'Workflow enabled', default: true })
  @ValidateBoolean({ optional: true })
  enabled?: boolean;

  @ApiProperty({ description: 'Workflow filters', type: () => [WorkflowFilterItemDto] })
  @ValidateNested({ each: true })
  @Type(() => WorkflowFilterItemDto)
  filters!: WorkflowFilterItemDto[];

  @ApiProperty({ description: 'Workflow actions', type: () => [WorkflowActionItemDto] })
  @ValidateNested({ each: true })
  @Type(() => WorkflowActionItemDto)
  actions!: WorkflowActionItemDto[];
}

export class WorkflowUpdateDto {
  @ApiPropertyOptional({ description: 'Workflow trigger type', enum: PluginTriggerType })
  @ValidateEnum({ enum: PluginTriggerType, name: 'PluginTriggerType', optional: true })
  triggerType?: PluginTriggerType;

  @ApiPropertyOptional({ description: 'Workflow name' })
  @IsString()
  @IsNotEmpty()
  @Optional()
  name?: string;

  @ApiPropertyOptional({ description: 'Workflow description' })
  @IsString()
  @Optional()
  description?: string;

  @ApiPropertyOptional({ description: 'Workflow enabled' })
  @ValidateBoolean({ optional: true })
  enabled?: boolean;

  @ApiPropertyOptional({ description: 'Workflow filters', type: () => [WorkflowFilterItemDto] })
  @ValidateNested({ each: true })
  @Type(() => WorkflowFilterItemDto)
  @Optional()
  filters?: WorkflowFilterItemDto[];

  @ApiPropertyOptional({ description: 'Workflow actions', type: () => [WorkflowActionItemDto] })
  @ValidateNested({ each: true })
  @Type(() => WorkflowActionItemDto)
  @Optional()
  actions?: WorkflowActionItemDto[];
}

export class WorkflowResponseDto {
  @ApiProperty({ description: 'Workflow ID' })
  id!: string;
  @ApiProperty({ description: 'Owner user ID' })
  ownerId!: string;
  @ApiProperty({ description: 'Workflow trigger type', enum: PluginTriggerType })
  @ValidateEnum({ enum: PluginTriggerType, name: 'PluginTriggerType' })
  triggerType!: PluginTriggerType;
  @ApiProperty({ description: 'Workflow name', nullable: true })
  name!: string | null;
  @ApiProperty({ description: 'Workflow description' })
  description!: string;
  @ApiProperty({ description: 'Creation date' })
  createdAt!: string;
  @ApiProperty({ description: 'Workflow enabled' })
  enabled!: boolean;
  @ApiProperty({ description: 'Workflow filters', type: () => [WorkflowFilterResponseDto] })
  filters!: WorkflowFilterResponseDto[];
  @ApiProperty({ description: 'Workflow actions', type: () => [WorkflowActionResponseDto] })
  actions!: WorkflowActionResponseDto[];
}

export class WorkflowFilterResponseDto {
  @ApiProperty({ description: 'Filter ID' })
  id!: string;
  @ApiProperty({ description: 'Workflow ID' })
  workflowId!: string;
  @ApiProperty({ description: 'Plugin filter ID' })
  pluginFilterId!: string;
  @ApiProperty({ description: 'Filter configuration', nullable: true })
  filterConfig!: FilterConfig | null;
  @ApiProperty({ description: 'Filter order', type: 'integer' })
  order!: number;
}

export class WorkflowActionResponseDto {
  @ApiProperty({ description: 'Action ID' })
  id!: string;
  @ApiProperty({ description: 'Workflow ID' })
  workflowId!: string;
  @ApiProperty({ description: 'Plugin action ID' })
  pluginActionId!: string;
  @ApiProperty({ description: 'Action configuration', nullable: true })
  actionConfig!: ActionConfig | null;
  @ApiProperty({ description: 'Action order', type: 'integer' })
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
