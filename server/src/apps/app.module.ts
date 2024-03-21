import { BullModule } from '@nestjs/bullmq';
import { Global, Module, Provider } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule, SchedulerRegistry } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OpenTelemetryModule } from 'nestjs-otel';
import { bullConfig, bullQueues, immichAppConfig } from 'src/config';
import { databaseConfig } from 'src/database.config';
import { databaseEntities } from 'src/entities';
import { IAccessRepository } from 'src/interfaces/access.interface';
import { IActivityRepository } from 'src/interfaces/activity.interface';
import { IAlbumRepository } from 'src/interfaces/album.interface';
import { IKeyRepository } from 'src/interfaces/api-key.interface';
import { IAssetStackRepository } from 'src/interfaces/asset-stack.interface';
import { IAssetRepository } from 'src/interfaces/asset.interface';
import { IAuditRepository } from 'src/interfaces/audit.interface';
import { ICommunicationRepository } from 'src/interfaces/communication.interface';
import { ICryptoRepository } from 'src/interfaces/crypto.interface';
import { IDatabaseRepository } from 'src/interfaces/database.interface';
import { IJobRepository } from 'src/interfaces/job.interface';
import { ILibraryRepository } from 'src/interfaces/library.interface';
import { IMachineLearningRepository } from 'src/interfaces/machine-learning.interface';
import { IMediaRepository } from 'src/interfaces/media.interface';
import { IMetadataRepository } from 'src/interfaces/metadata.interface';
import { IMoveRepository } from 'src/interfaces/move.interface';
import { IPartnerRepository } from 'src/interfaces/partner.interface';
import { IPersonRepository } from 'src/interfaces/person.interface';
import { ISearchRepository } from 'src/interfaces/search.interface';
import { IServerInfoRepository } from 'src/interfaces/server-info.interface';
import { ISharedLinkRepository } from 'src/interfaces/shared-link.interface';
import { IStorageRepository } from 'src/interfaces/storage.interface';
import { ISystemConfigRepository } from 'src/interfaces/system-config.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { ITagRepository } from 'src/interfaces/tag.interface';
import { IUserTokenRepository } from 'src/interfaces/user-token.interface';
import { IUserRepository } from 'src/interfaces/user.interface';
import { AccessRepository } from 'src/repositories/access.repository';
import { ActivityRepository } from 'src/repositories/activity.repository';
import { AlbumRepository } from 'src/repositories/album.repository';
import { ApiKeyRepository } from 'src/repositories/api-key.repository';
import { AssetStackRepository } from 'src/repositories/asset-stack.repository';
import { AssetRepository } from 'src/repositories/asset.repository';
import { AuditRepository } from 'src/repositories/audit.repository';
import { CommunicationRepository } from 'src/repositories/communication.repository';
import { CryptoRepository } from 'src/repositories/crypto.repository';
import { DatabaseRepository } from 'src/repositories/database.repository';
import { FilesystemProvider } from 'src/repositories/filesystem.provider';
import { JobRepository } from 'src/repositories/job.repository';
import { LibraryRepository } from 'src/repositories/library.repository';
import { MachineLearningRepository } from 'src/repositories/machine-learning.repository';
import { MediaRepository } from 'src/repositories/media.repository';
import { MetadataRepository } from 'src/repositories/metadata.repository';
import { MoveRepository } from 'src/repositories/move.repository';
import { PartnerRepository } from 'src/repositories/partner.repository';
import { PersonRepository } from 'src/repositories/person.repository';
import { SearchRepository } from 'src/repositories/search.repository';
import { ServerInfoRepository } from 'src/repositories/server-info.repository';
import { SharedLinkRepository } from 'src/repositories/shared-link.repository';
import { SystemConfigRepository } from 'src/repositories/system-config.repository';
import { SystemMetadataRepository } from 'src/repositories/system-metadata.repository';
import { TagRepository } from 'src/repositories/tag.repository';
import { UserTokenRepository } from 'src/repositories/user-token.repository';
import { UserRepository } from 'src/repositories/user.repository';
import { ActivityService } from 'src/services/activity.service';
import { AlbumService } from 'src/services/album.service';
import { APIKeyService } from 'src/services/api-key.service';
import { AssetService } from 'src/services/asset.service';
import { AuditService } from 'src/services/audit.service';
import { AuthService } from 'src/services/auth.service';
import { DatabaseService } from 'src/services/database.service';
import { DownloadService } from 'src/services/download.service';
import { JobService } from 'src/services/job.service';
import { LibraryService } from 'src/services/library.service';
import { MediaService } from 'src/services/media.service';
import { MetadataService } from 'src/services/metadata.service';
import { PartnerService } from 'src/services/partner.service';
import { PersonService } from 'src/services/person.service';
import { SearchService } from 'src/services/search.service';
import { ServerInfoService } from 'src/services/server-info.service';
import { SharedLinkService } from 'src/services/shared-link.service';
import { SmartInfoService } from 'src/services/smart-info.service';
import { StorageTemplateService } from 'src/services/storage-template.service';
import { StorageService } from 'src/services/storage.service';
import { SystemConfigService } from 'src/services/system-config.service';
import { TagService } from 'src/services/tag.service';
import { TrashService } from 'src/services/trash.service';
import { UserService } from 'src/services/user.service';
import { otelConfig } from 'src/utils/instrumentation';
import { ImmichLogger } from 'src/utils/logger';

const services: Provider[] = [
  APIKeyService,
  ActivityService,
  AlbumService,
  AssetService,
  AuditService,
  AuthService,
  DatabaseService,
  DownloadService,
  ImmichLogger,
  JobService,
  LibraryService,
  MediaService,
  MetadataService,
  PartnerService,
  PersonService,
  SearchService,
  ServerInfoService,
  SharedLinkService,
  SmartInfoService,
  StorageService,
  StorageTemplateService,
  SystemConfigService,
  TagService,
  TrashService,
  UserService,
];

const repositories: Provider[] = [
  { provide: IActivityRepository, useClass: ActivityRepository },
  { provide: IAccessRepository, useClass: AccessRepository },
  { provide: IAlbumRepository, useClass: AlbumRepository },
  { provide: IAssetRepository, useClass: AssetRepository },
  { provide: IAssetStackRepository, useClass: AssetStackRepository },
  { provide: IAuditRepository, useClass: AuditRepository },
  { provide: ICommunicationRepository, useClass: CommunicationRepository },
  { provide: ICryptoRepository, useClass: CryptoRepository },
  { provide: IDatabaseRepository, useClass: DatabaseRepository },
  { provide: IJobRepository, useClass: JobRepository },
  { provide: ILibraryRepository, useClass: LibraryRepository },
  { provide: IKeyRepository, useClass: ApiKeyRepository },
  { provide: IMachineLearningRepository, useClass: MachineLearningRepository },
  { provide: IMetadataRepository, useClass: MetadataRepository },
  { provide: IMoveRepository, useClass: MoveRepository },
  { provide: IPartnerRepository, useClass: PartnerRepository },
  { provide: IPersonRepository, useClass: PersonRepository },
  { provide: IServerInfoRepository, useClass: ServerInfoRepository },
  { provide: ISharedLinkRepository, useClass: SharedLinkRepository },
  { provide: ISearchRepository, useClass: SearchRepository },
  { provide: IStorageRepository, useClass: FilesystemProvider },
  { provide: ISystemConfigRepository, useClass: SystemConfigRepository },
  { provide: ISystemMetadataRepository, useClass: SystemMetadataRepository },
  { provide: ITagRepository, useClass: TagRepository },
  { provide: IMediaRepository, useClass: MediaRepository },
  { provide: IUserRepository, useClass: UserRepository },
  { provide: IUserTokenRepository, useClass: UserTokenRepository },
];

@Global()
@Module({
  imports: [
    ConfigModule.forRoot(immichAppConfig),
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRoot(databaseConfig),
    TypeOrmModule.forFeature(databaseEntities),
    ScheduleModule,
    BullModule.forRoot(bullConfig),
    BullModule.registerQueue(...bullQueues),
    OpenTelemetryModule.forRoot(otelConfig),
  ],
  providers: [...services, ...repositories, SchedulerRegistry],
  exports: [...services, ...repositories, BullModule, SchedulerRegistry],
})
export class AppModule {}

@Global()
@Module({
  imports: [
    ConfigModule.forRoot(immichAppConfig),
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRoot(databaseConfig),
    TypeOrmModule.forFeature(databaseEntities),
    ScheduleModule,
  ],
  providers: [...services, ...repositories, SchedulerRegistry],
  exports: [...services, ...repositories, SchedulerRegistry],
})
export class AppTestModule {}
