import { BadRequestException, Injectable } from '@nestjs/common';
import { mapPlugin, PluginResponseDto } from 'src/dtos/plugin.dto';
import { BaseService } from 'src/services/base.service';

@Injectable()
export class PluginService extends BaseService {
  async getAll(): Promise<PluginResponseDto[]> {
    const plugins = await this.pluginRepository.getAllPlugins();
    return plugins.map((plugin) => mapPlugin(plugin));
  }

  async get(id: string): Promise<PluginResponseDto> {
    const plugin = await this.pluginRepository.getPlugin(id);
    if (!plugin) {
      throw new BadRequestException('Plugin not found');
    }
    return mapPlugin(plugin);
  }
}
