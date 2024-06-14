import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression, Interval } from '@nestjs/schedule';
import { ONE_HOUR } from 'src/constants';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { DatabaseService } from 'src/services/database.service';
import { JobService } from 'src/services/job.service';
import { ServerInfoService } from 'src/services/server-info.service';
import { StorageService } from 'src/services/storage.service';
import { SystemConfigService } from 'src/services/system-config.service';
import { VersionService } from 'src/services/version.service';

@Injectable()
export class ApiService {
  constructor(
    private configService: SystemConfigService,
    private jobService: JobService,
    private serverService: ServerInfoService,
    private storageService: StorageService,
    private databaseService: DatabaseService,
    private versionService: VersionService,
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
  ) {
    this.logger.setContext(ApiService.name);
  }

  @Interval(ONE_HOUR.as('milliseconds'))
  async onVersionCheck() {
    await this.versionService.handleQueueVersionCheck();
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async onNightlyJob() {
    await this.jobService.handleNightlyJobs();
  }

  async init() {
    await this.databaseService.init();
    await this.configService.init();
    this.storageService.init();
    await this.serverService.init();
    await this.versionService.init();
    this.logger.log(`Feature Flags: ${JSON.stringify(await this.serverService.getFeatures(), null, 2)}`);
  }
}
