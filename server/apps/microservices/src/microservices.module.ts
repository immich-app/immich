import { immichAppConfig, immichBullAsyncConfig } from '@app/common/config';
import { AssetEntity, ExifEntity, SmartInfoEntity, UserEntity, APIKeyEntity, InfraModule } from '@app/infra';
import { StorageModule } from '@app/storage';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImmichConfigModule } from 'libs/immich-config/src';
import { CommunicationModule } from '../../immich/src/api-v1/communication/communication.module';
import { MicroservicesService } from './microservices.service';
import { AssetUploadedProcessor } from './processors/asset-uploaded.processor';
import { GenerateChecksumProcessor } from './processors/generate-checksum.processor';
import { MachineLearningProcessor } from './processors/machine-learning.processor';
import { MetadataExtractionProcessor } from './processors/metadata-extraction.processor';
import { StorageMigrationProcessor } from './processors/storage-migration.processor';
import { ThumbnailGeneratorProcessor } from './processors/thumbnail.processor';
import { UserDeletionProcessor } from './processors/user-deletion.processor';
import { VideoTranscodeProcessor } from './processors/video-transcode.processor';
import { immichSharedQueues } from '@app/job/constants/bull-queue-registration.constant';
import { DomainModule } from '@app/domain';

@Module({
  imports: [
    ConfigModule.forRoot(immichAppConfig),
    DomainModule.register({
      imports: [InfraModule],
    }),
    ImmichConfigModule,
    TypeOrmModule.forFeature([UserEntity, ExifEntity, AssetEntity, SmartInfoEntity, APIKeyEntity]),
    StorageModule,
    BullModule.forRootAsync(immichBullAsyncConfig),
    BullModule.registerQueue(...immichSharedQueues),
    CommunicationModule,
  ],
  controllers: [],
  providers: [
    MicroservicesService,
    AssetUploadedProcessor,
    ThumbnailGeneratorProcessor,
    MetadataExtractionProcessor,
    VideoTranscodeProcessor,
    GenerateChecksumProcessor,
    MachineLearningProcessor,
    UserDeletionProcessor,
    StorageMigrationProcessor,
  ],
  exports: [BullModule],
})
export class MicroservicesModule {}
