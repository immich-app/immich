import { AssetFaceEntity } from '@app/infra/entities';

export const IFacialRecognitionRepository = 'IFacialRecognitionRepository';

export interface IFacialRecognitionRepository {
  createAssetFace(entity: Partial<AssetFaceEntity>): Promise<AssetFaceEntity>;
}
