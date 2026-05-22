import { BadRequestException, Injectable } from '@nestjs/common';
import { join } from 'node:path';
import { PluginManifestDto } from 'src/dtos/plugin-manifest.dto';
import {
  mapMethod,
  mapPlugin,
  mapTemplate,
  PluginMethodResponseDto,
  PluginMethodSearchDto,
  PluginResponseDto,
  PluginSearchDto,
  PluginTemplate,
  PluginTemplateResponseDto,
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

  async getTemplates(): Promise<PluginTemplateResponseDto[]> {
    const templates = await this.loadTemplates();
    return templates.map((template) => mapTemplate(template));
  }

  private async loadTemplates(): Promise<PluginTemplate[]> {
    const { resourcePaths } = this.configRepository.getEnv();

    try {
      const templates: PluginTemplate[] = [];
      const dto = await this.storageRepository.readJsonFile(join(resourcePaths.corePlugin, 'manifest.json'));
      const result = PluginManifestDto.schema.safeParse(dto);

      if (!result.success) {
        return [];
      }

      for (const template of result.data.templates) {
        templates.push({ ...template, pluginName: result.data.name });
      }

      return templates;
    } catch {
      this.logger.warn(`Failed to load plugin templates from folder: ${resourcePaths.corePlugin}`);
      return [];
    }
  }
}
