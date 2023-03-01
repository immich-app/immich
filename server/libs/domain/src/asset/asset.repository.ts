import { AssetEntity, AssetType } from '@app/infra/db/entities';

export const IAssetRepository = 'IAssetRepository';

export interface IAssetRepository {
  deleteAll(ownerId: string): Promise<void>;
  getAll(): Promise<AssetEntity[]>;
  save(asset: Partial<AssetEntity>): Promise<AssetEntity>;
  findLivePhotoMatch(livePhotoCID: string, otherAssetId: string, type: AssetType): Promise<AssetEntity | null>;
}
