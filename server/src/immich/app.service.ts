import { JobService, LibraryService, ONE_HOUR, SearchService, ServerInfoService, StorageService } from '@app/domain';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression, Interval } from '@nestjs/schedule';

@Injectable()
export class AppService {
  private logger = new Logger(AppService.name);

  constructor(
    private jobService: JobService,
    private libraryService: LibraryService,
    private searchService: SearchService,
    private storageService: StorageService,
    private serverService: ServerInfoService,
  ) {}

  @Interval(ONE_HOUR.as('milliseconds'))
  async onVersionCheck() {
    await this.serverService.handleVersionCheck();
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async onNightlyJob() {
    await this.jobService.handleNightlyJobs();
  }

  async init() {
    this.storageService.init();
    await this.searchService.init();
    await this.serverService.handleVersionCheck();
    this.logger.log(`Feature Flags: ${JSON.stringify(await this.serverService.getFeatures(), null, 2)}`);
    await this.libraryService.init();
  }

  async destroy() {
    this.searchService.teardown();
  }
}
