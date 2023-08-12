import {
  ISystemConfigRepository,
  JobService,
  MACHINE_LEARNING_ENABLED,
  SearchService,
  StorageService,
  SystemConfigService,
} from '@app/domain';
import { SystemConfigCore } from '@app/domain/system-config/system-config.core';
import { checkIntervalTime } from '@app/infra';
import { SystemConfig } from '@app/infra/entities';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class AppService {
  private logger = new Logger(AppService.name);
  private configCore: SystemConfigCore;

  constructor(
    @Inject(ISystemConfigRepository) configRepository: ISystemConfigRepository,
    private jobService: JobService,
    private searchService: SearchService,
    private storageService: StorageService,
    private systemConfigService: SystemConfigService,
  ) {
    this.configCore = new SystemConfigCore(configRepository);
    this.configCore.config$.subscribe((config) => this.onConfig(config));
  }

  async onConfig(config: SystemConfig) {
    if (
      config.checkAvailableVersion.enabled &&
      !this.configCore.schedulerRegistry.doesExist('interval', 'check-available-version')
    ) {
      this.logger.verbose('Added check-available-version interval');
      await this.systemConfigService.handleImmichLatestVersionAvailable();
      const interval = setInterval(
        () => this.systemConfigService.handleImmichLatestVersionAvailable(),
        checkIntervalTime,
      );
      this.configCore.schedulerRegistry.addInterval('check-available-version', interval);
    } else if (
      !config.checkAvailableVersion.enabled &&
      this.configCore.schedulerRegistry.doesExist('interval', 'check-available-version')
    ) {
      this.logger.verbose('Removed check-available-version interval');
      this.systemConfigService.availableVersion = null;
      this.systemConfigService.dateCheckAvailbleVersion = null;
      this.configCore.schedulerRegistry.deleteInterval('check-available-version');
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async onNightlyJob() {
    await this.jobService.handleNightlyJobs();
  }

  async init() {
    this.storageService.init();
    await this.searchService.init();

    this.logger.log(`Machine learning is ${MACHINE_LEARNING_ENABLED ? 'enabled' : 'disabled'}`);
    this.logger.log(`Search is ${this.searchService.isEnabled() ? 'enabled' : 'disabled'}`);

    const config = await this.configCore.getConfig();
    if (config.checkAvailableVersion.enabled) {
      await this.systemConfigService.handleImmichLatestVersionAvailable();
      const interval = setInterval(
        () => this.systemConfigService.handleImmichLatestVersionAvailable(),
        checkIntervalTime,
      );
      this.configCore.schedulerRegistry.addInterval('check-available-version', interval);
    }
  }
}
