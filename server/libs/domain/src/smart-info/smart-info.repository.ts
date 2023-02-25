import { SmartInfoEntity } from '@app/infra/db/entities';

export const ISmartInfoRepository = 'ISmartInfoRepository';

export interface ISmartInfoRepository {
  upsert(info: Partial<SmartInfoEntity>): Promise<void>;
}
