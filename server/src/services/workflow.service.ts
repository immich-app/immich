import { BadRequestException, Injectable } from '@nestjs/common';
import { Workflow } from 'src/database';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  mapWorkflowAction,
  mapWorkflowFilter,
  WorkflowCreateDto,
  WorkflowResponseDto,
  WorkflowUpdateDto,
} from 'src/dtos/workflow.dto';
import { Permission, PluginContext, PluginTriggerType } from 'src/enum';
import { pluginTriggers } from 'src/plugins';

import { BaseService } from 'src/services/base.service';

@Injectable()
export class WorkflowService extends BaseService {
  async create(auth: AuthDto, dto: WorkflowCreateDto): Promise<WorkflowResponseDto> {
    const context = this.getContextForTrigger(dto.triggerType);

    const filterInserts = await this.validateAndMapFilters(dto.filters, context);
    const actionInserts = await this.validateAndMapActions(dto.actions, context);

    const workflow = await this.workflowRepository.createWorkflow(
      {
        ownerId: auth.user.id,
        triggerType: dto.triggerType,
        name: dto.name,
        description: dto.description || '',
        enabled: dto.enabled ?? true,
      },
      filterInserts,
      actionInserts,
    );

    return this.mapWorkflow(workflow);
  }

  async getAll(auth: AuthDto): Promise<WorkflowResponseDto[]> {
    const workflows = await this.workflowRepository.getWorkflowsByOwner(auth.user.id);

    return Promise.all(workflows.map((workflow) => this.mapWorkflow(workflow)));
  }

  async get(auth: AuthDto, id: string): Promise<WorkflowResponseDto> {
    await this.requireAccess({ auth, permission: Permission.WorkflowRead, ids: [id] });
    const workflow = await this.findOrFail(id);
    return this.mapWorkflow(workflow);
  }

  async update(auth: AuthDto, id: string, dto: WorkflowUpdateDto): Promise<WorkflowResponseDto> {
    await this.requireAccess({ auth, permission: Permission.WorkflowUpdate, ids: [id] });

    if (Object.values(dto).filter((prop) => prop !== undefined).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    const workflow = await this.findOrFail(id);
    const context = this.getContextForTrigger(dto.triggerType ?? workflow.triggerType);

    const { filters, actions, ...workflowUpdate } = dto;
    const filterInserts = filters && (await this.validateAndMapFilters(filters, context));
    const actionInserts = actions && (await this.validateAndMapActions(actions, context));

    const updatedWorkflow = await this.workflowRepository.updateWorkflow(
      id,
      workflowUpdate,
      filterInserts,
      actionInserts,
    );

    return this.mapWorkflow(updatedWorkflow);
  }

  async delete(auth: AuthDto, id: string): Promise<void> {
    await this.requireAccess({ auth, permission: Permission.WorkflowDelete, ids: [id] });
    await this.workflowRepository.deleteWorkflow(id);
  }

  private async validateAndMapFilters(
    filters: Array<{ pluginFilterId: string; filterConfig?: any }>,
    requiredContext: PluginContext,
  ) {
    for (const dto of filters) {
      const filter = await this.pluginRepository.getFilter(dto.pluginFilterId);
      if (!filter) {
        throw new BadRequestException(`Invalid filter ID: ${dto.pluginFilterId}`);
      }

      if (!filter.supportedContexts.includes(requiredContext)) {
        throw new BadRequestException(
          `Filter "${filter.title}" does not support ${requiredContext} context. Supported contexts: ${filter.supportedContexts.join(', ')}`,
        );
      }
    }

    return filters.map((dto, index) => ({
      pluginFilterId: dto.pluginFilterId,
      filterConfig: dto.filterConfig || null,
      order: index,
    }));
  }

  private async validateAndMapActions(
    actions: Array<{ pluginActionId: string; actionConfig?: any }>,
    requiredContext: PluginContext,
  ) {
    for (const dto of actions) {
      const action = await this.pluginRepository.getAction(dto.pluginActionId);
      if (!action) {
        throw new BadRequestException(`Invalid action ID: ${dto.pluginActionId}`);
      }
      if (!action.supportedContexts.includes(requiredContext)) {
        throw new BadRequestException(
          `Action "${action.title}" does not support ${requiredContext} context. Supported contexts: ${action.supportedContexts.join(', ')}`,
        );
      }
    }

    return actions.map((dto, index) => ({
      pluginActionId: dto.pluginActionId,
      actionConfig: dto.actionConfig || null,
      order: index,
    }));
  }

  private getContextForTrigger(type: PluginTriggerType) {
    const trigger = pluginTriggers.find((t) => t.type === type);
    if (!trigger) {
      throw new BadRequestException(`Invalid trigger type: ${type}`);
    }
    return trigger.contextType;
  }

  private async findOrFail(id: string) {
    const workflow = await this.workflowRepository.getWorkflow(id);
    if (!workflow) {
      throw new BadRequestException('Workflow not found');
    }
    return workflow;
  }

  private async mapWorkflow(workflow: Workflow): Promise<WorkflowResponseDto> {
    const filters = await this.workflowRepository.getFilters(workflow.id);
    const actions = await this.workflowRepository.getActions(workflow.id);

    return {
      id: workflow.id,
      ownerId: workflow.ownerId,
      triggerType: workflow.triggerType,
      name: workflow.name,
      description: workflow.description,
      createdAt: workflow.createdAt.toISOString(),
      enabled: workflow.enabled,
      filters: filters.map((f) => mapWorkflowFilter(f)),
      actions: actions.map((a) => mapWorkflowAction(a)),
    };
  }
}
