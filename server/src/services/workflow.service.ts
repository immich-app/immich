import { WorkflowStepConfig, WorkflowTrigger } from '@immich/plugin-sdk';
import { BadRequestException, Injectable } from '@nestjs/common';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  mapWorkflow,
  mapWorkflowShare,
  WorkflowCreateDto,
  WorkflowGetLogsDto,
  WorkflowLogEntryDto,
  WorkflowResponseDto,
  WorkflowSearchDto,
  WorkflowShareResponseDto,
  WorkflowTriggerResponseDto,
  WorkflowUpdateDto,
} from 'src/dtos/workflow.dto';
import { Permission, WorkflowResult } from 'src/enum';
import { PluginMethodSearchResponse } from 'src/repositories/plugin.repository';
import { BaseService } from 'src/services/base.service';
import { getWorkflowTriggers, isMethodCompatible, resolveMethod } from 'src/utils/workflow';

@Injectable()
export class WorkflowService extends BaseService {
  getTriggers(): WorkflowTriggerResponseDto[] {
    return getWorkflowTriggers();
  }

  async search(auth: AuthDto, dto: WorkflowSearchDto): Promise<WorkflowResponseDto[]> {
    const workflows = await this.workflowRepository.search({ ...dto, userId: auth.user.id });
    return workflows.map((workflow) => mapWorkflow(workflow));
  }

  async get(auth: AuthDto, id: string): Promise<WorkflowResponseDto> {
    await this.requireAccess({ auth, permission: Permission.WorkflowRead, ids: [id] });
    const workflow = await this.findOrFail(id);
    return mapWorkflow(workflow);
  }

  async share(auth: AuthDto, id: string): Promise<WorkflowShareResponseDto> {
    await this.requireAccess({ auth, permission: Permission.WorkflowRead, ids: [id] });
    const workflow = await this.findOrFail(id);
    return mapWorkflowShare(workflow);
  }

  async create(auth: AuthDto, dto: WorkflowCreateDto): Promise<WorkflowResponseDto> {
    const { steps: stepsDto, ...workflowDto } = dto;
    const steps = await this.resolveAndValidateSteps(stepsDto ?? [], workflowDto.trigger);

    const workflow = await this.workflowRepository.create(
      {
        ...workflowDto,
        ownerId: auth.user.id,
      },
      steps.map((step) => ({
        enabled: step.enabled ?? true,
        config: step.config as WorkflowStepConfig,
        pluginMethodId: step.pluginMethod.id,
      })),
    );

    return mapWorkflow({ ...workflow, steps: [] });
  }

  async update(auth: AuthDto, id: string, dto: WorkflowUpdateDto): Promise<WorkflowResponseDto> {
    await this.requireAccess({ auth, permission: Permission.WorkflowUpdate, ids: [id] });

    const { steps: stepsDto, ...workflowDto } = dto;
    const current = await this.findOrFail(id);
    const steps = stepsDto ? await this.resolveAndValidateSteps(stepsDto, dto.trigger ?? current.trigger) : undefined;
    const workflow = await this.workflowRepository.update(
      id,
      workflowDto,
      steps?.map((step) => ({
        enabled: step.enabled ?? true,
        config: step.config as WorkflowStepConfig,
        pluginMethodId: step.pluginMethod.id,
      })),
    );

    return mapWorkflow(workflow);
  }

  async delete(auth: AuthDto, id: string): Promise<void> {
    await this.requireAccess({ auth, permission: Permission.WorkflowDelete, ids: [id] });
    await this.workflowRepository.delete(id);
  }

  async getLogs(auth: AuthDto, id: string, dto: WorkflowGetLogsDto): Promise<WorkflowLogEntryDto[]> {
    await this.requireAccess({ auth, permission: Permission.WorkflowLogs, ids: [id] });
    const logs = await this.workflowRepository.getLogs(id, dto);
    return logs.map((entry) => ({
      id: entry.id,
      at: entry.createdAt.toISOString(),
      result: entry.error ? WorkflowResult.Error : entry.halted ? WorkflowResult.Halted : WorkflowResult.Completed,
      triggerDataId: entry.triggerDataId ?? undefined,
      lastStep: entry.step
        ? {
            index: entry.step.order,
            method: `${entry.step.pluginId}#${entry.step.methodName}`,
          }
        : undefined,
    }));
  }

  private async resolveAndValidateSteps<T extends { method: string }>(steps: T[], trigger: WorkflowTrigger) {
    const methods = await this.pluginRepository.getForValidation();
    const results: Array<T & { pluginMethod: PluginMethodSearchResponse }> = [];

    for (const step of steps) {
      const pluginMethod = resolveMethod(methods, step.method);
      if (!pluginMethod) {
        throw new BadRequestException(`Unknown method ${step.method}`);
      }

      if (!isMethodCompatible(pluginMethod, trigger)) {
        throw new BadRequestException(`Method "${step.method}" is incompatible with workflow trigger: "${trigger}"`);
      }

      results.push({ ...step, pluginMethod });
    }

    // TODO make sure all steps can use a common WorkflowType

    return results;
  }

  private async findOrFail(id: string) {
    const workflow = await this.workflowRepository.get(id);
    if (!workflow) {
      throw new BadRequestException('Workflow not found');
    }
    return workflow;
  }
}
