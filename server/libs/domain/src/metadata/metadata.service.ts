import { AssetType } from '@app/infra/entities';
import { Inject, Logger } from '@nestjs/common';
import { constants } from 'fs/promises';
import { AssetCore, IAssetRepository, WithoutProperty, WithProperty } from '../asset';
import { usePagination } from '../domain.util';
import { IAssetJob, IBaseJob, IJobRepository, JobName, JOBS_ASSET_PAGINATION_SIZE } from '../job';
import { IStorageRepository } from '../storage';

export class MetadataService {
  private logger = new Logger(MetadataService.name);
  private assetCore: AssetCore;

  constructor(
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
    @Inject(IStorageRepository) private storageRepository: IStorageRepository,
  ) {
    this.assetCore = new AssetCore(assetRepository, jobRepository);
  }

  async handleQueueSidecar(job: IBaseJob) {
    try {
      const { force } = job;
      const assetPagination = usePagination(JOBS_ASSET_PAGINATION_SIZE, (pagination) => {
        return force
          ? this.assetRepository.getWith(pagination, WithProperty.SIDECAR)
          : this.assetRepository.getWithout(pagination, WithoutProperty.SIDECAR);
      });

      for await (const assets of assetPagination) {
        for (const asset of assets) {
          const name = force ? JobName.SIDECAR_SYNC : JobName.SIDECAR_DISCOVERY;
          await this.jobRepository.queue({ name, data: { asset } });
        }
      }
    } catch (error: any) {
      this.logger.error(`Unable to queue sidecar scanning`, error?.stack);
    }
  }

  async handleSidecarSync(job: IAssetJob) {
    const { asset } = job;
    if (!asset.isVisible) {
      return;
    }

    try {
      const name = asset.type === AssetType.VIDEO ? JobName.EXTRACT_VIDEO_METADATA : JobName.EXIF_EXTRACTION;
      await this.jobRepository.queue({ name, data: { asset } });
    } catch (error: any) {
      this.logger.error(`Unable to queue metadata extraction`, error?.stack);
    }
  }

  async handleSidecarDiscovery(job: IAssetJob) {
    let { asset } = job;
    if (!asset.isVisible || asset.sidecarPath) {
      return;
    }

    try {
      const sidecarPath = `${asset.originalPath}.xmp`;
      const exists = await this.storageRepository.checkFileExists(sidecarPath, constants.W_OK);
      if (!exists) {
        return;
      }

      asset = await this.assetCore.save({ id: asset.id, sidecarPath });
      // TODO: optimize to only queue assets with recent xmp changes
      const name = asset.type === AssetType.VIDEO ? JobName.EXTRACT_VIDEO_METADATA : JobName.EXIF_EXTRACTION;
      await this.jobRepository.queue({ name, data: { asset } });
    } catch (error: any) {
      this.logger.error(`Unable to queue metadata extraction: ${error}`, error?.stack);
      return;
    }
  }
}
