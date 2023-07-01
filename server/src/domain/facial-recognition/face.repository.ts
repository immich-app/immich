import { AssetFaceEntity } from '@app/infra/entities/index.js';

export const IFaceRepository = 'IFaceRepository';

export interface AssetFaceId {
  assetId: string;
  personId: string;
}

export interface IFaceRepository {
  getAll(): Promise<AssetFaceEntity[]>;
  getByIds(ids: AssetFaceId[]): Promise<AssetFaceEntity[]>;
  create(entity: Partial<AssetFaceEntity>): Promise<AssetFaceEntity>;
}
