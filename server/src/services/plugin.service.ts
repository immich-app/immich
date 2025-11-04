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
import { BaseService } from 'src/services/base.service';

@Injectable()
export class PluginService extends BaseService {
  @OnEvent({ name: 'AssetCreate' })
  async handleAssetCreate({ asset }: ArgOf<'AssetCreate'>) {
    console.log(`PluginService.handleAssetCreate: ${asset.id}`);
    const corePath = resolve('../plugins/dist/plugin.wasm');
    const plugin = await newPlugin(corePath, {
      useWasi: true,
      functions: {
        'extism:host/user': {
          updateAsset: (cp: CurrentPlugin, offs: bigint) => this.updateAsset(JSON.parse(cp.read(offs)!.text())),
        },
      },
    });

    const event = { asset };
    await plugin.call('archiveAssetAction', JSON.stringify(event));
  }

  async updateAsset(asset: Updateable<AssetTable> & { id: string }) {
    console.log(`Updating asset ${asset.id} -- ${JSON.stringify({ ...asset, id: undefined })}`);
    await this.assetRepository.update(asset);
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
