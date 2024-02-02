import { LogLevel, SystemConfig } from '@app/infra/entities';
import { ImmichLogger } from '@app/infra/logger';
import { Inject, Injectable } from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
import _ from 'lodash';
import {
  ClientEvent,
  ICommunicationRepository,
  ISmartInfoRepository,
  ISystemConfigRepository,
  ServerEvent,
} from '../repositories';
import { SystemConfigDto, mapConfig } from './dto/system-config.dto';
import { SystemConfigTemplateStorageOptionDto } from './response-dto/system-config-template-storage-option.dto';
import {
  supportedDayTokens,
  supportedHourTokens,
  supportedMinuteTokens,
  supportedMonthTokens,
  supportedPresetTokens,
  supportedSecondTokens,
  supportedWeekTokens,
  supportedYearTokens,
} from './system-config.constants';
import { SystemConfigCore, SystemConfigValidator } from './system-config.core';

@Injectable()
export class SystemConfigService {
  private logger = new ImmichLogger(SystemConfigService.name);
  private core: SystemConfigCore;

  constructor(
    @Inject(ISystemConfigRepository) private repository: ISystemConfigRepository,
    @Inject(ICommunicationRepository) private communicationRepository: ICommunicationRepository,
    @Inject(ISmartInfoRepository) private smartInfoRepository: ISmartInfoRepository,
  ) {
    this.core = SystemConfigCore.create(repository);
    this.communicationRepository.on(ServerEvent.CONFIG_UPDATE, () => this.handleConfigUpdate());
    this.core.config$.subscribe((config) => this.setLogLevel(config));
    this.core.addValidator((newConfig, oldConfig) => this.validateConfig(newConfig, oldConfig));
  }

  async init() {
    const config = await this.core.getConfig();
    this.config$.next(config);
  }

  get config$() {
    return this.core.config$;
  }

  async getConfig(): Promise<SystemConfigDto> {
    const config = await this.core.getConfig();
    return mapConfig(config);
  }

  getDefaults(): SystemConfigDto {
    const config = this.core.getDefaults();
    return mapConfig(config);
  }

  async updateConfig(dto: SystemConfigDto): Promise<SystemConfigDto> {
    const oldConfig = await this.core.getConfig();
    const newConfig = await this.core.updateConfig(dto);

    this.communicationRepository.broadcast(ClientEvent.CONFIG_UPDATE, {});
    this.communicationRepository.sendServerEvent(ServerEvent.CONFIG_UPDATE);

    if (oldConfig.machineLearning.clip.modelName !== newConfig.machineLearning.clip.modelName) {
      await this.smartInfoRepository.init(newConfig.machineLearning.clip.modelName);
    }
    return mapConfig(newConfig);
  }

  // this is only used by the cli on config change, and it's not actually needed anymore
  async refreshConfig() {
    this.communicationRepository.sendServerEvent(ServerEvent.CONFIG_UPDATE);
    await this.core.refreshConfig();
    return true;
  }

  addValidator(validator: SystemConfigValidator) {
    this.core.addValidator(validator);
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

  async getMapStyle(theme: 'light' | 'dark') {
    const { map } = await this.getConfig();
    const styleUrl = theme === 'dark' ? map.darkStyle : map.lightStyle;

    if (styleUrl) {
      return this.repository.fetchStyle(styleUrl);
    }

    return JSON.parse(await this.repository.readFile(`./resources/style-${theme}.json`));
  }

  async getCustomCss(): Promise<string> {
    const { theme } = await this.core.getConfig();
    return theme.customCss;
  }

  private async handleConfigUpdate() {
    await this.core.refreshConfig();
  }

  private async setLogLevel({ logging }: SystemConfig) {
    const envLevel = this.getEnvLogLevel();
    const configLevel = logging.enabled ? logging.level : false;
    const level = envLevel ?? configLevel;
    ImmichLogger.setLogLevel(level);
    this.logger.log(`LogLevel=${level} ${envLevel ? '(set via LOG_LEVEL)' : '(set via system config)'}`);
  }

  private getEnvLogLevel() {
    return process.env.LOG_LEVEL as LogLevel;
  }

  private async validateConfig(newConfig: SystemConfig, oldConfig: SystemConfig) {
    if (!_.isEqual(instanceToPlain(newConfig.logging), oldConfig.logging) && this.getEnvLogLevel()) {
      throw new Error('Logging cannot be changed while the environment variable LOG_LEVEL is set.');
    }
  }
}
