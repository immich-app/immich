import { ICryptoRepository, IKeyRepository, IUserRepository } from '@app/domain';
import { databaseConfig, UserEntity } from '@app/infra';
import { Global, Module, Provider } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { cryptoRepository } from './auth/crypto.repository';
import { APIKeyEntity, UserRepository } from './db';
import { APIKeyRepository } from './db/repository';

const providers: Provider[] = [
  //
  { provide: ICryptoRepository, useValue: cryptoRepository },
  { provide: IKeyRepository, useClass: APIKeyRepository },
  { provide: IUserRepository, useClass: UserRepository },
];

@Global()
@Module({
  imports: [
    //
    TypeOrmModule.forRoot(databaseConfig),
    TypeOrmModule.forFeature([APIKeyEntity, UserEntity]),
  ],
  providers: [...providers],
  exports: [...providers],
})
export class InfraModule {}
