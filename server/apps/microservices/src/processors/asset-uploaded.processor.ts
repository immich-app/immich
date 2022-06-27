import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { AssetEntity, AssetType } from '@app/database/entities/asset.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';

@Processor('asset-uploaded-queue')
export class AssetUploadedProcessor {
  constructor(
    @InjectQueue('thumbnail-generator-queue')
    private thumbnailGeneratorQueue: Queue,

    @InjectQueue('metadata-extraction-queue')
    private metadataExtractionQueue: Queue,

    @InjectQueue('video-conversion-queue')
    private videoConversionQueue: Queue,

    @InjectRepository(AssetEntity)
    private assetRepository: Repository<AssetEntity>,
  ) {}

  /**
   * Post processing uploaded asset to perform the following function if missing
   * 1. Generate JPEG Thumbnail
   * 2. Generate Webp Thumbnail <-> if JPEG thumbnail exist
   * 3. EXIF extractor
   * 4. Reverse Geocoding
   *
   * @param job asset-uploaded
   */
  @Process('asset-uploaded')
  async processUploadedVideo(job: Job) {
    const {
      asset,
      fileName,
      fileSize,
      hasThumbnail,
    }: { asset: AssetEntity; fileName: string; fileSize: number; hasThumbnail: boolean } = job.data;

    if (hasThumbnail) {
      // The jobs below depends on the existence of jpeg thumbnail
      await this.thumbnailGeneratorQueue.add('generate-webp-thumbnail', { asset }, { jobId: randomUUID() });
      await this.metadataExtractionQueue.add('tag-image', { asset }, { jobId: randomUUID() });
      await this.metadataExtractionQueue.add('detect-object', { asset }, { jobId: randomUUID() });
    } else {
      // Generate Thumbnail -> Then generate webp, tag image and detect object
      await this.thumbnailGeneratorQueue.add('generate-jpeg-thumbnail', { asset }, { jobId: randomUUID() });
    }

    // Video Conversion
    if (asset.type == AssetType.VIDEO) {
      await this.videoConversionQueue.add('mp4-conversion', { asset }, { jobId: randomUUID() });
    } else {
      // Extract Metadata/Exif for Images - Currently the library cannot extract EXIF for video yet
      await this.metadataExtractionQueue.add(
        'exif-extraction',
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
      await this.metadataExtractionQueue.add('extract-video-length', { asset }, { jobId: randomUUID() });
    }
  }
}
