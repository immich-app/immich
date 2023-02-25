import { immichAppConfig } from '@app/common/config';
import { DomainModule } from '@app/domain';
import { ExifEntity, InfraModule } from '@app/infra';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommunicationModule } from '../../immich/src/api-v1/communication/communication.module';
import { BackgroundTaskProcessor, MachineLearningProcessor, StorageTemplateMigrationProcessor } from './processors';
import { MetadataExtractionProcessor } from './processors/metadata-extraction.processor';
import { ThumbnailGeneratorProcessor } from './processors/thumbnail.processor';
import { VideoTranscodeProcessor } from './processors/video-transcode.processor';

@Module({
  imports: [
    ConfigModule.forRoot(immichAppConfig),
    DomainModule.register({ imports: [InfraModule] }),
    TypeOrmModule.forFeature([ExifEntity]),
    CommunicationModule,
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
