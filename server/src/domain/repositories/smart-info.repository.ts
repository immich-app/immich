import { AssetEntity, AssetFaceEntity, SmartInfoEntity } from '@app/infra/entities';

export const ISmartInfoRepository = 'ISmartInfoRepository';

export type Embedding = number[];

export interface EmbeddingSearch {
  userIds: string[];
  embedding: Embedding;
  numResults?: number;
  withArchived?: boolean;
}

export interface FaceEmbeddingSearch extends EmbeddingSearch {
  maxDistance?: number;
  noPerson?: boolean;
  hasPerson?: boolean;
}

export interface FaceEmbeddingDensitySearch {
  k: number;
  maxDistance: number;
}

export interface FaceEmbeddingDensityResult {
  faceId: string;
  density: number;
}

export interface FaceSearchResult {
  face: AssetFaceEntity;
  distance: number;
}

export interface ISmartInfoRepository {
  init(modelName: string): Promise<void>;
  searchCLIP(search: EmbeddingSearch): Promise<AssetEntity[]>;
  searchFaces(search: FaceEmbeddingSearch): Promise<FaceSearchResult[]>;
  getFaceDensities(search: FaceEmbeddingDensitySearch): Promise<FaceEmbeddingDensityResult[]>;
  upsert(smartInfo: Partial<SmartInfoEntity>, embedding?: Embedding): Promise<void>;
}
