import {
  ICryptoRepository,
  IJobRepository,
  IKeyRepository,
  ISystemConfigRepository,
  IUserRepository,
  QueueName,
} from '@app/domain';
import { databaseConfig, UserEntity } from '@app/infra';
import { BullModule } from '@nestjs/bull';
import { Global, Module, Provider } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { cryptoRepository } from './auth/crypto.repository';
import { APIKeyEntity, SystemConfigEntity, UserRepository } from './db';
import { APIKeyRepository } from './db/repository';
import { SystemConfigRepository } from './db/repository/system-config.repository';
import { JobRepository } from './job';

const providers: Provider[] = [
  //
  { provide: ICryptoRepository, useValue: cryptoRepository },
  { provide: IKeyRepository, useClass: APIKeyRepository },
  { provide: IJobRepository, useClass: JobRepository },
  { provide: ISystemConfigRepository, useClass: SystemConfigRepository },
  { provide: IUserRepository, useClass: UserRepository },
];

@Global()
@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    TypeOrmModule.forFeature([APIKeyEntity, UserEntity, SystemConfigEntity]),
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
  exports: [...providers, BullModule],
})
export class InfraModule {}
