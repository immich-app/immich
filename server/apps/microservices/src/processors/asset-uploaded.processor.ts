import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { AssetEntity } from '@app/database/entities/asset.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Processor('asset-uploaded-queue')
export class AssetUploadedProcessor {
  constructor(
    @InjectQueue('thumbnail-generator-queue')
    private thumbnailGeneratorQueue: Queue,

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
    const { asset }: { asset: AssetEntity } = job.data;

    const recentAsset = await this.assetRepository.findOne({ id: asset.id });

    if (!recentAsset.webpPath && recentAsset.resizePath) {
      this.thumbnailGeneratorQueue.add('generate-webp-thumbnail', { asset: recentAsset }, { jobId: asset.id });
    }
  }
}
