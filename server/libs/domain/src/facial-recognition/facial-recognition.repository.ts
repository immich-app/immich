import { AssetFaceEntity, PersonEntity } from '@app/infra/entities';

export const IFacialRecognitionRepository = 'IFacialRecognitionRepository';

export interface IFacialRecognitionRepository {
  createAssetFace(entity: Partial<AssetFaceEntity>): Promise<AssetFaceEntity>;
  createPerson(entity: Partial<PersonEntity>): Promise<PersonEntity>;
  savePerson(entity: Partial<PersonEntity>): Promise<PersonEntity>;
  getById(id: string): Promise<PersonEntity | null>;
  getFaces(userId: string): Promise<PersonEntity[]>;
}
