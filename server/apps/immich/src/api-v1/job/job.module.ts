import { Module } from '@nestjs/common';
import { JobService } from './job.service';
import { JobController } from './job.controller';
import { ImmichJwtService } from '../../modules/immich-jwt/immich-jwt.service';
import { ImmichJwtModule } from '../../modules/immich-jwt/immich-jwt.module';
import { JwtModule } from '@nestjs/jwt';
import { jwtConfig } from '../../config/jwt.config';
import { UserEntity } from '@app/database/entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import {
  thumbnailGeneratorQueueName,
  assetUploadedQueueName,
  metadataExtractionQueueName,
  videoConversionQueueName,
  generateChecksumQueueName,
} from '@app/job';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    ImmichJwtModule,
    JwtModule.register(jwtConfig),
    BullModule.registerQueue(
      {
        name: thumbnailGeneratorQueueName,
        defaultJobOptions: {
          attempts: 3,
          removeOnComplete: true,
          removeOnFail: false,
        },
      },
      {
        name: assetUploadedQueueName,
        defaultJobOptions: {
          attempts: 3,
          removeOnComplete: true,
          removeOnFail: false,
        },
      },
      {
        name: metadataExtractionQueueName,
        defaultJobOptions: {
          attempts: 3,
          removeOnComplete: true,
          removeOnFail: false,
        },
      },
      {
        name: videoConversionQueueName,
        defaultJobOptions: {
          attempts: 3,
          removeOnComplete: true,
          removeOnFail: false,
        },
      },
      {
        name: generateChecksumQueueName,
        defaultJobOptions: {
          attempts: 3,
          removeOnComplete: true,
          removeOnFail: false,
        },
      },
    ),
  ],
  controllers: [JobController],
  providers: [JobService, ImmichJwtService],
})
export class JobModule {}
