import {
  IAccessRepository,
  IAlbumRepository,
  IAssetRepository,
  IAuditRepository,
  ICommunicationRepository,
  ICryptoRepository,
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
  ISmartInfoRepository,
  IStorageRepository,
  ISystemConfigRepository,
  ITagRepository,
  IUserRepository,
  IUserTokenRepository,
  immichAppConfig,
} from '@app/domain';
import { BullModule } from '@nestjs/bullmq';
import { Global, Module, Provider } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './database.config';
import { databaseEntities } from './entities';
import { bullConfig, bullQueues } from './infra.config';
import {
  APIKeyRepository,
  AccessRepository,
  AlbumRepository,
  AssetRepository,
  AuditRepository,
  CommunicationRepository,
  CryptoRepository,
  FilesystemProvider,
  JobRepository,
  LibraryRepository,
  MachineLearningRepository,
  MediaRepository,
  MetadataRepository,
  MoveRepository,
  PartnerRepository,
  PersonRepository,
  ServerInfoRepository,
  SharedLinkRepository,
  SmartInfoRepository,
  SystemConfigRepository,
  TagRepository,
  TypesenseRepository,
  UserRepository,
  UserTokenRepository,
} from './repositories';

const providers: Provider[] = [
  { provide: IAccessRepository, useClass: AccessRepository },
  { provide: IAlbumRepository, useClass: AlbumRepository },
  { provide: IAssetRepository, useClass: AssetRepository },
  { provide: IAuditRepository, useClass: AuditRepository },
  { provide: ICommunicationRepository, useClass: CommunicationRepository },
  { provide: ICryptoRepository, useClass: CryptoRepository },
  { provide: IJobRepository, useClass: JobRepository },
  { provide: ILibraryRepository, useClass: LibraryRepository },
  { provide: IKeyRepository, useClass: APIKeyRepository },
  { provide: IMachineLearningRepository, useClass: MachineLearningRepository },
  { provide: IMetadataRepository, useClass: MetadataRepository },
  { provide: IMoveRepository, useClass: MoveRepository },
  { provide: IPartnerRepository, useClass: PartnerRepository },
  { provide: IPersonRepository, useClass: PersonRepository },
  { provide: ISearchRepository, useClass: TypesenseRepository },
  { provide: IServerInfoRepository, useClass: ServerInfoRepository },
  { provide: ISharedLinkRepository, useClass: SharedLinkRepository },
  { provide: ISmartInfoRepository, useClass: SmartInfoRepository },
  { provide: IStorageRepository, useClass: FilesystemProvider },
  { provide: ISystemConfigRepository, useClass: SystemConfigRepository },
  { provide: ITagRepository, useClass: TagRepository },
  { provide: IMediaRepository, useClass: MediaRepository },
  { provide: IUserRepository, useClass: UserRepository },
  { provide: IUserTokenRepository, useClass: UserTokenRepository },
];

const imports = [
  ConfigModule.forRoot(immichAppConfig),
  TypeOrmModule.forRoot(databaseConfig),
  TypeOrmModule.forFeature(databaseEntities),
];

const moduleExports = [...providers];

if (process.env.IMMICH_TEST_ENV !== 'true') {
  imports.push(BullModule.forRoot(bullConfig));
  imports.push(BullModule.registerQueue(...bullQueues));
  moduleExports.push(BullModule);
}

@Global()
@Module({
  imports,
  providers: [...providers],
  exports: moduleExports,
})
export class InfraModule {}
