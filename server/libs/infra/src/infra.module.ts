import {
  DomainModule,
  ICryptoRepository,
  IJobRepository,
  IKeyRepository,
  ISharedLinkRepository,
  ISystemConfigRepository,
  IUserRepository,
} from '@app/domain';
import { IUserTokenRepository } from '@app/domain/user-token';
import { UserTokenRepository } from '@app/infra/db/repository/user-token.repository';
import { BullModule } from '@nestjs/bull';
import { Global, Module, Provider } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CryptoRepository } from './auth/crypto.repository';
import {
  APIKeyEntity,
  APIKeyRepository,
  SharedLinkEntity,
  SharedLinkRepository,
  SystemConfigEntity,
  SystemConfigRepository,
  UserEntity,
  UserRepository,
  UserTokenEntity,
} from './db';
import { bullConfig, bullQueues, databaseConfig, immichAppConfig } from './infra.config';
import { JobRepository } from './job';

const providers: Provider[] = [
  { provide: ICryptoRepository, useClass: CryptoRepository },
  { provide: IKeyRepository, useClass: APIKeyRepository },
  { provide: IJobRepository, useClass: JobRepository },
  { provide: ISharedLinkRepository, useClass: SharedLinkRepository },
  { provide: ISystemConfigRepository, useClass: SystemConfigRepository },
  { provide: IUserRepository, useClass: UserRepository },
  { provide: IUserTokenRepository, useClass: UserTokenRepository },
];

@Module({
  imports: [
    TypeOrmModule.forFeature([APIKeyEntity, UserEntity, SharedLinkEntity, SystemConfigEntity, UserTokenEntity]),
  ],
  providers: [...providers],
  exports: [...providers],
})
class InfraRepositoryModule {}

@Global()
@Module({
  imports: [
    InfraRepositoryModule,
    DomainModule.register({ imports: [InfraRepositoryModule] }),

    ConfigModule.forRoot(immichAppConfig),

    TypeOrmModule.forRoot(databaseConfig),

    BullModule.forRoot(bullConfig),
    BullModule.registerQueue(...bullQueues),
  ],
  exports: [
    // TODO: remove this import once no services (outside of domain) depend on these providers
    InfraRepositoryModule,
    DomainModule,
    BullModule,
  ],
})
export class InfraModule {}
