import { BullModule } from '@nestjs/bullmq';
import { Global, Module, Provider } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule, SchedulerRegistry } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OpenTelemetryModule } from 'nestjs-otel';
import { bullConfig, bullQueues, immichAppConfig } from 'src/config';
import { IAccessRepository } from 'src/domain/repositories/access.repository';
import { IActivityRepository } from 'src/domain/repositories/activity.repository';
import { IAlbumRepository } from 'src/domain/repositories/album.repository';
import { IKeyRepository } from 'src/domain/repositories/api-key.repository';
import { IAssetStackRepository } from 'src/domain/repositories/asset-stack.repository';
import { IAssetRepository } from 'src/domain/repositories/asset.repository';
import { IAuditRepository } from 'src/domain/repositories/audit.repository';
import { ICommunicationRepository } from 'src/domain/repositories/communication.repository';
import { ICryptoRepository } from 'src/domain/repositories/crypto.repository';
import { IDatabaseRepository } from 'src/domain/repositories/database.repository';
import { IJobRepository } from 'src/domain/repositories/job.repository';
import { ILibraryRepository } from 'src/domain/repositories/library.repository';
import { IMachineLearningRepository } from 'src/domain/repositories/machine-learning.repository';
import { IMediaRepository } from 'src/domain/repositories/media.repository';
import { IMetadataRepository } from 'src/domain/repositories/metadata.repository';
import { IMoveRepository } from 'src/domain/repositories/move.repository';
import { IPartnerRepository } from 'src/domain/repositories/partner.repository';
import { IPersonRepository } from 'src/domain/repositories/person.repository';
import { ISearchRepository } from 'src/domain/repositories/search.repository';
import { IServerInfoRepository } from 'src/domain/repositories/server-info.repository';
import { ISharedLinkRepository } from 'src/domain/repositories/shared-link.repository';
import { IStorageRepository } from 'src/domain/repositories/storage.repository';
import { ISystemConfigRepository } from 'src/domain/repositories/system-config.repository';
import { ISystemMetadataRepository } from 'src/domain/repositories/system-metadata.repository';
import { ITagRepository } from 'src/domain/repositories/tag.repository';
import { IUserTokenRepository } from 'src/domain/repositories/user-token.repository';
import { IUserRepository } from 'src/domain/repositories/user.repository';
import { databaseConfig } from 'src/infra/database.config';
import { databaseEntities } from 'src/infra/entities';
import { otelConfig } from 'src/infra/instrumentation';
import { AccessRepository } from 'src/infra/repositories/access.repository';
import { ActivityRepository } from 'src/infra/repositories/activity.repository';
import { AlbumRepository } from 'src/infra/repositories/album.repository';
import { ApiKeyRepository } from 'src/infra/repositories/api-key.repository';
import { AssetStackRepository } from 'src/infra/repositories/asset-stack.repository';
import { AssetRepository } from 'src/infra/repositories/asset.repository';
import { AuditRepository } from 'src/infra/repositories/audit.repository';
import { CommunicationRepository } from 'src/infra/repositories/communication.repository';
import { CryptoRepository } from 'src/infra/repositories/crypto.repository';
import { DatabaseRepository } from 'src/infra/repositories/database.repository';
import { FilesystemProvider } from 'src/infra/repositories/filesystem.provider';
import { JobRepository } from 'src/infra/repositories/job.repository';
import { LibraryRepository } from 'src/infra/repositories/library.repository';
import { MachineLearningRepository } from 'src/infra/repositories/machine-learning.repository';
import { MediaRepository } from 'src/infra/repositories/media.repository';
import { MetadataRepository } from 'src/infra/repositories/metadata.repository';
import { MoveRepository } from 'src/infra/repositories/move.repository';
import { PartnerRepository } from 'src/infra/repositories/partner.repository';
import { PersonRepository } from 'src/infra/repositories/person.repository';
import { SearchRepository } from 'src/infra/repositories/search.repository';
import { ServerInfoRepository } from 'src/infra/repositories/server-info.repository';
import { SharedLinkRepository } from 'src/infra/repositories/shared-link.repository';
import { SystemConfigRepository } from 'src/infra/repositories/system-config.repository';
import { SystemMetadataRepository } from 'src/infra/repositories/system-metadata.repository';
import { TagRepository } from 'src/infra/repositories/tag.repository';
import { UserTokenRepository } from 'src/infra/repositories/user-token.repository';
import { UserRepository } from 'src/infra/repositories/user.repository';

const providers: Provider[] = [
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
  SchedulerRegistry,
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
  providers: [...providers],
  exports: [...providers, BullModule],
})
export class InfraModule {}

@Global()
@Module({
  imports: [
    ConfigModule.forRoot(immichAppConfig),
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRoot(databaseConfig),
    TypeOrmModule.forFeature(databaseEntities),
    ScheduleModule,
  ],
  providers: [...providers],
  exports: [...providers],
})
export class InfraTestModule {}
