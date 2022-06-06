import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ThumbnailProcessor } from './thumbnail-generation.processor';

@Module({
  imports: [
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
  providers: [ThumbnailProcessor],
})
export class AppModule { }
