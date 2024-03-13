import {
  IAccessRepository,
  IActivityRepository,
  IAlbumRepository,
  IAssetRepository,
  IAssetStackRepository,
  IAuditRepository,
  ICommunicationRepository,
  ICryptoRepository,
  IDatabaseRepository,
  IJobRepository,
  IKeyRepository,
  ILibraryRepository,
  IMachineLearningRepository,
  IMediaRepository,
  IMetadataRepository,
  IMoveRepository,
  IPartnerRepository,
  IPersonRepository,
  ISearchRepository,
  IServerInfoRepository,
  ISharedLinkRepository,
  IStorageRepository,
  ISystemConfigRepository,
  ISystemMetadataRepository,
  ITagRepository,
  IUserRepository,
  IUserTokenRepository,
  immichAppConfig,
} from '@app/domain';
import { BullModule } from '@nestjs/bullmq';
import { Global, Module, Provider } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule, SchedulerRegistry } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OpenTelemetryModule } from 'nestjs-otel';
import { databaseConfig } from './database.config';
import { databaseEntities } from './entities';
import { bullConfig, bullQueues } from './infra.config';
import { otelConfig } from './instrumentation';
import {
  AccessRepository,
  ActivityRepository,
  AlbumRepository,
  ApiKeyRepository,
  AssetRepository,
  AssetStackRepository,
  AuditRepository,
  CommunicationRepository,
  CryptoRepository,
  DatabaseRepository,
  FilesystemProvider,
  JobRepository,
  LibraryRepository,
  MachineLearningRepository,
  MediaRepository,
  MetadataRepository,
  MoveRepository,
  PartnerRepository,
  PersonRepository,
  SearchRepository,
  ServerInfoRepository,
  SharedLinkRepository,
  SystemConfigRepository,
  SystemMetadataRepository,
  TagRepository,
  UserRepository,
  UserTokenRepository,
} from './repositories';

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
    TypeOrmModule.forRoot(databaseConfig),
    TypeOrmModule.forFeature(databaseEntities),
    ScheduleModule,
  ],
  providers: [...providers],
  exports: [...providers],
})
export class InfraTestModule {}
