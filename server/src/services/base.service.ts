import { BadRequestException, Inject } from '@nestjs/common';
import { Insertable } from 'kysely';
import sanitize from 'sanitize-filename';
import { SystemConfig } from 'src/config';
import { SALT_ROUNDS } from 'src/constants';
import { StorageCore } from 'src/cores/storage.core';
import { Users } from 'src/db';
import { UserEntity } from 'src/entities/user.entity';
import { IAlbumRepository } from 'src/interfaces/album.interface';
import { IAssetRepository } from 'src/interfaces/asset.interface';
import { ICryptoRepository } from 'src/interfaces/crypto.interface';
import { IDatabaseRepository } from 'src/interfaces/database.interface';
import { IEventRepository } from 'src/interfaces/event.interface';
import { IJobRepository } from 'src/interfaces/job.interface';
import { ILibraryRepository } from 'src/interfaces/library.interface';
import { IMachineLearningRepository } from 'src/interfaces/machine-learning.interface';
import { IMoveRepository } from 'src/interfaces/move.interface';
import { IPartnerRepository } from 'src/interfaces/partner.interface';
import { IPersonRepository } from 'src/interfaces/person.interface';
import { IProcessRepository } from 'src/interfaces/process.interface';
import { ISearchRepository } from 'src/interfaces/search.interface';
import { ISessionRepository } from 'src/interfaces/session.interface';
import { ISharedLinkRepository } from 'src/interfaces/shared-link.interface';
import { IStackRepository } from 'src/interfaces/stack.interface';
import { IStorageRepository } from 'src/interfaces/storage.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { ITagRepository } from 'src/interfaces/tag.interface';
import { IUserRepository } from 'src/interfaces/user.interface';
import { AccessRepository } from 'src/repositories/access.repository';
import { ActivityRepository } from 'src/repositories/activity.repository';
import { AlbumUserRepository } from 'src/repositories/album-user.repository';
import { ApiKeyRepository } from 'src/repositories/api-key.repository';
import { AuditRepository } from 'src/repositories/audit.repository';
import { ConfigRepository } from 'src/repositories/config.repository';
import { CronRepository } from 'src/repositories/cron.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { MapRepository } from 'src/repositories/map.repository';
import { MediaRepository } from 'src/repositories/media.repository';
import { MemoryRepository } from 'src/repositories/memory.repository';
import { MetadataRepository } from 'src/repositories/metadata.repository';
import { NotificationRepository } from 'src/repositories/notification.repository';
import { OAuthRepository } from 'src/repositories/oauth.repository';
import { ServerInfoRepository } from 'src/repositories/server-info.repository';
import { TelemetryRepository } from 'src/repositories/telemetry.repository';
import { TrashRepository } from 'src/repositories/trash.repository';
import { VersionHistoryRepository } from 'src/repositories/version-history.repository';
import { ViewRepository } from 'src/repositories/view-repository';
import { AccessRequest, checkAccess, requireAccess } from 'src/utils/access';
import { getConfig, updateConfig } from 'src/utils/config';

export class BaseService {
  protected storageCore: StorageCore;

  constructor(
    protected logger: LoggingRepository,
    protected accessRepository: AccessRepository,
    protected activityRepository: ActivityRepository,
    protected auditRepository: AuditRepository,
    @Inject(IAlbumRepository) protected albumRepository: IAlbumRepository,
    protected albumUserRepository: AlbumUserRepository,
    @Inject(IAssetRepository) protected assetRepository: IAssetRepository,
    protected configRepository: ConfigRepository,
    protected cronRepository: CronRepository,
    @Inject(ICryptoRepository) protected cryptoRepository: ICryptoRepository,
    @Inject(IDatabaseRepository) protected databaseRepository: IDatabaseRepository,
    @Inject(IEventRepository) protected eventRepository: IEventRepository,
    @Inject(IJobRepository) protected jobRepository: IJobRepository,
    protected keyRepository: ApiKeyRepository,
    @Inject(ILibraryRepository) protected libraryRepository: ILibraryRepository,
    @Inject(IMachineLearningRepository) protected machineLearningRepository: IMachineLearningRepository,
    protected mapRepository: MapRepository,
    protected mediaRepository: MediaRepository,
    protected memoryRepository: MemoryRepository,
    protected metadataRepository: MetadataRepository,
    @Inject(IMoveRepository) protected moveRepository: IMoveRepository,
    protected notificationRepository: NotificationRepository,
    protected oauthRepository: OAuthRepository,
    @Inject(IPartnerRepository) protected partnerRepository: IPartnerRepository,
    @Inject(IPersonRepository) protected personRepository: IPersonRepository,
    @Inject(IProcessRepository) protected processRepository: IProcessRepository,
    @Inject(ISearchRepository) protected searchRepository: ISearchRepository,
    protected serverInfoRepository: ServerInfoRepository,
    @Inject(ISessionRepository) protected sessionRepository: ISessionRepository,
    @Inject(ISharedLinkRepository) protected sharedLinkRepository: ISharedLinkRepository,
    @Inject(IStackRepository) protected stackRepository: IStackRepository,
    @Inject(IStorageRepository) protected storageRepository: IStorageRepository,
    @Inject(ISystemMetadataRepository) protected systemMetadataRepository: ISystemMetadataRepository,
    @Inject(ITagRepository) protected tagRepository: ITagRepository,
    protected telemetryRepository: TelemetryRepository,
    protected trashRepository: TrashRepository,
    @Inject(IUserRepository) protected userRepository: IUserRepository,
    protected versionRepository: VersionHistoryRepository,
    protected viewRepository: ViewRepository,
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

  get worker() {
    return this.configRepository.getWorker();
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

  async createUser(dto: Insertable<Users> & { email: string }): Promise<UserEntity> {
    const user = await this.userRepository.getByEmail(dto.email);
    if (user) {
      throw new BadRequestException('User exists');
    }

    if (!dto.isAdmin) {
      const localAdmin = await this.userRepository.getAdmin();
      if (!localAdmin) {
        throw new BadRequestException('The first registered account must the administrator.');
      }
    }

    const payload: Insertable<Users> = { ...dto };
    if (payload.password) {
      payload.password = await this.cryptoRepository.hashBcrypt(payload.password, SALT_ROUNDS);
    }
    if (payload.storageLabel) {
      payload.storageLabel = sanitize(payload.storageLabel.replaceAll('.', ''));
    }

    return this.userRepository.create(payload);
  }
}
