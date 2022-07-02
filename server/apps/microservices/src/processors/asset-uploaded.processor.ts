import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { AssetEntity, AssetType } from '@app/database/entities/asset.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { IAssetUploadedJob, IExifExtractionProcessor, IVideoLengthExtractionProcessor } from '@app/job/index';
import {
  assetUploadedQueueName,
  metadataExtractionQueueName,
  thumbnailGeneratorQueueName,
  videoConversionQueue,
} from '@app/job/constants/queue-name.constant';
import {
  assetUploadedProcessorName,
  exifExtractionProcessorName,
  extractVideoLengthProcessorName,
  generateJPEGThumbnailProcessorName,
  mp4ConversionProcessorName,
} from '@app/job/constants/job-name.constant';

@Processor(assetUploadedQueueName)
export class AssetUploadedProcessor {
  constructor(
    @InjectQueue(thumbnailGeneratorQueueName)
    private thumbnailGeneratorQueue: Queue,

    @InjectQueue(metadataExtractionQueueName)
    private metadataExtractionQueue: Queue<IExifExtractionProcessor | IVideoLengthExtractionProcessor>,

    @InjectQueue(videoConversionQueue)
    private videoConversionQueue: Queue,

    @InjectRepository(AssetEntity)
    private assetRepository: Repository<AssetEntity>,
  ) {}

  /**
   * Post processing uploaded asset to perform the following function if missing
   * 1. Generate JPEG Thumbnail
   * 2. Generate Webp Thumbnail
   * 3. EXIF extractor
   * 4. Reverse Geocoding
   *
   * @param job asset-uploaded
   */
  @Process(assetUploadedProcessorName)
  async processUploadedVideo(job: Job<IAssetUploadedJob>) {
    const { asset, fileName, fileSize } = job.data;

    await this.thumbnailGeneratorQueue.add(generateJPEGThumbnailProcessorName, { asset }, { jobId: randomUUID() });

    // Video Conversion
    if (asset.type == AssetType.VIDEO) {
      await this.videoConversionQueue.add(mp4ConversionProcessorName, { asset }, { jobId: randomUUID() });
    } else {
      // Extract Metadata/Exif for Images - Currently the library cannot extract EXIF for video yet
      await this.metadataExtractionQueue.add(
        exifExtractionProcessorName,
        {
          asset,
          fileName,
          fileSize,
        },
        { jobId: randomUUID() },
      );
    }

    // Extract video duration if uploaded from the web
    if (asset.type == AssetType.VIDEO && asset.duration == '0:00:00.000000') {
      await this.metadataExtractionQueue.add(extractVideoLengthProcessorName, { asset }, { jobId: randomUUID() });
    }
  }
}
