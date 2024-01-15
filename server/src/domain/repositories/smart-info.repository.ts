import { AssetEntity, AssetFaceEntity, SmartInfoEntity } from '@app/infra/entities';
import { Paginated, PaginationOptions } from '../domain.util';

export const ISmartInfoRepository = 'ISmartInfoRepository';

export type Embedding = number[];

export interface EmbeddingSearch {
  userIds: string[];
  embedding: Embedding;
  numResults: number;
  withArchived?: boolean;
}

export interface FaceEmbeddingSearch extends EmbeddingSearch {
  maxDistance?: number;
  hasPerson?: boolean;
}

export interface FaceSearchResult {
  face: AssetFaceEntity;
  distance: number;
}

export interface ISmartInfoRepository {
  init(modelName: string): Promise<void>;
  searchCLIP(search: EmbeddingSearch, pagination: PaginationOptions): Paginated<AssetEntity>;
  searchFaces(search: FaceEmbeddingSearch): Promise<FaceSearchResult[]>;
  upsert(smartInfo: Partial<SmartInfoEntity>, embedding?: Embedding): Promise<void>;
}
