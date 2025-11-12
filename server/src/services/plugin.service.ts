import { BadRequestException, Injectable } from '@nestjs/common';
import { MapPlugin, PluginResponseDto } from 'src/dtos/plugin.dto';
import { pluginTriggers } from 'src/schema/tables/plugin.table';
import { BaseService } from 'src/services/base.service';

@Injectable()
export class PluginService extends BaseService {
  async getAll(): Promise<PluginResponseDto[]> {
    const plugins = await this.pluginRepository.getAllPlugins();
    return plugins.map(this.mapPlugin);
  }

  async get(id: string): Promise<PluginResponseDto> {
    const plugin = await this.pluginRepository.getPlugin(id);
    if (!plugin) {
      throw new BadRequestException('Plugin not found');
    }
    return this.mapPlugin(plugin);
  }

  private mapPlugin(plugin: MapPlugin): PluginResponseDto {
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
      filters: plugin.filters,
      actions: plugin.actions,
    };
  }
}
