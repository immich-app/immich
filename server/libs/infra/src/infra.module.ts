import {
  IAlbumRepository,
  IAssetRepository,
  ICommunicationRepository,
  ICryptoRepository,
  IDeviceInfoRepository,
  IJobRepository,
  IKeyRepository,
  IMachineLearningRepository,
  IMediaRepository,
  ISharedLinkRepository,
  ISmartInfoRepository,
  IStorageRepository,
  ISystemConfigRepository,
  IUserRepository,
  IUserTokenRepository,
  QueueName,
} from '@app/domain';
import { BullModule } from '@nestjs/bull';
import { Global, Module, Provider } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CryptoRepository } from './auth/crypto.repository';
import { CommunicationGateway, CommunicationRepository } from './communication';
import {
  AlbumEntity,
  AlbumRepository,
  APIKeyEntity,
  APIKeyRepository,
  AssetEntity,
  AssetRepository,
  databaseConfig,
  DeviceInfoEntity,
  DeviceInfoRepository,
  SharedLinkEntity,
  SharedLinkRepository,
  SmartInfoEntity,
  SmartInfoRepository,
  SystemConfigEntity,
  SystemConfigRepository,
  UserEntity,
  UserRepository,
  UserTokenEntity,
  UserTokenRepository,
} from './db';
import { JobRepository } from './job';
import { MachineLearningRepository } from './machine-learning';
import { MediaRepository } from './media';
import { FilesystemProvider } from './storage';

const providers: Provider[] = [
  { provide: IAlbumRepository, useClass: AlbumRepository },
  { provide: IAssetRepository, useClass: AssetRepository },
  { provide: ICommunicationRepository, useClass: CommunicationRepository },
  { provide: ICryptoRepository, useClass: CryptoRepository },
  { provide: ICryptoRepository, useClass: CryptoRepository },
  { provide: IDeviceInfoRepository, useClass: DeviceInfoRepository },
  { provide: IKeyRepository, useClass: APIKeyRepository },
  { provide: IJobRepository, useClass: JobRepository },
  { provide: IMachineLearningRepository, useClass: MachineLearningRepository },
  { provide: IMediaRepository, useClass: MediaRepository },
  { provide: ISharedLinkRepository, useClass: SharedLinkRepository },
  { provide: ISmartInfoRepository, useClass: SmartInfoRepository },
  { provide: IStorageRepository, useClass: FilesystemProvider },
  { provide: ISystemConfigRepository, useClass: SystemConfigRepository },
  { provide: IUserRepository, useClass: UserRepository },
  { provide: IUserTokenRepository, useClass: UserTokenRepository },
];

@Global()
@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    TypeOrmModule.forFeature([
      AssetEntity,
      AlbumEntity,
      APIKeyEntity,
      DeviceInfoEntity,
      UserEntity,
      SharedLinkEntity,
      SmartInfoEntity,
      SystemConfigEntity,
      UserTokenEntity,
    ]),
    BullModule.forRootAsync({
      useFactory: async () => ({
        prefix: 'immich_bull',
        redis: {
          host: process.env.REDIS_HOSTNAME || 'immich_redis',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          db: parseInt(process.env.REDIS_DBINDEX || '0'),
          password: process.env.REDIS_PASSWORD || undefined,
          path: process.env.REDIS_SOCKET || undefined,
        },
        defaultJobOptions: {
          attempts: 3,
          removeOnComplete: true,
          removeOnFail: false,
        },
      }),
    }),
    BullModule.registerQueue(...Object.values(QueueName).map((name) => ({ name }))),
  ],
  providers: [...providers, CommunicationGateway],
  exports: [...providers, BullModule],
})
export class InfraModule {}
