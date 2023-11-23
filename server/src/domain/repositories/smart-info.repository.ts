import { Embedding, EmbeddingSearch } from '@app/domain';
import { AssetEntity, SmartInfoEntity } from '@app/infra/entities';

export const ISmartInfoRepository = 'ISmartInfoRepository';

export interface ISmartInfoRepository {
  searchByEmbedding(search: EmbeddingSearch): Promise<AssetEntity[]>;
  upsert(smartInfo: Partial<SmartInfoEntity>, embedding?: Embedding): Promise<void>;
}
