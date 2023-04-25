import { AssetEntity } from '@app/infra/entities';

export const IFacialRecognitionRepository = 'IFacialRecognitionRepository';

export interface IFacialRecognitionRepository {
  createPerson(embedding: number[], asset: AssetEntity): Promise<void>;
}
