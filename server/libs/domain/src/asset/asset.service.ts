import { AssetEntity, AssetType } from '@app/infra/db/entities';
import { Inject } from '@nestjs/common';
import { IAssetUploadedJob, IJobRepository, JobName } from '../job';
import { AssetCore } from './asset.core';
import { IAssetRepository } from './asset.repository';

export class AssetService {
  private assetCore: AssetCore;

  constructor(
    @Inject(IAssetRepository) assetRepository: IAssetRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
  ) {
    this.assetCore = new AssetCore(assetRepository, jobRepository);
  }

  async handleAssetUpload(data: IAssetUploadedJob) {
    await this.jobRepository.queue({ name: JobName.GENERATE_JPEG_THUMBNAIL, data });

    if (data.asset.type == AssetType.VIDEO) {
      await this.jobRepository.queue({ name: JobName.VIDEO_CONVERSION, data });
      await this.jobRepository.queue({ name: JobName.EXTRACT_VIDEO_METADATA, data });
    } else {
      await this.jobRepository.queue({ name: JobName.EXIF_EXTRACTION, data });
    }
  }

  save(asset: Partial<AssetEntity>) {
    return this.assetCore.save(asset);
  }
}
