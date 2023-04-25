import { AssetEntity, AssetFaceEntity, PersonEntity } from '@app/infra/entities';
import { CropFaceResult } from '../media';

export const IFacialRecognitionRepository = 'IFacialRecognitionRepository';

export interface IFacialRecognitionRepository {
  save(personEntity: Partial<PersonEntity>, assetFaceEntity: Partial<AssetFaceEntity>): Promise<void>;
}
