import { Plugin as ExtismPlugin, newPlugin } from '@extism/extism';
import { Injectable } from '@nestjs/common';
import { Asset, WorkflowAction, WorkflowFilter } from 'src/database';
import { OnEvent, OnJob } from 'src/decorators';
import { JobName, JobStatus, PluginTriggerType, QueueName } from 'src/enum';
import { ArgOf } from 'src/repositories/event.repository';
import { BaseService } from 'src/services/base.service';
import { PluginHostFunctions } from 'src/services/plugin-host.functions';
import { IWorkflowJob, JobItem, JobOf, WorkflowData } from 'src/types';
import { TriggerConfig } from 'src/types/plugin-schema.types';

interface WorkflowContext {
  jwtToken: string;
  asset: Asset;
  triggerConfig: TriggerConfig | null;
}

@Injectable()
export class PluginExecutionService extends BaseService {
  private loadedPlugins: Map<string, ExtismPlugin> = new Map();
  private hostFunctions!: PluginHostFunctions;
  private readonly pluginJwtSecret: string = this.cryptoRepository.randomBytesAsText(32);

  @OnEvent({ name: 'AppBootstrap' })
  async onBootstrap() {
    this.hostFunctions = new PluginHostFunctions(
      this.assetRepository,
      this.albumRepository,
      this.accessRepository,
      this.cryptoRepository,
      this.logger,
      this.pluginJwtSecret,
    );
    await this.loadPlugins();
  }

  private async loadPlugins() {
    const plugins = await this.pluginRepository.getAllPlugins();
    for (const plugin of plugins) {
      try {
        this.logger.debug(`Loading plugin: ${plugin.name} from ${plugin.wasmPath}`);

        const extismPlugin = await newPlugin(plugin.wasmPath, {
          useWasi: true,
          functions: this.hostFunctions.getHostFunctions(),
        });

        this.loadedPlugins.set(plugin.id, extismPlugin);
        this.logger.log(`Successfully loaded plugin: ${plugin.name}`);
      } catch (error) {
        this.logger.error(`Failed to load plugin ${plugin.name}:`, error);
      }
    }
  }

  @OnEvent({ name: 'AssetCreate' })
  async handleAssetCreate({ asset }: ArgOf<'AssetCreate'>) {
    await this.handleTrigger(PluginTriggerType.AssetCreate, { ownerId: asset.ownerId, event: { asset } });
  }

  private async handleTrigger<T extends PluginTriggerType>(
    triggerType: T,
    params: { ownerId: string; event: WorkflowData[T] },
  ): Promise<void> {
    const workflows = await this.workflowRepository.getWorkflowByOwnerAndTrigger(params.ownerId, triggerType);
    if (workflows.length === 0) {
      return;
    }

    const jobs: JobItem[] = workflows.map((workflow) => ({
      name: JobName.WorkflowRun,
      data: {
        id: workflow.id,
        type: triggerType,
        event: params.event,
      } as IWorkflowJob<T>,
    }));

    await this.jobRepository.queueAll(jobs);
    this.logger.debug(`Queued ${jobs.length} workflow execution jobs for trigger ${triggerType}`);
  }

  @OnJob({ name: JobName.WorkflowRun, queue: QueueName.Workflow })
  async handleWorkflowRun({ id: workflowId, type, event }: JobOf<JobName.WorkflowRun>): Promise<JobStatus> {
    try {
      const workflow = await this.workflowRepository.getWorkflow(workflowId);
      if (!workflow) {
        this.logger.error(`Workflow ${workflowId} not found`);
        return JobStatus.Failed;
      }

      const workflowFilters = await this.workflowRepository.getFilters(workflowId);
      const workflowActions = await this.workflowRepository.getActions(workflowId);

      switch (type) {
        case PluginTriggerType.AssetCreate: {
          const data = event as WorkflowData[PluginTriggerType.AssetCreate];
          const asset = data.asset;

          const jwtToken = this.cryptoRepository.signJwt({ userId: asset.ownerId }, this.pluginJwtSecret);

          const context = {
            jwtToken,
            asset,
            triggerConfig: workflow.triggerConfig,
          };

          const filtersPassed = await this.executeFilters(workflowFilters, context);
          if (!filtersPassed) {
            return JobStatus.Failed;
          }

          await this.executeActions(workflowActions, context);
          this.logger.debug(`Workflow ${workflowId} executed successfully`);
          return JobStatus.Success;
        }

        case PluginTriggerType.PersonRecognized: {
          this.logger.error('unimplemented');
          return JobStatus.Skipped;
        }

        default: {
          this.logger.error(`Unknown workflow trigger type: ${type}`);
          return JobStatus.Failed;
        }
      }
    } catch (error) {
      this.logger.error(`Error executing workflow ${workflowId}:`, error);
      return JobStatus.Failed;
    }
  }

  private async executeFilters(workflowFilters: WorkflowFilter[], context: WorkflowContext): Promise<boolean> {
    for (const workflowFilter of workflowFilters) {
      const filter = await this.pluginRepository.getFilter(workflowFilter.filterId);
      if (!filter) {
        this.logger.error(`Filter ${workflowFilter.filterId} not found`);
        continue;
      }

      const pluginInstance = this.loadedPlugins.get(filter.pluginId);
      if (!pluginInstance) {
        this.logger.error(`Plugin ${filter.pluginId} not loaded`);
        continue;
      }

      this.logger.debug(`Executing filter: ${filter.name}`);
      const filterInput = JSON.stringify({
        context,
        config: workflowFilter.filterConfig,
      });

      const filterResult = await pluginInstance.call(filter.name, new TextEncoder().encode(filterInput));
      if (!filterResult) {
        this.logger.error(`Filter ${filter.name} returned null`);
        return false;
      }

      const result = JSON.parse(filterResult.text());
      if (result.passed === false) {
        this.logger.debug(`Filter ${filter.name} returned false, stopping workflow execution`);
        return false;
      }
    }

    return true;
  }

  private async executeActions(workflowActions: WorkflowAction[], context: WorkflowContext): Promise<void> {
    for (const workflowAction of workflowActions) {
      const action = await this.pluginRepository.getAction(workflowAction.actionId);
      if (!action) {
        this.logger.error(`Action ${workflowAction.actionId} not found`);
        continue;
      }

      const pluginInstance = this.loadedPlugins.get(action.pluginId);
      if (!pluginInstance) {
        this.logger.error(`Action ${action.pluginId} not loaded`);
        continue;
      }

      this.logger.debug(`Executing action: ${action.name}`);
      const actionInput = JSON.stringify({
        context,
        config: workflowAction.actionConfig,
      });

      this.logger.debug(`Calling action ${action.name} with input: ${actionInput}`);

      const actionResult = await pluginInstance.call(action.name, actionInput);
      if (!actionResult) {
        this.logger.error(`Action ${action.name} returned null`);
      }
    }
  }
}
