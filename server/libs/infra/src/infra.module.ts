import {
  ICryptoRepository,
  IJobRepository,
  IKeyRepository,
  ISharedLinkRepository,
  ISystemConfigRepository,
  IUserRepository,
  QueueName,
} from '@app/domain';
import { databaseConfig, UserEntity } from './db';
import { BullModule } from '@nestjs/bull';
import { Global, Module, Provider } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APIKeyEntity, SharedLinkEntity, SystemConfigEntity, UserRepository } from './db';
import { APIKeyRepository, SharedLinkRepository } from './db/repository';
import { jwtConfig } from '@app/domain';
import { CryptoRepository } from './auth/crypto.repository';
import { SystemConfigRepository } from './db/repository/system-config.repository';
import { JobRepository } from './job';

const providers: Provider[] = [
  { provide: ICryptoRepository, useClass: CryptoRepository },
  { provide: IKeyRepository, useClass: APIKeyRepository },
  { provide: IJobRepository, useClass: JobRepository },
  { provide: ISharedLinkRepository, useClass: SharedLinkRepository },
  { provide: ISystemConfigRepository, useClass: SystemConfigRepository },
  { provide: IUserRepository, useClass: UserRepository },
];

@Global()
@Module({
  imports: [
    JwtModule.register(jwtConfig),
    TypeOrmModule.forRoot(databaseConfig),
    TypeOrmModule.forFeature([APIKeyEntity, UserEntity, SharedLinkEntity, SystemConfigEntity]),
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
    BullModule.registerQueue(
      { name: QueueName.USER_DELETION },
      { name: QueueName.THUMBNAIL_GENERATION },
      { name: QueueName.ASSET_UPLOADED },
      { name: QueueName.METADATA_EXTRACTION },
      { name: QueueName.VIDEO_CONVERSION },
      { name: QueueName.CHECKSUM_GENERATION },
      { name: QueueName.MACHINE_LEARNING },
      { name: QueueName.CONFIG },
      { name: QueueName.BACKGROUND_TASK },
    ),
  ],
  providers: [...providers],
  exports: [...providers, BullModule, JwtModule],
})
export class InfraModule {}
