import { Inject } from '@nestjs/common';
import { SystemConfig } from 'src/config';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { getConfig, updateConfig } from 'src/utils/config';

export class BaseService {
  constructor(
    @Inject(ISystemMetadataRepository) protected systemMetadataRepository: ISystemMetadataRepository,
    @Inject(ILoggerRepository) protected logger: ILoggerRepository,
  ) {}

  getConfig(options: { withCache: boolean }) {
    return getConfig(
      {
        metadataRepo: this.systemMetadataRepository,
        logger: this.logger,
      },
      options,
    );
  }

  updateConfig(newConfig: SystemConfig) {
    return updateConfig(
      {
        metadataRepo: this.systemMetadataRepository,
        logger: this.logger,
      },
      newConfig,
    );
  }
}
