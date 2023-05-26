import { Inject } from '@nestjs/common';
import { constants } from 'fs/promises';
import { IAssetRepository, WithoutProperty, WithProperty } from '../asset';
import { usePagination } from '../domain.util';
import { IBaseJob, IEntityJob, IJobRepository, JobName, JOBS_ASSET_PAGINATION_SIZE } from '../job';
import { IStorageRepository } from '../storage';

export class MetadataService {
  constructor(
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
    @Inject(IStorageRepository) private storageRepository: IStorageRepository,
  ) {}

  async handleQueueSidecar(job: IBaseJob) {
    const { force } = job;
    const assetPagination = usePagination(JOBS_ASSET_PAGINATION_SIZE, (pagination) => {
      return force
        ? this.assetRepository.getWith(pagination, WithProperty.SIDECAR)
        : this.assetRepository.getWithout(pagination, WithoutProperty.SIDECAR);
    });

    for await (const assets of assetPagination) {
      for (const asset of assets) {
        const name = force ? JobName.SIDECAR_SYNC : JobName.SIDECAR_DISCOVERY;
        await this.jobRepository.queue({ name, data: { id: asset.id } });
      }
    }

    return true;
  }

  async handleSidecarSync() {
    // TODO: optimize to only queue assets with recent xmp changes
    return true;
  }

  async handleSidecarDiscovery({ id }: IEntityJob) {
    const [asset] = await this.assetRepository.getByIds([id]);
    if (!asset || !asset.isVisible || asset.sidecarPath) {
      return false;
    }

    const sidecarPath = `${asset.originalPath}.xmp`;
    const exists = await this.storageRepository.checkFileExists(sidecarPath, constants.W_OK);
    if (!exists) {
      return false;
    }

    await this.assetRepository.save({ id: asset.id, sidecarPath });

    return true;
  }
}
