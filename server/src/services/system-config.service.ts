import { BadRequestException, Injectable } from '@nestjs/common';
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
import { OnEvent } from 'src/decorators';
import { SystemConfigDto, SystemConfigTemplateStorageOptionDto, mapConfig } from 'src/dtos/system-config.dto';
import { ArgOf } from 'src/interfaces/event.interface';
import { BaseService } from 'src/services/base.service';
import { clearConfigCache } from 'src/utils/config';
import { toPlainObject } from 'src/utils/object';

@Injectable()
export class SystemConfigService extends BaseService {
  @OnEvent({ name: 'app.bootstrap', priority: -100 })
  async onBootstrap() {
    const config = await this.getConfig({ withCache: false });
    await this.eventRepository.emit('config.update', { newConfig: config });
  }

  async getSystemConfig(): Promise<SystemConfigDto> {
    const config = await this.getConfig({ withCache: false });
    return mapConfig(config);
  }

  getDefaults(): SystemConfigDto {
    return mapConfig(defaults);
  }

  @OnEvent({ name: 'config.update', server: true })
  onConfigUpdate({ newConfig: { logging } }: ArgOf<'config.update'>) {
    const { logLevel: envLevel } = this.configRepository.getEnv();
    const configLevel = logging.enabled ? logging.level : false;
    const level = envLevel ?? configLevel;
    this.logger.setLogLevel(level);
    this.logger.log(`LogLevel=${level} ${envLevel ? '(set via IMMICH_LOG_LEVEL)' : '(set via system config)'}`);
    // TODO only do this if the event is a socket.io event
    clearConfigCache();
  }

  @OnEvent({ name: 'config.validate' })
  onConfigValidate({ newConfig, oldConfig }: ArgOf<'config.validate'>) {
    const { logLevel } = this.configRepository.getEnv();
    if (!_.isEqual(instanceToPlain(newConfig.logging), oldConfig.logging) && logLevel) {
      throw new Error('Logging cannot be changed while the environment variable IMMICH_LOG_LEVEL is set.');
    }
  }

  async updateSystemConfig(dto: SystemConfigDto): Promise<SystemConfigDto> {
    const { configFile } = this.configRepository.getEnv();
    if (configFile) {
      throw new BadRequestException('Cannot update configuration while IMMICH_CONFIG_FILE is in use');
    }

    const oldConfig = await this.getConfig({ withCache: false });

    try {
      await this.eventRepository.emit('config.validate', { newConfig: toPlainObject(dto), oldConfig });
    } catch (error) {
      this.logger.warn(`Unable to save system config due to a validation error: ${error}`);
      throw new BadRequestException(error instanceof Error ? error.message : error);
    }

    const newConfig = await this.updateConfig(dto);

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
    const { theme } = await this.getConfig({ withCache: false });
    return theme.customCss;
  }
}
