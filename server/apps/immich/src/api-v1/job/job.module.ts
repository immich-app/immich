import { Module } from '@nestjs/common';
import { JobService } from './job.service';
import { JobController } from './job.controller';
import { ImmichJwtModule } from '../../modules/immich-jwt/immich-jwt.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExifEntity } from '@app/infra';
import { TagModule } from '../tag/tag.module';
import { AssetModule } from '../asset/asset.module';

import { StorageModule } from '@app/storage';
import { BullModule } from '@nestjs/bull';
import { immichSharedQueues } from '@app/job/constants/bull-queue-registration.constant';

@Module({
  imports: [
    TypeOrmModule.forFeature([ExifEntity]),
    ImmichJwtModule,
    TagModule,
    AssetModule,
    StorageModule,
    BullModule.registerQueue(...immichSharedQueues),
  ],
  controllers: [JobController],
  providers: [JobService],
})
export class JobModule {}
