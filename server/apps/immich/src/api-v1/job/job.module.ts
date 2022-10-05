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
  assetUploadedQueueName,
  metadataExtractionQueueName,
  videoConversionQueueName,
  generateChecksumQueueName,
  QueueNameEnum,
} from '@app/job';
import { AssetEntity } from '@app/database/entities/asset.entity';
import { ExifEntity } from '@app/database/entities/exif.entity';
import { AssetRepository, ASSET_REPOSITORY } from '../asset/asset-repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, AssetEntity, ExifEntity]),
    ImmichJwtModule,
    JwtModule.register(jwtConfig),
    BullModule.registerQueue(
      {
        name: QueueNameEnum.THUMBNAIL_GENERATION,
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
  providers: [
    JobService,
    ImmichJwtService,
    {
      provide: ASSET_REPOSITORY,
      useClass: AssetRepository,
    },
  ],
})
export class JobModule {}
