import { AssetType } from '@app/infra';
import {
  IAssetUploadedJob,
  IMetadataExtractionJob,
  IThumbnailGenerationJob,
  IVideoTranscodeJob,
  QueueName,
  JobName,
} from '@app/domain';
import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Job, Queue } from 'bull';

@Processor(QueueName.ASSET_UPLOADED)
export class AssetUploadedProcessor {
  constructor(
    @InjectQueue(QueueName.THUMBNAIL_GENERATION)
    private thumbnailGeneratorQueue: Queue<IThumbnailGenerationJob>,

    @InjectQueue(QueueName.METADATA_EXTRACTION)
    private metadataExtractionQueue: Queue<IMetadataExtractionJob>,

    @InjectQueue(QueueName.VIDEO_CONVERSION)
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
  @Process(JobName.ASSET_UPLOADED)
  async processUploadedVideo(job: Job<IAssetUploadedJob>) {
    const { asset, fileName } = job.data;

    await this.thumbnailGeneratorQueue.add(JobName.GENERATE_JPEG_THUMBNAIL, { asset });

    // Video Conversion
    if (asset.type == AssetType.VIDEO) {
      await this.videoConversionQueue.add(JobName.MP4_CONVERSION, { asset });
      await this.metadataExtractionQueue.add(JobName.EXTRACT_VIDEO_METADATA, { asset, fileName });
    } else {
      // Extract Metadata/Exif for Images - Currently the EXIF library on the web cannot extract EXIF for video yet
      await this.metadataExtractionQueue.add(JobName.EXIF_EXTRACTION, { asset, fileName });
    }
  }
}
