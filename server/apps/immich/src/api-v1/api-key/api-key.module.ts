import { APIKeyEntity } from '@app/infra';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APIKeyController } from './api-key.controller';
import { APIKeyRepository, IKeyRepository } from './api-key.repository';
import { APIKeyService } from './api-key.service';

const KEY_REPOSITORY = { provide: IKeyRepository, useClass: APIKeyRepository };

@Module({
  imports: [TypeOrmModule.forFeature([APIKeyEntity])],
  controllers: [APIKeyController],
  providers: [APIKeyService, KEY_REPOSITORY],
  exports: [APIKeyService, KEY_REPOSITORY],
})
export class APIKeyModule {}
