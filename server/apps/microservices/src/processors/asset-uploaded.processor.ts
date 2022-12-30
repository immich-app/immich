import { AssetType } from '@app/database';
import {
  IAssetUploadedJob,
  IMetadataExtractionJob,
  IThumbnailGenerationJob,
  IVideoTranscodeJob,
  assetUploadedProcessorName,
  exifExtractionProcessorName,
  generateJPEGThumbnailProcessorName,
  mp4ConversionProcessorName,
  videoMetadataExtractionProcessorName,
  QueueNameEnum,
} from '@app/job';
import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { randomUUID } from 'crypto';

@Processor(QueueNameEnum.ASSET_UPLOADED)
export class AssetUploadedProcessor {
  constructor(
    @InjectQueue(QueueNameEnum.THUMBNAIL_GENERATION)
    private thumbnailGeneratorQueue: Queue<IThumbnailGenerationJob>,

    @InjectQueue(QueueNameEnum.METADATA_EXTRACTION)
    private metadataExtractionQueue: Queue<IMetadataExtractionJob>,

    @InjectQueue(QueueNameEnum.VIDEO_CONVERSION)
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
    const { asset, fileName } = job.data;

    await this.thumbnailGeneratorQueue.add(generateJPEGThumbnailProcessorName, { asset }, { jobId: randomUUID() });

    // Video Conversion
    if (asset.type == AssetType.VIDEO) {
      await this.videoConversionQueue.add(mp4ConversionProcessorName, { asset }, { jobId: randomUUID() });
      await this.metadataExtractionQueue.add(
        videoMetadataExtractionProcessorName,
        { asset, fileName },
        { jobId: randomUUID() },
      );
    } else {
      // Extract Metadata/Exif for Images - Currently the EXIF library on the web cannot extract EXIF for video yet
      await this.metadataExtractionQueue.add(
        exifExtractionProcessorName,
        {
          asset,
          fileName,
        },
        { jobId: randomUUID() },
      );
    }
  }
}
