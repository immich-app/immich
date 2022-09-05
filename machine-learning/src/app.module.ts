import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { databaseConfig, immichAppConfig } from './config';
import { imageClassificationQueueName, objectDetectionQueueName } from './constants/queue-name.constant';
import { ImageClassificationProcessor } from './processors/image-classification.processor';

@Module({
  imports: [
    ConfigModule.forRoot(immichAppConfig),
    TypeOrmModule.forRoot(databaseConfig),
    BullModule.forRootAsync({
      useFactory: async () => ({
        prefix: 'immich_bull',
        redis: {
          host: process.env.REDIS_HOSTNAME || 'immich_redis',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          db: parseInt(process.env.REDIS_DBINDEX || '0'),
          password: process.env.REDIS_PASSWORD || undefined,
          path: process.env.REDIS_SOCKET || undefined,
        },
      }),
      imports: [],
    }),
    BullModule.registerQueue({
      name: imageClassificationQueueName,
      defaultJobOptions: {
        attempts: 3,
        removeOnComplete: true,
        removeOnFail: false,
      },
    }, {
      name: objectDetectionQueueName,
      defaultJobOptions: {
        attempts: 3,
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
  ],
  controllers: [AppController],
  providers: [ImageClassificationProcessor],
})
export class AppModule {}
