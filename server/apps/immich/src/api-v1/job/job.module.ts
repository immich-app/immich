import { Module } from '@nestjs/common';
import { JobService } from './job.service';
import { JobController } from './job.controller';
import { ImmichJwtService } from '../../modules/immich-jwt/immich-jwt.service';
import { ImmichJwtModule } from '../../modules/immich-jwt/immich-jwt.module';
import { JwtModule } from '@nestjs/jwt';
import { jwtConfig } from '../../config/jwt.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExifEntity } from '@app/database/entities/exif.entity';
import { TagModule } from '../tag/tag.module';
import { AssetModule } from '../asset/asset.module';
import { UserModule } from '../user/user.module';

import { StorageModule } from '@app/storage';
import { ImmichDefaultJobOptions, QueueNameEnum } from '@app/job';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    TypeOrmModule.forFeature([ExifEntity]),
    ImmichJwtModule,
    TagModule,
    AssetModule,
    UserModule,
    JwtModule.register(jwtConfig),
    StorageModule,
    BullModule.registerQueue(
      {
        name: QueueNameEnum.USER_DELETION,
        defaultJobOptions: ImmichDefaultJobOptions,
      },
      {
        name: QueueNameEnum.THUMBNAIL_GENERATION,
        defaultJobOptions: ImmichDefaultJobOptions,
      },
      {
        name: QueueNameEnum.ASSET_UPLOADED,
        defaultJobOptions: ImmichDefaultJobOptions,
      },
      {
        name: QueueNameEnum.METADATA_EXTRACTION,
        defaultJobOptions: ImmichDefaultJobOptions,
      },
      {
        name: QueueNameEnum.VIDEO_CONVERSION,
        defaultJobOptions: ImmichDefaultJobOptions,
      },
      {
        name: QueueNameEnum.CHECKSUM_GENERATION,
        defaultJobOptions: ImmichDefaultJobOptions,
      },
      {
        name: QueueNameEnum.MACHINE_LEARNING,
        defaultJobOptions: ImmichDefaultJobOptions,
      },
      {
        name: QueueNameEnum.STORAGE_MIGRATION,
        defaultJobOptions: ImmichDefaultJobOptions,
      },
    ),
  ],
  controllers: [JobController],
  providers: [JobService, ImmichJwtService],
})
export class JobModule {}
