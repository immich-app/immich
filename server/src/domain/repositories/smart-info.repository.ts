import { AssetEntity, SmartInfoEntity } from '@app/infra/entities';
import { Embedding, EmbeddingSearch } from '../repositories';

export const ISmartInfoRepository = 'ISmartInfoRepository';

export interface ISmartInfoRepository {
  searchByEmbedding(search: EmbeddingSearch): Promise<AssetEntity[]>;
  upsert(smartInfo: Partial<SmartInfoEntity>, embedding?: Embedding): Promise<void>;
}
