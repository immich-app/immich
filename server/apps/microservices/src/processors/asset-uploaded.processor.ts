import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { AssetEntity } from '@app/database/entities/asset.entity';
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
    const { asset, fileName, fileSize }: { asset: AssetEntity; fileName: string; fileSize: number } = job.data;

    const recentAsset = await this.assetRepository.findOne({ id: asset.id });

    // Generate Webp path
    if (!recentAsset.webpPath && recentAsset.resizePath) {
      this.thumbnailGeneratorQueue.add('generate-webp-thumbnail', { asset: recentAsset }, { jobId: asset.id });
    }

    // Generate Thumbnail

    // Extract Metadata/Exif
    await this.metadataExtractionQueue.add(
      'exif-extraction',
      {
        savedAsset: recentAsset,
        fileName,
        fileSize,
      },
      { jobId: randomUUID() },
    );
  }
}
