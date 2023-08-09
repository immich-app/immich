import { JobService, MACHINE_LEARNING_ENABLED, SearchService, StorageService, SystemConfigService } from '@app/domain';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';

@Injectable()
export class AppService implements OnModuleInit {
  private logger = new Logger(AppService.name);

  constructor(
    private jobService: JobService,
    private searchService: SearchService,
    private storageService: StorageService,
    private systemConfigService: SystemConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  onModuleInit() {
    const time = (Number(process.env.CHECK_NEW_VERSION_INTERVAL) || 6) * 60 * 60 * 1000;

    if (time > 0) {
      const interval = setInterval(() => this.intervalImmichLatestVersionAvailable(), time);
      this.schedulerRegistry.addInterval('custom-interval', interval);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async onNightlyJob() {
    await this.jobService.handleNightlyJobs();
  }

  async intervalImmichLatestVersionAvailable() {
    await this.systemConfigService.handleImmichLatestVersionAvailable();
  }

  async init() {
    this.storageService.init();
    await this.searchService.init();

    this.logger.log(`Machine learning is ${MACHINE_LEARNING_ENABLED ? 'enabled' : 'disabled'}`);
    this.logger.log(`Search is ${this.searchService.isEnabled() ? 'enabled' : 'disabled'}`);
  }
}
