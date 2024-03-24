import { AssetDuplicateEntity } from 'src/entities/asset-duplicate.entity';

export const IAssetDuplicateRepository = 'IAssetDuplicateRepository';

export interface IAssetDuplicateRepository {
  upsert(id: string, assetIds: string[], oldDuplicateIds?: string[]): Promise<void>;
  delete(id: string): Promise<void>;
  getById(id: string): Promise<AssetDuplicateEntity | null>;
}
