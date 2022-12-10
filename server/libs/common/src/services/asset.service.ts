import { AssetType } from '../models';

export type ServerUsageItems = ServerUsageItem[];
export interface ServerUsageItem {
  userId: string;
  assetType: AssetType;
  assetCount: number;
  totalSizeInBytes: number;
}

export const IAssetRepository = 'AssetRepository';

export interface IAssetRepository {
  getUserStats(): Promise<ServerUsageItems>;
}
