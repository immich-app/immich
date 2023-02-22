import { AssetEntity } from '@app/infra';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageService } from './storage.service';

@Module({
  imports: [TypeOrmModule.forFeature([AssetEntity])],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
