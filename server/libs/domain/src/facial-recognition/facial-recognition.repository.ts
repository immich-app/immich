import { AssetEntity, AssetFaceEntity, PersonEntity } from '@app/infra/entities';

export const IFacialRecognitionRepository = 'IFacialRecognitionRepository';

export interface IFacialRecognitionRepository {
  createAssetFace(entity: Partial<AssetFaceEntity>): Promise<AssetFaceEntity>;
  createPerson(entity: Partial<PersonEntity>): Promise<PersonEntity>;
  savePerson(entity: Partial<PersonEntity>): Promise<PersonEntity>;
  getById(id: string): Promise<PersonEntity | null>;
  getAll(userId: string): Promise<PersonEntity[]>;
  getPersonAssets(id: string): Promise<AssetEntity[]>;
}
