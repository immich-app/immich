import { immichAppConfig } from '@app/common/config';
import {
  AssetEntity,
  ExifEntity,
  SmartInfoEntity,
  UserEntity,
  APIKeyEntity,
  InfraModule,
  UserTokenEntity,
  AlbumEntity,
} from '@app/infra';
import { StorageModule } from '@app/storage';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommunicationModule } from '../../immich/src/api-v1/communication/communication.module';
import { MachineLearningProcessor } from './processors/machine-learning.processor';
import { MetadataExtractionProcessor } from './processors/metadata-extraction.processor';
import { StorageMigrationProcessor } from './processors/storage-migration.processor';
import { ThumbnailGeneratorProcessor } from './processors/thumbnail.processor';
import { VideoTranscodeProcessor } from './processors/video-transcode.processor';
import { DomainModule } from '@app/domain';
import { AssetUploadedProcessor, BackgroundTaskProcessor, UserDeletionProcessor } from './processors';

@Module({
  imports: [
    ConfigModule.forRoot(immichAppConfig),
    DomainModule.register({
      imports: [InfraModule],
    }),
    TypeOrmModule.forFeature([
      UserEntity,
      ExifEntity,
      AssetEntity,
      SmartInfoEntity,
      APIKeyEntity,
      UserTokenEntity,
      AlbumEntity,
    ]),
    StorageModule,
    CommunicationModule,
  ],
  controllers: [],
  providers: [
    AssetUploadedProcessor,
    ThumbnailGeneratorProcessor,
    MetadataExtractionProcessor,
    VideoTranscodeProcessor,
    MachineLearningProcessor,
    UserDeletionProcessor,
    StorageMigrationProcessor,
    BackgroundTaskProcessor,
  ],
})
export class MicroservicesModule {}
