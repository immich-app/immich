import { AssetEntity, AssetType } from '@app/infra/db/entities';

export interface AssetSearchOptions {
  isVisible?: boolean;
}

export const IAssetRepository = 'IAssetRepository';

export interface IAssetRepository {
  deleteAll(ownerId: string): Promise<void>;
  getAll(options?: AssetSearchOptions): Promise<AssetEntity[]>;
  save(asset: Partial<AssetEntity>): Promise<AssetEntity>;
  findLivePhotoMatch(livePhotoCID: string, otherAssetId: string, type: AssetType): Promise<AssetEntity | null>;
}
