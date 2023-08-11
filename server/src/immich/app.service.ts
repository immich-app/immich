import {
  ISystemConfigRepository,
  JobService,
  MACHINE_LEARNING_ENABLED,
  SearchService,
  StorageService,
  SystemConfigService,
} from '@app/domain';
import { SystemConfigCore } from '@app/domain/system-config/system-config.core';
import { SystemConfig } from '@app/infra/entities';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class AppService implements OnModuleInit {
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
  async onModuleInit() {
    const config = await this.configCore.getConfig();
    if (config.checkAvailableVersion.enabled) {
      const time = 60 * 60 * 1000;
      const interval = setInterval(() => this.systemConfigService.handleImmichLatestVersionAvailable(), time);
      this.configCore.schedulerRegistry.addInterval('check-available-version', interval);
    }
  }

  onConfig(config: SystemConfig) {
    console.log(config.checkAvailableVersion);
    if (config.checkAvailableVersion.enabled) {
      const time = 60 * 60 * 1000;
      const interval = setInterval(() => this.systemConfigService.handleImmichLatestVersionAvailable(), time);
      this.configCore.schedulerRegistry.addInterval('check-available-version', interval);
    } else {
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
  }
}
