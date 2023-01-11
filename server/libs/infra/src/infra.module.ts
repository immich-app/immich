import { UserEntity } from '@app/database';
import { IUserRepository } from '@app/domain';
import { Module, Provider } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRepository } from './repository';

const providers: Provider[] = [
  //
  { provide: IUserRepository, useClass: UserRepository },
];

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  providers: [...providers],
  exports: [...providers],
})
export class InfraModule {}
