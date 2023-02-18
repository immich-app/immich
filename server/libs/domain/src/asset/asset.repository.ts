import { AssetEntity } from '@app/infra/db/entities';

export const IAssetRepository = 'IAssetRepository';

export interface IAssetRepository {
  deleteAll(ownerId: string): Promise<void>;
  getAll(): Promise<AssetEntity[]>;
  save(asset: Partial<AssetEntity>): Promise<AssetEntity>;
}
