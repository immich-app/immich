import { AssetEntity } from '@app/infra/entities';
import { CropFaceResult } from '../media';

export const IFacialRecognitionRepository = 'IFacialRecognitionRepository';

export interface IFacialRecognitionRepository {
  createPerson(embedding: number[], asset: AssetEntity, cropFaceResult: CropFaceResult): Promise<AssetEntity | null>;
}
