import { SmartInfoEntity } from '@app/infra/entities/index.js';

export const ISmartInfoRepository = 'ISmartInfoRepository';

export interface ISmartInfoRepository {
  upsert(info: Partial<SmartInfoEntity>): Promise<void>;
}
