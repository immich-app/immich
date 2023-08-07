import { JobService, MACHINE_LEARNING_ENABLED, SearchService, StorageService, SystemConfigService } from '@app/domain';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression, Interval } from '@nestjs/schedule';

@Injectable()
export class AppService {
  private logger = new Logger(AppService.name);

  constructor(
    private jobService: JobService,
    private searchService: SearchService,
    private storageService: StorageService,
    private systemConfigService: SystemConfigService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async onNightlyJob() {
    await this.jobService.handleNightlyJobs();
  }

  @Interval(15 * 1000)
  async onEveryDay() {
    await this.systemConfigService.handleImmichLatestVersionAvailable();
  }

  async init() {
    this.storageService.init();
    await this.searchService.init();

    this.logger.log(`Machine learning is ${MACHINE_LEARNING_ENABLED ? 'enabled' : 'disabled'}`);
    this.logger.log(`Search is ${this.searchService.isEnabled() ? 'enabled' : 'disabled'}`);
  }
}
