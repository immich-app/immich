import { Module } from '@nestjs/common';
import { JobService } from './job.service';
import { JobController } from './job.controller';
import { ImmichJwtModule } from '../../modules/immich-jwt/immich-jwt.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExifEntity } from '@app/infra';
import { TagModule } from '../tag/tag.module';
import { AssetModule } from '../asset/asset.module';
import { StorageModule } from '@app/storage';

@Module({
  imports: [TypeOrmModule.forFeature([ExifEntity]), ImmichJwtModule, TagModule, AssetModule, StorageModule],
  controllers: [JobController],
  providers: [JobService],
})
export class JobModule {}
