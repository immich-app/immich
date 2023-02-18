import { SystemConfig } from '@app/infra/db/entities';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { IAlbumRepository } from '../album';
import { IKeyRepository } from '../api-key';
import { IAssetRepository } from '../asset';
import { IStorageRepository } from '../storage';
import { INITIAL_SYSTEM_CONFIG, ISystemConfigRepository } from '../system-config';
import { IUserRepository } from '../user';
import { IUserTokenRepository } from '../user-token';
import { JobName } from './job.constants';
import { JobCore } from './job.core';
import { IJobRepository, JobItem } from './job.repository';

@Injectable()
export class JobService {
  private logger = new Logger(JobService.name);
  private core: JobCore;

  constructor(
    @Inject(IAlbumRepository) albumRepository: IAlbumRepository,
    @Inject(IAssetRepository) assetRepository: IAssetRepository,
    @Inject(ISystemConfigRepository) configRepository: ISystemConfigRepository,
    @Inject(IKeyRepository) keyRepository: IKeyRepository,
    @Inject(IJobRepository) jobRepository: IJobRepository,
    @Inject(IStorageRepository) storageRepository: IStorageRepository,
    @Inject(IUserTokenRepository) tokenRepository: IUserTokenRepository,
    @Inject(IUserRepository) userRepository: IUserRepository,
    @Inject(INITIAL_SYSTEM_CONFIG) config: SystemConfig,
  ) {
    this.core = new JobCore(
      albumRepository,
      assetRepository,
      configRepository,
      config,
      keyRepository,
      jobRepository,
      storageRepository,
      tokenRepository,
      userRepository,
    );
  }

  handle(job: JobItem) {
    this.logger.debug(`Handling job: ${job.name}`);

    switch (job.name) {
      case JobName.ASSET_UPLOADED:
        return this.core.handleAssetUpload(job.data);
      case JobName.CONFIG_CHANGE:
        return this.core.handleAssetUpload;
      case JobName.DELETE_FILES:
        return this.core.handleDeleteFiles(job.data);
      case JobName.TEMPLATE_MIGRATION:
        return this.core.handleTemplateMigration();
      case JobName.USER_DELETE_CHECK:
        return this.core.handleUserDeleteCheck();
      case JobName.USER_DELETION:
        return this.core.handleUserDelete(job.data);

      default:
        this.logger.error(`Invalid jobService.handle JobName: ${job.name}`);
    }
  }
}
