import { databaseConfig, UserEntity } from '@app/infra';
import { IUserRepository } from '@app/domain';
import { Global, Module, Provider } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRepository } from './db';

const providers: Provider[] = [
  //
  { provide: IUserRepository, useClass: UserRepository },
];

@Global()
@Module({
  imports: [
    //
    TypeOrmModule.forRoot(databaseConfig),
    TypeOrmModule.forFeature([UserEntity]),
  ],
  providers: [...providers],
  exports: [...providers],
})
export class InfraModule {}
