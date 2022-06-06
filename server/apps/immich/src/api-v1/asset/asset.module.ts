import { Module } from '@nestjs/common';
import { AssetService } from './asset.service';
import { AssetController } from './asset.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetEntity } from './entities/asset.entity';
import { BullModule } from '@nestjs/bull';
import { BackgroundTaskModule } from '../../modules/background-task/background-task.module';
import { BackgroundTaskService } from '../../modules/background-task/background-task.service';
import { CommunicationModule } from '../communication/communication.module';

@Module({
  imports: [
    CommunicationModule,
    BackgroundTaskModule,
    TypeOrmModule.forFeature([AssetEntity]),
  ],
  controllers: [AssetController],
  providers: [AssetService, BackgroundTaskService],
  exports: [],
})
export class AssetModule { }
