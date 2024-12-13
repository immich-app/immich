import { AssetEntity } from 'src/entities/asset.entity';

export const IViewRepository = 'IViewRepository';

export interface IViewRepository {
  getAssetsByOriginalPath(userId: string, partialPath: string): Promise<AssetEntity[]>;
  getUniqueOriginalPaths(userId: string): Promise<string[]>;
}
