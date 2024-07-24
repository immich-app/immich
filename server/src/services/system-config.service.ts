import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
import _ from 'lodash';
import { LogLevel, SystemConfig, defaults } from 'src/config';
import {
  supportedDayTokens,
  supportedHourTokens,
  supportedMinuteTokens,
  supportedMonthTokens,
  supportedPresetTokens,
  supportedSecondTokens,
  supportedWeekTokens,
  supportedYearTokens,
} from 'src/constants';
import { SystemConfigCore } from 'src/cores/system-config.core';
import { EventHandlerOptions, OnServerEvent } from 'src/decorators';
import { SystemConfigDto, SystemConfigTemplateStorageOptionDto, mapConfig } from 'src/dtos/system-config.dto';
import {
  ClientEvent,
  IEventRepository,
  OnEvents,
  ServerEvent,
  SystemConfigUpdateEvent,
} from 'src/interfaces/event.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';

@Injectable()
export class SystemConfigService implements OnEvents {
  private core: SystemConfigCore;

  constructor(
    @Inject(ISystemMetadataRepository) repository: ISystemMetadataRepository,
    @Inject(IEventRepository) private eventRepository: IEventRepository,
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
  ) {
    this.logger.setContext(SystemConfigService.name);
    this.core = SystemConfigCore.create(repository, this.logger);
    this.core.config$.subscribe((config) => this.setLogLevel(config));
  }

  @EventHandlerOptions({ priority: -100 })
  async onBootstrapEvent() {
    const config = await this.core.getConfig({ withCache: false });
    this.core.config$.next(config);
  }

  async getConfig(): Promise<SystemConfigDto> {
    const config = await this.core.getConfig({ withCache: false });
    return mapConfig(config);
  }

  getDefaults(): SystemConfigDto {
    return mapConfig(defaults);
  }

  onConfigValidateEvent({ newConfig, oldConfig }: SystemConfigUpdateEvent) {
    if (!_.isEqual(instanceToPlain(newConfig.logging), oldConfig.logging) && this.getEnvLogLevel()) {
      throw new Error('Logging cannot be changed while the environment variable IMMICH_LOG_LEVEL is set.');
    }
  }

  async updateConfig(dto: SystemConfigDto): Promise<SystemConfigDto> {
    if (this.core.isUsingConfigFile()) {
      throw new BadRequestException('Cannot update configuration while IMMICH_CONFIG_FILE is in use');
    }

    const oldConfig = await this.core.getConfig({ withCache: false });

    try {
      await this.eventRepository.emit('onConfigValidateEvent', { newConfig: dto, oldConfig });
    } catch (error) {
      this.logger.warn(`Unable to save system config due to a validation error: ${error}`);
      throw new BadRequestException(error instanceof Error ? error.message : error);
    }

    const newConfig = await this.core.updateConfig(dto);

    // TODO probably move web socket emits to a separate service
    this.eventRepository.clientBroadcast(ClientEvent.CONFIG_UPDATE, {});
    this.eventRepository.serverSend(ServerEvent.CONFIG_UPDATE, null);
    await this.eventRepository.emit('onConfigUpdateEvent', { newConfig, oldConfig });

    return mapConfig(newConfig);
  }

  getStorageTemplateOptions(): SystemConfigTemplateStorageOptionDto {
    const options = new SystemConfigTemplateStorageOptionDto();

    options.dayOptions = supportedDayTokens;
    options.weekOptions = supportedWeekTokens;
    options.monthOptions = supportedMonthTokens;
    options.yearOptions = supportedYearTokens;
    options.hourOptions = supportedHourTokens;
    options.secondOptions = supportedSecondTokens;
    options.minuteOptions = supportedMinuteTokens;
    options.presetOptions = supportedPresetTokens;

    return options;
  }

  async getCustomCss(): Promise<string> {
    const { theme } = await this.core.getConfig({ withCache: false });
    return theme.customCss;
  }

  @OnServerEvent(ServerEvent.CONFIG_UPDATE)
  async onConfigUpdateEvent() {
    await this.core.refreshConfig();
  }

  private setLogLevel({ logging }: SystemConfig) {
    const envLevel = this.getEnvLogLevel();
    const configLevel = logging.enabled ? logging.level : false;
    const level = envLevel ?? configLevel;
    this.logger.setLogLevel(level);
    this.logger.log(`LogLevel=${level} ${envLevel ? '(set via IMMICH_LOG_LEVEL)' : '(set via system config)'}`);
  }

  private getEnvLogLevel() {
    return process.env.IMMICH_LOG_LEVEL as LogLevel;
  }
}
