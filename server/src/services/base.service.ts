import { Inject } from '@nestjs/common';
import { SystemConfig } from 'src/config';
import { StorageCore } from 'src/cores/storage.core';
import { IAccessRepository } from 'src/interfaces/access.interface';
import { IActivityRepository } from 'src/interfaces/activity.interface';
import { IAlbumUserRepository } from 'src/interfaces/album-user.interface';
import { IAlbumRepository } from 'src/interfaces/album.interface';
import { IKeyRepository } from 'src/interfaces/api-key.interface';
import { IAssetRepository } from 'src/interfaces/asset.interface';
import { IAuditRepository } from 'src/interfaces/audit.interface';
import { IConfigRepository } from 'src/interfaces/config.interface';
import { ICryptoRepository } from 'src/interfaces/crypto.interface';
import { IDatabaseRepository } from 'src/interfaces/database.interface';
import { IEventRepository } from 'src/interfaces/event.interface';
import { IJobRepository } from 'src/interfaces/job.interface';
import { ILibraryRepository } from 'src/interfaces/library.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { IMachineLearningRepository } from 'src/interfaces/machine-learning.interface';
import { IMapRepository } from 'src/interfaces/map.interface';
import { IMediaRepository } from 'src/interfaces/media.interface';
import { IMemoryRepository } from 'src/interfaces/memory.interface';
import { IMetadataRepository } from 'src/interfaces/metadata.interface';
import { IMetricRepository } from 'src/interfaces/metric.interface';
import { IMoveRepository } from 'src/interfaces/move.interface';
import { INotificationRepository } from 'src/interfaces/notification.interface';
import { IOAuthRepository } from 'src/interfaces/oauth.interface';
import { IPartnerRepository } from 'src/interfaces/partner.interface';
import { IPersonRepository } from 'src/interfaces/person.interface';
import { ISearchRepository } from 'src/interfaces/search.interface';
import { IServerInfoRepository } from 'src/interfaces/server-info.interface';
import { ISessionRepository } from 'src/interfaces/session.interface';
import { ISharedLinkRepository } from 'src/interfaces/shared-link.interface';
import { IStackRepository } from 'src/interfaces/stack.interface';
import { IStorageRepository } from 'src/interfaces/storage.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { ITagRepository } from 'src/interfaces/tag.interface';
import { ITrashRepository } from 'src/interfaces/trash.interface';
import { IUserRepository } from 'src/interfaces/user.interface';
import { IVersionHistoryRepository } from 'src/interfaces/version-history.interface';
import { IViewRepository } from 'src/interfaces/view.interface';
import { AccessRequest, checkAccess, requireAccess } from 'src/utils/access';
import { getConfig, updateConfig } from 'src/utils/config';

export class BaseService {
  protected storageCore: StorageCore;

  constructor(
    @Inject(ILoggerRepository) protected logger: ILoggerRepository,
    @Inject(IAccessRepository) protected accessRepository: IAccessRepository,
    @Inject(IActivityRepository) protected activityRepository: IActivityRepository,
    @Inject(IAuditRepository) protected auditRepository: IAuditRepository,
    @Inject(IAlbumRepository) protected albumRepository: IAlbumRepository,
    @Inject(IAlbumUserRepository) protected albumUserRepository: IAlbumUserRepository,
    @Inject(IAssetRepository) protected assetRepository: IAssetRepository,
    @Inject(IConfigRepository) protected configRepository: IConfigRepository,
    @Inject(ICryptoRepository) protected cryptoRepository: ICryptoRepository,
    @Inject(IDatabaseRepository) protected databaseRepository: IDatabaseRepository,
    @Inject(IEventRepository) protected eventRepository: IEventRepository,
    @Inject(IJobRepository) protected jobRepository: IJobRepository,
    @Inject(IKeyRepository) protected keyRepository: IKeyRepository,
    @Inject(ILibraryRepository) protected libraryRepository: ILibraryRepository,
    @Inject(IMachineLearningRepository) protected machineLearningRepository: IMachineLearningRepository,
    @Inject(IMapRepository) protected mapRepository: IMapRepository,
    @Inject(IMediaRepository) protected mediaRepository: IMediaRepository,
    @Inject(IMemoryRepository) protected memoryRepository: IMemoryRepository,
    @Inject(IMetadataRepository) protected metadataRepository: IMetadataRepository,
    @Inject(IMetricRepository) protected metricRepository: IMetricRepository,
    @Inject(IMoveRepository) protected moveRepository: IMoveRepository,
    @Inject(INotificationRepository) protected notificationRepository: INotificationRepository,
    @Inject(IOAuthRepository) protected oauthRepository: IOAuthRepository,
    @Inject(IPartnerRepository) protected partnerRepository: IPartnerRepository,
    @Inject(IPersonRepository) protected personRepository: IPersonRepository,
    @Inject(ISearchRepository) protected searchRepository: ISearchRepository,
    @Inject(IServerInfoRepository) protected serverInfoRepository: IServerInfoRepository,
    @Inject(ISessionRepository) protected sessionRepository: ISessionRepository,
    @Inject(ISharedLinkRepository) protected sharedLinkRepository: ISharedLinkRepository,
    @Inject(IStackRepository) protected stackRepository: IStackRepository,
    @Inject(IStorageRepository) protected storageRepository: IStorageRepository,
    @Inject(ISystemMetadataRepository) protected systemMetadataRepository: ISystemMetadataRepository,
    @Inject(ITagRepository) protected tagRepository: ITagRepository,
    @Inject(ITrashRepository) protected trashRepository: ITrashRepository,
    @Inject(IUserRepository) protected userRepository: IUserRepository,
    @Inject(IVersionHistoryRepository) protected versionRepository: IVersionHistoryRepository,
    @Inject(IViewRepository) protected viewRepository: IViewRepository,
  ) {
    this.logger.setContext(this.constructor.name);
    this.storageCore = StorageCore.create(
      assetRepository,
      configRepository,
      cryptoRepository,
      moveRepository,
      personRepository,
      storageRepository,
      systemMetadataRepository,
      this.logger,
    );
  }

  private get configRepos() {
    return {
      configRepo: this.configRepository,
      metadataRepo: this.systemMetadataRepository,
      logger: this.logger,
    };
  }

  getConfig(options: { withCache: boolean }) {
    return getConfig(this.configRepos, options);
  }

  updateConfig(newConfig: SystemConfig) {
    return updateConfig(this.configRepos, newConfig);
  }

  requireAccess(request: AccessRequest) {
    return requireAccess(this.accessRepository, request);
  }

  checkAccess(request: AccessRequest) {
    return checkAccess(this.accessRepository, request);
  }
}
