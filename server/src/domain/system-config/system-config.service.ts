import { Inject, Injectable } from '@nestjs/common';
import { JobName } from '../job';
import {
  CommunicationEvent,
  ICommunicationRepository,
  IJobRepository,
  ISmartInfoRepository,
  ISystemConfigRepository,
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
  private core: SystemConfigCore;
  constructor(
    @Inject(ISystemConfigRepository) private repository: ISystemConfigRepository,
    @Inject(ICommunicationRepository) private communicationRepository: ICommunicationRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
    @Inject(ISmartInfoRepository) private smartInfoRepository: ISmartInfoRepository,
  ) {
    this.core = SystemConfigCore.create(repository);
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
    await this.jobRepository.queue({ name: JobName.SYSTEM_CONFIG_CHANGE });
    this.communicationRepository.broadcast(CommunicationEvent.CONFIG_UPDATE, {});
    if (oldConfig.machineLearning.clip.modelName !== newConfig.machineLearning.clip.modelName) {
      await this.smartInfoRepository.init(newConfig.machineLearning.clip.modelName);
    }
    return mapConfig(newConfig);
  }

  async refreshConfig() {
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
}
