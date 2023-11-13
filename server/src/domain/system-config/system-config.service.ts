import { Inject, Injectable } from '@nestjs/common';
import { JobName } from '../job';
import { CommunicationEvent, ICommunicationRepository, IJobRepository, ISystemConfigRepository } from '../repositories';
import { SystemConfigThemeDto } from './dto/system-config-theme.dto';
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
  ) {
    this.core = SystemConfigCore.create(repository);
  }

  get config$() {
    return this.core.config$;
  }

  async getTheme(): Promise<SystemConfigThemeDto> {
    const { theme } = await this.core.getConfig();
    return theme;
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
    const config = await this.core.updateConfig(dto);
    await this.jobRepository.queue({ name: JobName.SYSTEM_CONFIG_CHANGE });
    this.communicationRepository.broadcast(CommunicationEvent.CONFIG_UPDATE, {});
    return mapConfig(config);
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

    return JSON.parse(await this.repository.readFile(`./assets/style-${theme}.json`));
  }
}
