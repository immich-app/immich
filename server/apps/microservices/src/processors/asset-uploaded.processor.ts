import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { AssetType } from '@app/database/entities/asset.entity';
import { randomUUID } from 'crypto';
import {
  IAssetUploadedJob,
  IMetadataExtractionJob,
  IThumbnailGenerationJob,
  IVideoTranscodeJob,
  assetUploadedQueueName,
  metadataExtractionQueueName,
  thumbnailGeneratorQueueName,
  videoConversionQueueName,
  assetUploadedProcessorName,
  exifExtractionProcessorName,
  generateJPEGThumbnailProcessorName,
  mp4ConversionProcessorName,
  videoMetadataExtractionProcessorName,
} from '@app/job';

@Processor(assetUploadedQueueName)
export class AssetUploadedProcessor {
  constructor(
    @InjectQueue(thumbnailGeneratorQueueName)
    private thumbnailGeneratorQueue: Queue<IThumbnailGenerationJob>,

    @InjectQueue(metadataExtractionQueueName)
    private metadataExtractionQueue: Queue<IMetadataExtractionJob>,

    @InjectQueue(videoConversionQueueName)
    private videoConversionQueue: Queue<IVideoTranscodeJob>,
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
      // Extract Metadata/Exif for Images - Currently the EXIF library on the web cannot extract EXIF for video yet
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

    // Extract video duration if uploaded from the web & CLI
    if (asset.type == AssetType.VIDEO) {
      await this.metadataExtractionQueue.add(videoMetadataExtractionProcessorName, { asset }, { jobId: randomUUID() });
    }
  }
}
