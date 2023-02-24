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
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommunicationModule } from '../../immich/src/api-v1/communication/communication.module';
import { MachineLearningProcessor } from './processors/machine-learning.processor';
import { MetadataExtractionProcessor } from './processors/metadata-extraction.processor';
import { ThumbnailGeneratorProcessor } from './processors/thumbnail.processor';
import { VideoTranscodeProcessor } from './processors/video-transcode.processor';
import { DomainModule } from '@app/domain';
import { BackgroundTaskProcessor, StorageTemplateMigrationProcessor, TemplateMigrationProcessor } from './processors';

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
    CommunicationModule,
  ],
  controllers: [],
  providers: [
    ThumbnailGeneratorProcessor,
    MetadataExtractionProcessor,
    VideoTranscodeProcessor,
    MachineLearningProcessor,
    StorageTemplateMigrationProcessor,
    BackgroundTaskProcessor,
  ],
})
export class MicroservicesModule {}
