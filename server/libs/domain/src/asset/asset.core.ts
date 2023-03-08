import { AssetEntity, AssetType } from '@app/infra/db/entities';
import { IJobRepository, JobName } from '../job';
import { AssetSearchOptions, IAssetRepository } from './asset.repository';

export class AssetCore {
  constructor(private assetRepository: IAssetRepository, private jobRepository: IJobRepository) {}

  getAll(options: AssetSearchOptions) {
    return this.assetRepository.getAll(options);
  }

  async save(asset: Partial<AssetEntity>) {
    const _asset = await this.assetRepository.save(asset);
    await this.jobRepository.queue({
      name: JobName.SEARCH_INDEX_ASSET,
      data: { ids: [_asset.id] },
    });
    return _asset;
  }

  findLivePhotoMatch(livePhotoCID: string, otherAssetId: string, type: AssetType): Promise<AssetEntity | null> {
    return this.assetRepository.findLivePhotoMatch(livePhotoCID, otherAssetId, type);
  }
}
