import { Inject, Injectable, Logger } from '@nestjs/common';
import { ISystemConfigRepository } from '.';
import { ServerVersion, serverVersion } from '../domain.constant';
import { IJobRepository, JobName } from '../job';
import { mapConfig, SystemConfigDto } from './dto/system-config.dto';
import { SystemConfigTemplateStorageOptionDto } from './response-dto/system-config-template-storage-option.dto';
import {
  supportedDayTokens,
  supportedHourTokens,
  supportedMinuteTokens,
  supportedMonthTokens,
  supportedPresetTokens,
  supportedSecondTokens,
  supportedYearTokens,
} from './system-config.constants';
import { SystemConfigCore, SystemConfigValidator } from './system-config.core';
import { compareVersions, stringToVersion } from './system-config.util';

@Injectable()
export class SystemConfigService {
  private core: SystemConfigCore;
  public availableVersion: ServerVersion | null;
  public dateCheckAvailbleVersion: number | null;
  private logger = new Logger();

  constructor(
    @Inject(ISystemConfigRepository) private repository: ISystemConfigRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
  ) {
    this.dateCheckAvailbleVersion = null;
    this.availableVersion = null;
    this.core = new SystemConfigCore(repository);
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
    const config = await this.core.updateConfig(dto);
    await this.jobRepository.queue({ name: JobName.SYSTEM_CONFIG_CHANGE });
    return mapConfig(config);
  }

  async refreshConfig() {
    await this.core.refreshConfig();
    return true;
  }

  addValidator(validator: SystemConfigValidator) {
    this.core.addValidator(validator);
  }

  async handleImmichLatestVersionAvailable() {
    try {
      this.logger.debug('Checking if a new version is available ...');
      const data = await this.repository.getLatestAvailableVersion();
      this.dateCheckAvailbleVersion = Date.now();
      if (compareVersions(data.tag_name, serverVersion)) {
        this.logger.log('New Immich version detected : ' + stringToVersion(data.tag_name).toString());
        this.availableVersion = stringToVersion(data.tag_name);
        return true;
      } else {
        this.logger.debug('No new version detected');
      }
    } catch (error) {
      this.logger.error('Error occurred:', error);
      return false;
    }
  }

  getStorageTemplateOptions(): SystemConfigTemplateStorageOptionDto {
    const options = new SystemConfigTemplateStorageOptionDto();

    options.dayOptions = supportedDayTokens;
    options.monthOptions = supportedMonthTokens;
    options.yearOptions = supportedYearTokens;
    options.hourOptions = supportedHourTokens;
    options.secondOptions = supportedSecondTokens;
    options.minuteOptions = supportedMinuteTokens;
    options.presetOptions = supportedPresetTokens;

    return options;
  }
}
