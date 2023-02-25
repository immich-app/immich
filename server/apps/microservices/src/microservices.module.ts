import { immichAppConfig } from '@app/common/config';
import { DomainModule } from '@app/domain';
import { ExifEntity, InfraModule } from '@app/infra';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  BackgroundTaskProcessor,
  MachineLearningProcessor,
  StorageTemplateMigrationProcessor,
  ThumbnailGeneratorProcessor,
} from './processors';
import { MetadataExtractionProcessor } from './processors/metadata-extraction.processor';
import { VideoTranscodeProcessor } from './processors/video-transcode.processor';

@Module({
  imports: [
    ConfigModule.forRoot(immichAppConfig),
    DomainModule.register({ imports: [InfraModule] }),
    TypeOrmModule.forFeature([ExifEntity]),
  ],
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
