import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
import _ from 'lodash';
import { defaults } from 'src/config';
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
import { OnEvent } from 'src/decorators';
import { SystemConfigDto, SystemConfigTemplateStorageOptionDto, mapConfig } from 'src/dtos/system-config.dto';
import { LogLevel } from 'src/enum';
import { ArgOf, IEventRepository } from 'src/interfaces/event.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { toPlainObject } from 'src/utils/object';

@Injectable()
export class SystemConfigService {
  private core: SystemConfigCore;

  constructor(
    @Inject(ISystemMetadataRepository) repository: ISystemMetadataRepository,
    @Inject(IEventRepository) private eventRepository: IEventRepository,
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
  ) {
    this.logger.setContext(SystemConfigService.name);
    this.core = SystemConfigCore.create(repository, this.logger);
  }

  @OnEvent({ name: 'app.bootstrap', priority: -100 })
  async onBootstrap() {
    const config = await this.core.getConfig({ withCache: false });
    await this.eventRepository.emit('config.update', { newConfig: config });
  }

  async getConfig(): Promise<SystemConfigDto> {
    const config = await this.core.getConfig({ withCache: false });
    return mapConfig(config);
  }

  getDefaults(): SystemConfigDto {
    return mapConfig(defaults);
  }

  @OnEvent({ name: 'config.update', server: true })
  onConfigUpdate({ newConfig: { logging } }: ArgOf<'config.update'>) {
    const envLevel = this.getEnvLogLevel();
    const configLevel = logging.enabled ? logging.level : false;
    const level = envLevel ?? configLevel;
    this.logger.setLogLevel(level);
    this.logger.log(`LogLevel=${level} ${envLevel ? '(set via IMMICH_LOG_LEVEL)' : '(set via system config)'}`);
    // TODO only do this if the event is a socket.io event
    this.core.invalidateCache();
  }

  @OnEvent({ name: 'config.validate' })
  onConfigValidate({ newConfig, oldConfig }: ArgOf<'config.validate'>) {
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
      await this.eventRepository.emit('config.validate', { newConfig: toPlainObject(dto), oldConfig });
    } catch (error) {
      this.logger.warn(`Unable to save system config due to a validation error: ${error}`);
      throw new BadRequestException(error instanceof Error ? error.message : error);
    }

    const newConfig = await this.core.updateConfig(dto);

    await this.eventRepository.emit('config.update', { newConfig, oldConfig });

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

  private getEnvLogLevel() {
    return process.env.IMMICH_LOG_LEVEL as LogLevel;
  }
}
