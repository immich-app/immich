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
import { QueueNameEnum } from '@app/job';
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
        name: QueueNameEnum.ASSET_UPLOADED,
        defaultJobOptions: {
          attempts: 3,
          removeOnComplete: true,
          removeOnFail: false,
        },
      },
      {
        name: QueueNameEnum.METADATA_EXTRACTION,
        defaultJobOptions: {
          attempts: 3,
          removeOnComplete: true,
          removeOnFail: false,
        },
      },
      {
        name: QueueNameEnum.VIDEO_CONVERSION,
        defaultJobOptions: {
          attempts: 3,
          removeOnComplete: true,
          removeOnFail: false,
        },
      },
      {
        name: QueueNameEnum.CHECKSUM_GENERATION,
        defaultJobOptions: {
          attempts: 3,
          removeOnComplete: true,
          removeOnFail: false,
        },
      },
      {
        name: QueueNameEnum.MACHINE_LEARNING,
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
