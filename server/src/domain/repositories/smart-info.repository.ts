import { SmartInfoEntity } from '@app/infra/entities';

export const ISmartInfoRepository = 'ISmartInfoRepository';

export interface ISmartInfoRepository {
  upsert(info: Partial<SmartInfoEntity>): Promise<void>;
}
