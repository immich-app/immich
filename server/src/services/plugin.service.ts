import { CurrentPlugin, newPlugin } from '@extism/extism';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Updateable } from 'kysely';
import { resolve } from 'node:path';
import { Plugin, PluginAction, PluginFilter, PluginTrigger } from 'src/database';
import { OnEvent } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import { PluginResponseDto } from 'src/dtos/plugin.dto';
import { ArgOf } from 'src/repositories/event.repository';
import { AssetTable } from 'src/schema/tables/asset.table';
import { PluginContext, PluginTriggerName } from 'src/schema/tables/plugin.table';
import { BaseService } from 'src/services/base.service';

@Injectable()
export class PluginService extends BaseService {
  @OnEvent({ name: 'AssetCreate' })
  async handleAssetCreate({ asset }: ArgOf<'AssetCreate'>) {
    console.log(`PluginService.handleAssetCreate: ${asset.id}`);

    // Get the asset_uploaded trigger
    const trigger = await this.pluginRepository.getTriggerByName(PluginTriggerName.AssetUploaded);
    if (!trigger) {
      console.log('No asset_uploaded trigger found');
      return;
    }

    // Get all enabled workflows for this trigger
    const workflows = await this.workflowRepository.getWorkflowsByTrigger(trigger.id);
    if (workflows.length === 0) {
      console.log('No enabled workflows found for asset_uploaded trigger');
      return;
    }

    // Execute each workflow
    for (const workflow of workflows) {
      try {
        await this.executeWorkflow(workflow.id, asset, trigger);
      } catch (error) {
        console.error(`Error executing workflow ${workflow.id} (${workflow.name}):`, error);
      }
    }
  }

  private async executeWorkflow(workflowId: string, asset: any, trigger: PluginTrigger) {
    console.log(`Executing workflow ${workflowId}`);

    // Get the workflow with its filters and actions
    const workflow = await this.workflowRepository.getWorkflow(workflowId);
    if (!workflow) {
      console.error(`Workflow ${workflowId} not found`);
      return;
    }

    const workflowFilters = await this.workflowRepository.getFilters(workflowId);
    const workflowActions = await this.workflowRepository.getActions(workflowId);

    // Get the plugin for the trigger
    const plugin = await this.pluginRepository.getPlugin(trigger.pluginId);
    if (!plugin) {
      console.error(`Plugin ${trigger.pluginId} not found for trigger ${trigger.id}`);
      return;
    }

    // Load the WASM plugin
    // manifestPath is relative to project root (e.g., "plugins/dist/plugin.json")
    // The WASM file should be in the same directory with .wasm extension
    const pluginPath = resolve(__dirname, '../../..', plugin.manifestPath);
    console.log(`Loading plugin from: ${pluginPath}`);
    const extismPlugin = await newPlugin(pluginPath, {
      useWasi: true,
      functions: {
        'extism:host/user': {
          updateAsset: (cp: CurrentPlugin, offs: bigint) => this.updateAsset(JSON.parse(cp.read(offs)!.text())),
          addAssetToAlbum: (cp: CurrentPlugin, offs: bigint) => this.addAssetToAlbum(JSON.parse(cp.read(offs)!.text())),
        },
      },
    });

    // Create the context object for the plugin
    let context = {
      asset,
      triggerConfig: workflow.triggerConfig,
    };

    // Execute filters in order
    for (const workflowFilter of workflowFilters) {
      const filterDef = await this.pluginRepository.getFilter(workflowFilter.filterId);
      if (!filterDef) {
        console.error(`Filter ${workflowFilter.filterId} not found`);
        continue;
      }

      // Check if filter supports the current context
      if (!filterDef.supportedContexts.includes(PluginContext.Asset)) {
        console.log(`Filter ${filterDef.name} does not support asset context`);
        continue;
      }

      console.log(`Executing filter: ${filterDef.name} (${filterDef.functionName})`);

      // Call the filter function
      const filterInput = JSON.stringify({
        context,
        config: workflowFilter.filterConfig,
      });

      const filterResult = await extismPlugin.call(filterDef.functionName, filterInput);
      if (!filterResult) {
        console.error(`Filter ${filterDef.name} returned null`);
        return;
      }

      const result = JSON.parse(filterResult.text());

      // If filter returns false, stop workflow execution
      if (result.passed === false) {
        console.log(`Filter ${filterDef.name} returned false, stopping workflow execution`);
        return;
      }

      // Update context if filter returned modified context
      if (result.context) {
        context = result.context;
      }
    }

    // Execute actions in order
    for (const workflowAction of workflowActions) {
      const actionDef = await this.pluginRepository.getAction(workflowAction.actionId);
      if (!actionDef) {
        console.error(`Action ${workflowAction.actionId} not found`);
        continue;
      }

      // Check if action supports the current context
      if (!actionDef.supportedContexts.includes(PluginContext.Asset)) {
        console.log(`Action ${actionDef.name} does not support asset context`);
        continue;
      }

      console.log(`Executing action: ${actionDef.name} (${actionDef.functionName})`);

      // Call the action function
      const actionInput = JSON.stringify({
        context,
        config: workflowAction.actionConfig,
      });

      const actionResult = await extismPlugin.call(actionDef.functionName, actionInput);
      if (!actionResult) {
        console.error(`Action ${actionDef.name} returned null`);
        continue;
      }

      const result = JSON.parse(actionResult.text());

      // Update context if action returned modified context
      if (result.context) {
        context = result.context;
      }
    }

    console.log(`Workflow ${workflowId} executed successfully`);
  }

  async updateAsset(asset: Updateable<AssetTable> & { id: string }) {
    console.log(`Updating asset ${asset.id} -- ${JSON.stringify({ ...asset, id: undefined })}`);
    await this.assetRepository.update(asset);
  }

  async addAssetToAlbum({ assetId, albumId }: { assetId: string; albumId: string }) {
    console.log(`Adding asset ${assetId} to album ${albumId}`);
    await this.albumRepository.addAssetIds(albumId, [assetId]);
    return 0;
  }

  async getAll(auth: AuthDto): Promise<PluginResponseDto[]> {
    const plugins = await this.pluginRepository.getAllPlugins();
    return Promise.all(plugins.map((plugin) => this.mapPlugin(plugin)));
  }

  async get(auth: AuthDto, id: string): Promise<PluginResponseDto> {
    const plugin = await this.findOrFail(id);
    return this.mapPlugin(plugin);
  }

  private async findOrFail(id: string) {
    const plugin = await this.pluginRepository.getPlugin(id);
    if (!plugin) {
      throw new BadRequestException('Plugin not found');
    }
    return plugin;
  }

  private async mapPlugin(plugin: Plugin): Promise<PluginResponseDto> {
    const triggers = await this.pluginRepository.getTriggersByPlugin(plugin.id);
    const filters = await this.pluginRepository.getFiltersByPlugin(plugin.id);
    const actions = await this.pluginRepository.getActionsByPlugin(plugin.id);

    return {
      id: plugin.id,
      name: plugin.name,
      displayName: plugin.displayName,
      description: plugin.description,
      author: plugin.author,
      version: plugin.version,
      manifestPath: plugin.manifestPath,
      createdAt: plugin.createdAt.toISOString(),
      updatedAt: plugin.updatedAt.toISOString(),
      triggers: triggers.map(this.mapPluginTrigger),
      filters: filters.map(this.mapPluginFilter),
      actions: actions.map(this.mapPluginAction),
    };
  }

  private mapPluginTrigger(trigger: PluginTrigger) {
    return {
      id: trigger.id,
      pluginId: trigger.pluginId,
      name: trigger.name,
      displayName: trigger.displayName,
      description: trigger.description,
      context: trigger.context,
      functionName: trigger.functionName,
      schema: trigger.schema,
    };
  }

  private mapPluginFilter(filter: PluginFilter) {
    return {
      id: filter.id,
      pluginId: filter.pluginId,
      name: filter.name,
      displayName: filter.displayName,
      description: filter.description,
      supportedContexts: filter.supportedContexts,
      functionName: filter.functionName,
      schema: filter.schema,
    };
  }

  private mapPluginAction(action: PluginAction) {
    return {
      id: action.id,
      pluginId: action.pluginId,
      name: action.name,
      displayName: action.displayName,
      description: action.description,
      supportedContexts: action.supportedContexts,
      functionName: action.functionName,
      schema: action.schema,
    };
  }
}
