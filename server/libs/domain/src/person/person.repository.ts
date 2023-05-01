import { AssetEntity, AssetFaceEntity, PersonEntity } from '@app/infra/entities';

export const IPersonRepository = 'IPersonRepository';

export interface AssetFaceId {
  assetId: string;
  personId: string;
}

export interface IPersonRepository {
  getAll(userId: string): Promise<PersonEntity[]>;
  getById(userId: string, personId: string): Promise<PersonEntity | null>;
  getAssets(userId: string, id: string): Promise<AssetEntity[]>;

  create(entity: Partial<PersonEntity>): Promise<PersonEntity>;
  update(entity: Partial<PersonEntity>): Promise<PersonEntity>;

  // faces
  getAllFaces(): Promise<AssetFaceEntity[]>;
  getFaceByIds(ids: AssetFaceId[]): Promise<AssetFaceEntity[]>;
}
