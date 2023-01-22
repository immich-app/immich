import { SharedLinkEntity } from '@app/infra/db/entities';

export const ISharedLinkRepository = 'ISharedLinkRepository';

export interface ISharedLinkRepository {
  get(userId: string): Promise<SharedLinkEntity[]>;
  getById(id: string): Promise<SharedLinkEntity | null>;
  getByIdAndUserId(id: string, userId: string): Promise<SharedLinkEntity | null>;
  getByKey(key: string): Promise<SharedLinkEntity | null>;
  create(payload: SharedLinkEntity): Promise<SharedLinkEntity>;
  remove(entity: SharedLinkEntity): Promise<SharedLinkEntity>;
  save(entity: SharedLinkEntity): Promise<SharedLinkEntity>;
  hasAssetAccess(id: string, assetId: string): Promise<boolean>;
}
