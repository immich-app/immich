import { AssetEntity } from '@app/infra/entities';
import { IJobRepository, JobName } from '../job';
import { AssetSearchOptions, IAssetRepository, LivePhotoSearchOptions } from './asset.repository';

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

  findLivePhotoMatch(options: LivePhotoSearchOptions): Promise<AssetEntity | null> {
    return this.assetRepository.findLivePhotoMatch(options);
  }
}
