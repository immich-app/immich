import {
  ISystemConfigRepository,
  JobService,
  SearchService,
  ServerInfoService,
  StorageService,
  SystemConfigCore,
  SystemConfigService,
} from '@app/domain';
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
    private serverService: ServerInfoService,
  ) {
    this.configCore = new SystemConfigCore(configRepository);
    this.configCore.config$.subscribe((config) => this.onConfig(config));
  }

  async onConfig(config: SystemConfig) {
    if (
      config.newVersionCheck.enabled &&
      !this.serverService.schedulerRegistry.doesExist('interval', 'check-available-version')
    ) {
      this.logger.verbose('Added check-available-version interval');
      await this.systemConfigService.handleImmichLatestVersionAvailable();
      const interval = setInterval(
        () => this.systemConfigService.handleImmichLatestVersionAvailable(),
        checkIntervalTime,
      );
      this.serverService.schedulerRegistry.addInterval('check-available-version', interval);
    } else if (
      !config.newVersionCheck.enabled &&
      this.serverService.schedulerRegistry.doesExist('interval', 'check-available-version')
    ) {
      this.logger.verbose('Removed check-available-version interval');
      this.systemConfigService.availableVersion = null;
      this.systemConfigService.dateCheckAvailableVersion = null;
      this.serverService.schedulerRegistry.deleteInterval('check-available-version');
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async onNightlyJob() {
    await this.jobService.handleNightlyJobs();
  }

  async init() {
    this.storageService.init();
    await this.searchService.init();
    this.logger.log(`Feature Flags: ${JSON.stringify(await this.serverService.getFeatures(), null, 2)}`);

    const config = await this.configCore.getConfig();
    if (config.newVersionCheck.enabled) {
      await this.systemConfigService.handleImmichLatestVersionAvailable();
      const interval = setInterval(
        () => this.systemConfigService.handleImmichLatestVersionAvailable(),
        checkIntervalTime,
      );
      this.serverService.schedulerRegistry.addInterval('check-available-version', interval);
    }
  }

  async destroy() {
    this.searchService.teardown();
    this.serverService.teardown();
  }
}
