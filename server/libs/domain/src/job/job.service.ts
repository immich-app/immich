import { Inject, Injectable } from '@nestjs/common';
import { IAlbumRepository } from '../album';
import { IKeyRepository } from '../api-key';
import { IAssetRepository } from '../asset';
import { IStorageRepository } from '../storage';
import { IUserRepository } from '../user';
import { IUserTokenRepository } from '../user-token';
import { JobName } from './job.constants';
import { JobCore } from './job.core';
import { IJobRepository, JobItem } from './job.repository';

@Injectable()
export class JobService {
  private core: JobCore;

  constructor(
    @Inject(IAlbumRepository) albumRepository: IAlbumRepository,
    @Inject(IAssetRepository) assetRepository: IAssetRepository,
    @Inject(IKeyRepository) keyRepository: IKeyRepository,
    @Inject(IJobRepository) jobRepository: IJobRepository,
    @Inject(IStorageRepository) storageRepository: IStorageRepository,
    @Inject(IUserTokenRepository) tokenRepository: IUserTokenRepository,
    @Inject(IUserRepository) userRepository: IUserRepository,
  ) {
    this.core = new JobCore(
      albumRepository,
      assetRepository,
      keyRepository,
      jobRepository,
      storageRepository,
      tokenRepository,
      userRepository,
    );
  }

  handle(job: JobItem) {
    switch (job.name) {
      case JobName.ASSET_UPLOADED:
        return this.core.handleAssetUpload(job.data);
      case JobName.DELETE_FILES:
        return this.core.handleDeleteFiles(job.data);
      case JobName.USER_DELETE_CHECK:
        return this.core.handleUserDeleteCheck();
      case JobName.USER_DELETION:
        return this.core.handleUserDelete(job.data);
    }
  }
}
