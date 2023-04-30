import { AssetEntity, AssetFaceEntity, PersonEntity } from '@app/infra/entities';

export const IPersonRepository = 'IPersonRepository';

export interface AssetFaceId {
  assetId: string;
  personId: string;
}

export interface IPersonRepository {
  create(entity: Partial<PersonEntity>): Promise<PersonEntity>;
  getById(userId: string, personId: string): Promise<PersonEntity | null>;
  getAll(userId: string): Promise<PersonEntity[]>;
  save(entity: Partial<PersonEntity>): Promise<PersonEntity>;
  getAssets(id: string): Promise<AssetEntity[]>;
  update(entity: Partial<PersonEntity>): Promise<PersonEntity>;

  // faces
  getAllFaces(): Promise<AssetFaceEntity[]>;
  getFaceByIds(ids: AssetFaceId[]): Promise<AssetFaceEntity[]>;
}
