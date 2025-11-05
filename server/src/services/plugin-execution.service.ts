import { Plugin as ExtismPlugin, newPlugin } from '@extism/extism';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { resolve } from 'node:path';
import { Asset, WorkflowAction, WorkflowFilter } from 'src/database';
import { OnEvent, OnJob } from 'src/decorators';
import { JobName, JobStatus, QueueName } from 'src/enum';
import { ArgOf } from 'src/repositories/event.repository';
import { PluginContext, PluginTrigger, pluginTriggers, PluginTriggerType } from 'src/schema/tables/plugin.table';
import { BaseService } from 'src/services/base.service';
import { PluginHostFunctions } from 'src/services/plugin-host.functions';
import { JobItem, JobOf } from 'src/types';
import { TriggerConfig } from 'src/types/plugin-schema.types';

interface WorkflowContext {
  jwtToken: string;
  asset: Asset;
  triggerConfig: TriggerConfig | null;
}

@Injectable()
export class PluginExecutionService extends BaseService implements OnModuleInit {
  private loadedPlugins: Map<string, ExtismPlugin> = new Map();
  private hostFunctions!: PluginHostFunctions;

  async onModuleInit() {
    this.hostFunctions = new PluginHostFunctions(this.assetRepository, this.albumRepository, this.logger);
    await this.loadCorePlugins();
  }

  private async loadCorePlugins() {
    const plugins = await this.pluginRepository.getAllPlugins();
    for (const plugin of plugins) {
      try {
        const pluginPath = resolve(process.cwd(), '..', plugin.manifestPath);

        this.logger.log(`Loading plugin: ${plugin.name} from ${pluginPath}`);

        const extismPlugin = await newPlugin(pluginPath, {
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
    const auth = { userId: asset.ownerId };

    // TODO: Sign auth as jwt
    const token = JSON.stringify({ userId: asset.ownerId });

    const trigger = pluginTriggers.find((trigger) => trigger.type === PluginTriggerType.AssetCreate);
    if (!trigger) {
      this.logger.debug('No trigger found for asset_uploaded');
      return;
    }

    const workflows = await this.workflowRepository.getWorkflowsByTrigger(PluginTriggerType.AssetCreate);
    if (workflows.length === 0) {
      this.logger.debug('No enabled workflows found for asset_uploaded trigger');
      return;
    }

    // Queue workflow execution jobs
    const jobs: JobItem[] = workflows.map((workflow) => ({
      name: JobName.WorkflowExecute,
      data: {
        workflowId: workflow.id,
        assetId: asset.id,
        triggerId: trigger.type,
      },
    }));

    await this.jobRepository.queueAll(jobs);
    this.logger.debug(`Queued ${jobs.length} workflow execution jobs for asset ${asset.id}`);
  }

  @OnJob({ name: JobName.WorkflowExecute, queue: QueueName.Workflow })
  async handleWorkflowExecute({ workflowId, assetId, triggerId }: JobOf<JobName.WorkflowExecute>): Promise<JobStatus> {
    try {
      // Get asset info
      const asset = await this.assetRepository.getById(assetId);
      if (!asset) {
        this.logger.error(`Asset ${assetId} not found`);
        return JobStatus.Failed;
      }

      // Get trigger
      const trigger = pluginTriggers.find((t) => t.type === triggerId);
      if (!trigger) {
        this.logger.error(`Trigger ${triggerId} not found`);
        return JobStatus.Failed;
      }

      // Create token
      const token = JSON.stringify({ userId: asset.ownerId });

      await this.executeWorkflow(token, workflowId, asset, trigger);
      return JobStatus.Success;
    } catch (error) {
      this.logger.error(`Error executing workflow ${workflowId}:`, error);
      return JobStatus.Failed;
    }
  }

  private async executeWorkflow(jwtToken: string, workflowId: string, asset: any, trigger: PluginTrigger) {
    this.logger.debug(`Executing workflow ${workflowId}`);

    const workflow = await this.workflowRepository.getWorkflow(workflowId);
    if (!workflow) {
      this.logger.error(`Workflow ${workflowId} not found`);
      return;
    }

    const workflowFilters = await this.workflowRepository.getFilters(workflowId);
    const workflowActions = await this.workflowRepository.getActions(workflowId);

    let context = {
      jwtToken,
      asset,
      triggerConfig: workflow.triggerConfig,
    };

    // Execute filters - if any filter returns false, stop execution
    const filtersPassed = await this.executeFilters(workflowFilters, context);
    if (!filtersPassed) {
      return;
    }

    // Execute actions in order
    await this.executeActions(workflowActions, context);

    this.logger.log(`Workflow ${workflowId} executed successfully`);
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

      if (!filter.supportedContexts.includes(PluginContext.Asset)) {
        this.logger.warn(`Filter ${filter.name} does not support asset context`);
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

      if (result.context) {
        Object.assign(context, result.context);
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

      if (!action.supportedContexts.includes(PluginContext.Asset)) {
        this.logger.warn(`Action ${action.name} does not support asset context`);
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
        continue;
      }

      const result = JSON.parse(actionResult.text());

      if (result.context) {
        Object.assign(context, result.context);
      }
    }
  }
}
