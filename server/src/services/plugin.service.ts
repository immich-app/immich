import { CurrentPlugin, Plugin as ExtismPlugin, newPlugin } from '@extism/extism';
import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { Updateable } from 'kysely';
import { resolve } from 'node:path';
import { Plugin, PluginAction, PluginFilter } from 'src/database';
import { OnEvent } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import { PluginResponseDto } from 'src/dtos/plugin.dto';
import { ArgOf } from 'src/repositories/event.repository';
import { AssetTable } from 'src/schema/tables/asset.table';
import { PluginContext, PluginTrigger, pluginTriggers, PluginTriggerType } from 'src/schema/tables/plugin.table';
import { BaseService } from 'src/services/base.service';

@Injectable()
export class PluginService extends BaseService implements OnModuleInit {
  private loadedPlugins: Map<string, ExtismPlugin> = new Map();

  async onModuleInit() {
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
          functions: {
            'extism:host/user': {
              updateAsset: (cp: CurrentPlugin, offs: bigint) => this.updateAsset(JSON.parse(cp.read(offs)!.text())),
              addAssetToAlbum: (cp: CurrentPlugin, offs: bigint) =>
                this.addAssetToAlbum(JSON.parse(cp.read(offs)!.text())),
            },
          },
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

    for (const workflow of workflows) {
      try {
        await this.executeWorkflow(token, workflow.id, asset, trigger);
      } catch (error) {
        this.logger.error(`Error executing workflow ${workflow.id} (${workflow.name}):`, error);
      }
    }
  }

  private async executeWorkflow(jwtToken: string, workflowId: string, asset: any, trigger: PluginTrigger) {
    this.logger.debug(`Executing workflow ${workflowId}`);

    const workflow = await this.workflowRepository.getWorkflow(workflowId);
    if (!workflow) {
      console.error(`Workflow ${workflowId} not found`);
      return;
    }

    const workflowFilters = await this.workflowRepository.getFilters(workflowId);
    const workflowActions = await this.workflowRepository.getActions(workflowId);

    let context = {
      jwtToken,
      asset,
      triggerConfig: workflow.triggerConfig,
    };

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
        return;
      }

      const result = JSON.parse(filterResult.text());
      if (result.passed === false) {
        this.logger.debug(`Filter ${filter.name} returned false, stopping workflow execution`);
        return;
      }

      if (result.context) {
        context = result.context;
      }
    }

    // Execute actions in order
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

      console.log(`Calling action ${action.name} with input: ${actionInput}`);

      const actionResult = await pluginInstance.call(action.name, actionInput);
      if (!actionResult) {
        console.error(`Action ${action.name} returned null`);
        continue;
      }

      const result = JSON.parse(actionResult.text());

      if (result.context) {
        context = result.context;
      }
    }

    this.logger.log(`Workflow ${workflowId} executed successfully`);
  }

  async updateAsset(asset: Updateable<AssetTable> & { id: string }) {
    this.logger.log(`Updating asset ${asset.id} -- ${JSON.stringify({ ...asset, id: undefined })}`);
    await this.assetRepository.update(asset);
  }

  async addAssetToAlbum({ assetId, albumId }: { assetId: string; albumId: string }) {
    this.logger.log(`Adding asset ${assetId} to album ${albumId}`);
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
      triggers: pluginTriggers,
      filters: filters.map(this.mapPluginFilter),
      actions: actions.map(this.mapPluginAction),
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
      schema: action.schema,
    };
  }
}
