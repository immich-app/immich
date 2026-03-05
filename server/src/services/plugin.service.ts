import { BadRequestException, Injectable } from '@nestjs/common';
import {
  mapMethod,
  mapPlugin,
  PluginMethodResponseDto,
  PluginMethodSearchDto,
  PluginResponseDto,
  PluginSearchDto,
} from 'src/dtos/plugin.dto';
import { BaseService } from 'src/services/base.service';
import { isMethodCompatible } from 'src/utils/workflow';

@Injectable()
export class PluginService extends BaseService {
  async search(dto: PluginSearchDto): Promise<PluginResponseDto[]> {
    const plugins = await this.pluginRepository.search(dto);
    return plugins.map((plugin) => mapPlugin(plugin));
  }

  async get(id: string): Promise<PluginResponseDto> {
    const plugin = await this.pluginRepository.get(id);
    if (!plugin) {
      throw new BadRequestException('Plugin not found');
    }
    return mapPlugin(plugin);
  }

  async searchMethods(dto: PluginMethodSearchDto): Promise<PluginMethodResponseDto[]> {
    const methods = await this.pluginRepository.searchMethods(dto);
    return methods
      .filter((method) => !dto.trigger || isMethodCompatible(method, dto.trigger))
      .map((method) => mapMethod(method));
  }
}
