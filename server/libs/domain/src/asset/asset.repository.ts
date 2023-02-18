export const IAssetRepository = 'IAssetRepository';

export interface IAssetRepository {
  deleteAll(ownerId: string): Promise<void>;
}
