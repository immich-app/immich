import { AssetFaceEntity, PersonEntity } from '@app/infra/entities';

export const IFacialRecognitionRepository = 'IFacialRecognitionRepository';

export interface IFacialRecognitionRepository {
  save(personEntity: Partial<PersonEntity>, assetFaceEntity: Partial<AssetFaceEntity>): Promise<void>;
}
