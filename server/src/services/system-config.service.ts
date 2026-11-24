import { BadRequestException, Injectable } from '@nestjs/common';
import { get, isEqual } from 'lodash-es';
import { OnEvent } from 'src/decorators.js';
import {
  AdminConfigDto,
  AdminConfigFieldDto,
  PublicConfigDto,
  UserConfigDto,
  configFields,
  defaults,
  mapAdminConfig,
  mapPublicConfig,
  mapUserConfig,
} from 'src/dtos/config.dto.js';
import { BootstrapEventPriority } from 'src/enum.js';
import type { ArgOf } from 'src/repositories/event.repository.js';
import { Resource } from 'src/resource-paths.js';
import { BaseService } from 'src/services/base.service.js';
import { clearConfigCache, getConfigEnvName, isLocked } from 'src/utils/config.js';
import { toPlainObject } from 'src/utils/object.js';

@Injectable()
export class SystemConfigService extends BaseService {
  @OnEvent({ name: 'AppBootstrap', priority: BootstrapEventPriority.SystemConfig })
  async onBootstrap() {
    const { deprecatedConfigVariables } = this.configRepository.getEnv();
    for (const { name, replacement } of deprecatedConfigVariables) {
      this.logger.warn(`${name} is deprecated, use ${replacement} instead`);
    }

    const config = await this.getConfig({ withCache: false });
    await this.eventRepository.emit('ConfigInit', { newConfig: config });
  }

  @OnEvent({ name: 'AppShutdown' })
  onShutdown() {
    this.machineLearningRepository.teardown();
  }

  async getAdminConfig(): Promise<AdminConfigDto> {
    const config = await this.getConfig({ withCache: false });
    return mapAdminConfig(config);
  }

  getAdminConfigDefaults(): AdminConfigDto {
    return mapAdminConfig(defaults);
  }

  async getAdminConfigFields(): Promise<AdminConfigFieldDto[]> {
    const { config, fields } = await this.getResolvedConfig({ withCache: false });
    return configFields.map(({ key }) => ({
      key,
      envName: getConfigEnvName(key),
      value: get(config, key),
      sources: fields[key].sources,
      isEditable: !isLocked(fields[key]),
    }));
  }

  async getUserConfig(): Promise<UserConfigDto> {
    const config = await this.getConfig({ withCache: false });
    return mapUserConfig(config);
  }

  getUserConfigDefaults(): UserConfigDto {
    return mapUserConfig(defaults);
  }

  async getPublicConfig(): Promise<PublicConfigDto> {
    const config = await this.getConfig({ withCache: false });
    return mapPublicConfig(config);
  }

  getPublicConfigDefaults(): PublicConfigDto {
    return mapPublicConfig(defaults);
  }

  @OnEvent({ name: 'ConfigInit', priority: -100 })
  onConfigInit({ newConfig: { logging, machineLearning } }: ArgOf<'ConfigInit'>) {
    const { logLevel: envLevel } = this.configRepository.getEnv();
    const level = logging.enabled && logging.level;
    this.logger.setLogLevel(level);
    this.logger.log(
      `LogLevel=${level} ${envLevel ? '(set via IMMICH_CONFIG_LOGGING_LEVEL)' : '(set via system config)'}`,
    );

    this.machineLearningRepository.setup(machineLearning);
  }

  @OnEvent({ name: 'ConfigUpdate', server: true })
  onConfigUpdate({ newConfig }: ArgOf<'ConfigUpdate'>) {
    this.onConfigInit({ newConfig });
    clearConfigCache();
  }

  async updateAdminConfig(dto: AdminConfigDto): Promise<AdminConfigDto> {
    const { config: oldConfig, fields } = await this.getResolvedConfig({ withCache: false });

    const lockedChanges = configFields
      .filter(({ key }) => isLocked(fields[key]) && !isEqual(get(dto, key), get(oldConfig, key)))
      .map(({ key }) => key);
    if (lockedChanges.length > 0) {
      throw new BadRequestException(
        `Cannot update properties set by the config file or an environment variable: ${lockedChanges.join(', ')}`,
      );
    }

    try {
      await this.eventRepository.emit('ConfigValidate', { newConfig: toPlainObject(dto), oldConfig });
    } catch (error) {
      this.logger.warn(`Unable to save system config due to a validation error: ${error}`);
      throw new BadRequestException(error instanceof Error ? error.message : error);
    }

    const newConfig = await this.updateConfig(dto);
    this.resourceRepository.send({
      userIds: await this.userRepository.getAdminIds(),
      changed: [Resource.adminConfig()],
    });

    await this.eventRepository.emit('ConfigUpdate', { newConfig, oldConfig });

    return mapAdminConfig(newConfig);
  }

  async getCustomCss(): Promise<string> {
    const { theme } = await this.getConfig({ withCache: false });
    return theme.customCss;
  }
}
