import { UserEntity } from '@app/database';
import { IUserRepository } from '@app/domain';
import { Global, Module, Provider } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRepository } from './repository';

const providers: Provider[] = [
  //
  { provide: IUserRepository, useClass: UserRepository },
];

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  providers: [...providers],
  exports: [...providers],
})
export class InfraModule {}
