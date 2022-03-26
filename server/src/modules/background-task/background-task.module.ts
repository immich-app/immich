import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetEntity } from '../../api-v1/asset/entities/asset.entity';
import { ExifEntity } from '../../api-v1/asset/entities/exif.entity';
import { SmartInfoEntity } from '../../api-v1/asset/entities/smart-info.entity';
import { BackgroundTaskProcessor } from './background-task.processor';
import { BackgroundTaskService } from './background-task.service';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'background-task',
      defaultJobOptions: {
        attempts: 3,
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
    TypeOrmModule.forFeature([AssetEntity, ExifEntity, SmartInfoEntity]),
  ],
  providers: [
    BackgroundTaskService,
    BackgroundTaskProcessor,
    {
      provide: 'MICROSERVICES',
      useFactory: () =>
        ClientProxyFactory.create({
          transport: Transport.TCP,
          options: {
            host: 'immich_microservices',
            port: 2286,
          },
        }),
    },
  ],
  exports: [BackgroundTaskService],
})
export class BackgroundTaskModule {}
