import { BadRequestException, Injectable } from '@nestjs/common';
import { Workflow, WorkflowAction, WorkflowFilter } from 'src/database';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  WorkflowActionCreateDto,
  WorkflowActionResponseDto,
  WorkflowCreateDto,
  WorkflowFilterCreateDto,
  WorkflowFilterResponseDto,
  WorkflowResponseDto,
  WorkflowUpdateDto,
} from 'src/dtos/workflow.dto';
import { Permission } from 'src/enum';
import { BaseService } from 'src/services/base.service';

@Injectable()
export class WorkflowService extends BaseService {
  async create(auth: AuthDto, dto: WorkflowCreateDto): Promise<WorkflowResponseDto> {
    const workflow = await this.workflowRepository.createWorkflow({
      ownerId: auth.user.id,
      triggerType: dto.triggerType,
      triggerConfig: dto.triggerConfig || null,
      name: dto.name,
      displayName: dto.displayName,
      description: dto.description || '',
      enabled: dto.enabled ?? true,
    });

    return this.mapWorkflow(workflow);
  }

  async getAll(auth: AuthDto): Promise<WorkflowResponseDto[]> {
    const workflows = await this.workflowRepository.getWorkflowsByOwner(auth.user.id);

    return Promise.all(workflows.map(this.mapWorkflow));
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

    const workflow = await this.workflowRepository.updateWorkflow(id, dto);
    return this.mapWorkflow(workflow);
  }

  async delete(auth: AuthDto, id: string): Promise<void> {
    await this.requireAccess({ auth, permission: Permission.WorkflowDelete, ids: [id] });
    await this.workflowRepository.deleteWorkflow(id);
  }

  async addFilter(auth: AuthDto, workflowId: string, dto: WorkflowFilterCreateDto): Promise<WorkflowFilterResponseDto> {
    await this.requireAccess({ auth, permission: Permission.WorkflowUpdate, ids: [workflowId] });

    const filter = await this.pluginRepository.getFilter(dto.filterId);
    if (!filter) {
      throw new BadRequestException('Invalid filter ID');
    }

    const existingFilters = await this.workflowRepository.getFilters(workflowId);
    const order = existingFilters.length;

    const workflowFilter = await this.workflowRepository.createFilter({
      workflowId,
      filterId: dto.filterId,
      filterConfig: dto.filterConfig || null,
      order,
    });

    return this.mapWorkflowFilter(workflowFilter);
  }

  async removeFilter(auth: AuthDto, workflowId: string, filterId: string): Promise<void> {
    await this.requireAccess({ auth, permission: Permission.WorkflowUpdate, ids: [workflowId] });
    await this.workflowRepository.deleteFilter(filterId);
  }

  async addAction(auth: AuthDto, workflowId: string, dto: WorkflowActionCreateDto): Promise<WorkflowActionResponseDto> {
    await this.requireAccess({ auth, permission: Permission.WorkflowUpdate, ids: [workflowId] });

    const action = await this.pluginRepository.getAction(dto.actionId);
    if (!action) {
      throw new BadRequestException('Invalid action ID');
    }

    const existingActions = await this.workflowRepository.getActions(workflowId);
    const order = existingActions.length;

    const workflowAction = await this.workflowRepository.createAction({
      workflowId,
      actionId: dto.actionId,
      actionConfig: dto.actionConfig || null,
      order,
    });

    return this.mapWorkflowAction(workflowAction);
  }

  async removeAction(auth: AuthDto, workflowId: string, actionId: string): Promise<void> {
    await this.requireAccess({ auth, permission: Permission.WorkflowUpdate, ids: [workflowId] });
    await this.workflowRepository.deleteAction(actionId);
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
      triggerConfig: workflow.triggerConfig,
      name: workflow.name,
      displayName: workflow.displayName,
      description: workflow.description,
      createdAt: workflow.createdAt.toISOString(),
      enabled: workflow.enabled,
      filters: filters.map((f) => this.mapWorkflowFilter(f)),
      actions: actions.map((a) => this.mapWorkflowAction(a)),
    };
  }

  private mapWorkflowFilter(filter: WorkflowFilter): WorkflowFilterResponseDto {
    return {
      id: filter.id,
      workflowId: filter.workflowId,
      filterId: filter.filterId,
      filterConfig: filter.filterConfig,
      order: filter.order,
    };
  }

  private mapWorkflowAction(action: WorkflowAction): WorkflowActionResponseDto {
    return {
      id: action.id,
      workflowId: action.workflowId,
      actionId: action.actionId,
      actionConfig: action.actionConfig,
      order: action.order,
    };
  }
}
