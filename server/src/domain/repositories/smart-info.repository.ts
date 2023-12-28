import { AssetEntity, AssetFaceEntity, SmartInfoEntity } from '@app/infra/entities';

export const ISmartInfoRepository = 'ISmartInfoRepository';

export type Embedding = number[];

export interface EmbeddingSearch {
  ownerId: string;
  personId?: string;
  embedding: Embedding;
  numResults: number;
  maxDistance?: number;
}

export interface ISmartInfoRepository {
  init(modelName: string): Promise<void>;
  searchCLIP(search: EmbeddingSearch): Promise<AssetEntity[]>;
  searchFaces(search: EmbeddingSearch): Promise<AssetFaceEntity[]>;
  searchPersonFaces(search: EmbeddingSearch): Promise<any>;
  upsert(smartInfo: Partial<SmartInfoEntity>, embedding?: Embedding): Promise<void>;
}
