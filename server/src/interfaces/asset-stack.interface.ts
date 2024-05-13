import { AssetStackEntity } from 'src/entities/asset-stack.entity';

export const IAssetStackRepository = 'IAssetStackRepository';

export interface IAssetStackRepository {
  create(assetStack: Partial<AssetStackEntity>): Promise<AssetStackEntity>;
  update(asset: Pick<AssetStackEntity, 'id'> & Partial<AssetStackEntity>): Promise<AssetStackEntity>;
  delete(id: string): Promise<void>;
  getById(id: string): Promise<AssetStackEntity | null>;
}
