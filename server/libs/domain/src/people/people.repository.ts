import { AssetEntity, AssetFaceEntity, PersonEntity } from '@app/infra/entities';

export const IPeopleRepository = 'IPeopleRepository';

export interface AssetFaceId {
  assetId: string;
  personId: string;
}

export interface IPeopleRepository {
  create(entity: Partial<PersonEntity>): Promise<PersonEntity>;
  getById(userId: string, personId: string): Promise<PersonEntity | null>;
  getAll(userId: string): Promise<PersonEntity[]>;
  save(entity: Partial<PersonEntity>): Promise<PersonEntity>;
  getPersonAssets(id: string): Promise<AssetEntity[]>;

  // faces
  getAllFaces(): Promise<AssetFaceEntity[]>;
  getFaceByIds(ids: AssetFaceId[]): Promise<AssetFaceEntity[]>;
}
