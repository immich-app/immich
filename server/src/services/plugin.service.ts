import { BadRequestException, Injectable } from '@nestjs/common';
import { Plugin, PluginAction, PluginFilter } from 'src/database';
import { PluginResponseDto } from 'src/dtos/plugin.dto';
import { pluginTriggers } from 'src/schema/tables/plugin.table';
import { BaseService } from 'src/services/base.service';

@Injectable()
export class PluginService extends BaseService {
  async getAll(): Promise<PluginResponseDto[]> {
    const plugins = await this.pluginRepository.getAllPlugins();
    return Promise.all(plugins.map((plugin) => this.mapPlugin(plugin)));
  }

  async get(id: string): Promise<PluginResponseDto> {
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
      wasmPath: plugin.wasmPath,
      createdAt: plugin.createdAt.toISOString(),
      updatedAt: plugin.updatedAt.toISOString(),
      triggers: pluginTriggers,
      filters: filters.map((filter) => this.mapPluginFilter(filter)),
      actions: actions.map((action) => this.mapPluginAction(action)),
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
