import { Inject } from '@nestjs/common';
import { SystemConfig } from 'src/config';
import { IConfigRepository } from 'src/interfaces/config.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { getConfig, updateConfig } from 'src/utils/config';

export class BaseService {
  constructor(
    @Inject(IConfigRepository) protected configRepository: IConfigRepository,
    @Inject(ISystemMetadataRepository) protected systemMetadataRepository: ISystemMetadataRepository,
    @Inject(ILoggerRepository) protected logger: ILoggerRepository,
  ) {}

  private get repos() {
    return {
      configRepo: this.configRepository,
      metadataRepo: this.systemMetadataRepository,
      logger: this.logger,
    };
  }

  getConfig(options: { withCache: boolean }) {
    return getConfig(this.repos, options);
  }

  updateConfig(newConfig: SystemConfig) {
    return updateConfig(this.repos, newConfig);
  }
}
