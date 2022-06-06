import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from '../../../libs/database/src';
import { AssetEntity } from '../../../libs/database/src/entities/asset.entity';
import { ExifEntity } from '../../../libs/database/src/entities/exif.entity';
import { SmartInfoEntity } from '../../../libs/database/src/entities/smart-info.entity';
import { UserEntity } from '../../../libs/database/src/entities/user.entity';
import { MicroservicesService } from './microservices.service';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([UserEntity, ExifEntity, AssetEntity, SmartInfoEntity]),
    BullModule.forRootAsync({
      useFactory: async () => ({
        redis: {
          host: process.env.REDIS_HOSTNAME || 'immich_redis',
          port: 6379,
        },
      }),
    }),
    BullModule.registerQueue({
      name: 'thumbnail-queue',
      defaultJobOptions: {
        attempts: 3,
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),

  ],
  controllers: [],
  providers: [MicroservicesService],
})
export class MicroservicesModule { }
