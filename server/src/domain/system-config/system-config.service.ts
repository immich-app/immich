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
  private disableCheckLatestVersion: boolean;
  private logger = new Logger();

  constructor(
    @Inject(ISystemConfigRepository) private repository: ISystemConfigRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
  ) {
    this.availableVersion = null;
    this.core = new SystemConfigCore(repository);
    this.disableCheckLatestVersion = process.env.CHECK_NEW_VERSION_INTERVAL === '0';
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
    if (this.disableCheckLatestVersion) {
      return true;
    }
    try {
      this.logger.debug('Checking if a new version is available ...');
      const data = await this.repository.getLatestAvailableVersion();

      if (compareVersions(data.tag_name, serverVersion)) {
        this.logger.debug('New Version detected : ' + stringToVersion(data.tag_name).toString());
        this.availableVersion = stringToVersion(data.tag_name);
        return true;
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
